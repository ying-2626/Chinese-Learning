"""Exercise existing business APIs against the isolated local development database.

Uses synthetic accounts and clearly labelled score data. Does not call AI providers.
The test SMTP sink must be running; no real email is delivered.
"""
import argparse
import email
import io
import json
from pathlib import Path
import re
import secrets
import time
import urllib.error
import urllib.parse
import urllib.request
import wave

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--base', default='http://127.0.0.1:4195')
args = parser.parse_args()
if urllib.parse.urlsplit(args.base).hostname not in {'127.0.0.1', 'localhost', '::1'}:
    parser.error('Only the isolated local development server is supported')


def request(path, method='GET', values=None, session=None, form=False, raw=None, content_type=None):
    headers = {}
    if session:
        headers['session'] = session
    data = raw
    if values is not None:
        data = urllib.parse.urlencode(values).encode() if form else json.dumps(values).encode()
        headers['Content-Type'] = 'application/x-www-form-urlencoded' if form else 'application/json'
    if content_type:
        headers['Content-Type'] = content_type
    req = urllib.request.Request(args.base + path, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=20) as response:
            return json.load(response)
    except urllib.error.HTTPError as error:
        return json.load(error)


def success(response):
    assert response.get('code') == 0, response.get('message', response)
    return response.get('result')


def register(suffix):
    username = 'ui_local_' + suffix
    address = username + '@example.invalid'
    password = secrets.token_urlsafe(18)
    started = time.time()
    success(request('/user/sendCode', 'POST', {'email': address}, form=True))
    code = None
    for path in sorted((root / '.local/mail').glob('*.eml'), reverse=True):
        if path.stat().st_mtime < started:
            continue
        message = email.message_from_bytes(path.read_bytes())
        if address not in message.get('To', ''):
            continue
        for part in message.walk():
            if part.get_content_type() == 'text/html':
                body = part.get_payload(decode=True).decode(part.get_content_charset() or 'utf-8')
                match = re.search(r'font-weight: 700">([^<]+)</span>', body)
                if match:
                    code = match.group(1)
    assert code, 'Local SMTP sink did not receive the verification email'
    assert success(request('/user/verifyCode', 'POST', {'email': address, 'code': code}, form=True)) is True
    success(request('/user/signup', 'POST', {'username': username, 'email': address, 'password': password}, form=True))
    login = success(request('/user/login', 'POST', {'username': username, 'password': password}, form=True))
    assert login['id'] and login['sessionId']
    return login


def check(label):
    print('PASS ' + label, flush=True)


stamp = secrets.token_hex(4)
user = register(stamp + '_a')
other = register(stamp + '_b')
session, other_session = user['sessionId'], other['sessionId']
check('验证码经本地测试邮箱收取，注册和真实登录会话建立')
assert success(request('/user/checkLogin', session=session)) == 1
assert request('/user/profile').get('code') != 0
assert request('/user/profile', session='shadow').get('code') != 0
check('未登录和固定测试 session 无法读取个人资料')
profile = {'nativeLanguage': '英语 (美国)', 'currentLevel': 'HSK 3级', 'learningGoal': '本地接口联调', 'learningDirection': '日常交流'}
success(request('/user/updateProfile', 'POST', profile, session))
readback = success(request('/user/profile', session=session))
assert all(readback[k] == v for k, v in profile.items())
check('个人资料修改后从数据库读回')
chat = success(request('/chat/sessions', 'POST', {'title': '本地联调测试'}, session))
chat_id = chat['id']
success(request(f'/chat/sessions/{chat_id}/messages', 'POST', {'role': 'user', 'content': '接口联调测试，不请求 AI 回答。'}, session))
messages = success(request(f'/chat/sessions/{chat_id}/messages', session=session))
assert len(messages) == 1 and messages[0]['content'] == '接口联调测试，不请求 AI 回答。'
success(request(f'/chat/sessions/{chat_id}', 'PUT', {'title': '本地联调已更新'}, session))
assert any(item['title'] == '本地联调已更新' for item in success(request('/chat/sessions', session=session)))
assert request(f'/chat/sessions/{chat_id}/messages', session=other_session).get('code') != 0
assert request(f'/chat/sessions/{chat_id}', 'DELETE', session=other_session).get('code') != 0
success(request(f'/chat/sessions/{chat_id}', 'DELETE', session=session))
assert not success(request('/chat/sessions', session=session))
check('会话创建、消息持久化、改名、删除和跨账号隔离')
wave_bytes = io.BytesIO()
with wave.open(wave_bytes, 'wb') as audio:
    audio.setnchannels(1)
    audio.setsampwidth(2)
    audio.setframerate(16000)
    audio.writeframes(b'\x00\x00' * 1600)
boundary = '----local-test-' + secrets.token_hex(10)
body = (f'--{boundary}\r\nContent-Disposition: form-data; name="audioFile"; filename="local-fixture.wav"\r\nContent-Type: audio/wav\r\n\r\n'.encode()
        + wave_bytes.getvalue() + f'\r\n--{boundary}--\r\n'.encode())
url = success(request('/scoreAction/uploadAudioFile', 'POST', session=session, raw=body, content_type='multipart/form-data; boundary=' + boundary))
assert url.startswith('/audios/')
with urllib.request.urlopen(args.base + url, timeout=10) as response:
    assert response.read() == wave_bytes.getvalue()
score = {'audioUrl': url, 'accuracy': 80, 'fluency': 81, 'completeness': 82, 'initialSoundScore': 83, 'finalSoundScore': 84, 'toneScore': 85, 'totalScore': 82.5,
         'advice': '本地接口联调样例，分数为测试数据，非真实语音测评。'}
success(request('/scoreAction/createScoreAction', 'POST', score, session))
history = success(request('/user/findCurrentUserScoreActions', session=session))
assert len(history) == 1 and history[0]['audioUrl'] == url and history[0]['totalScore'] == 82.5
assert not success(request('/user/findCurrentUserScoreActions', session=other_session))
check('音频上传和同源回放、评分保存、个人历史隔离')
success(request('/user/logout', 'POST', session=session))
assert success(request('/user/checkLogin', session=session)) == 0
assert request('/chat/sessions', session=session).get('code') != 0
check('退出后会话失效')
print('Business API smoke passed. Tencent/FastGPT and real email delivery were not exercised.')
