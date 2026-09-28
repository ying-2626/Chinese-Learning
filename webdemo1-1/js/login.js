const loginForm = document.getElementById('LoginForm');
const loginButton = document.getElementById('login');
const loginStatus = document.getElementById('authStatus');

loginForm.addEventListener('submit', event => {
    event.preventDefault();
    dologin();
});

async function dologin() {
    if (loginButton.disabled || !loginForm.reportValidity()) return;
    loginButton.disabled = true;
    loginButton.setAttribute('aria-busy', 'true');
    loginButton.textContent = '登录中...';
    loginStatus.hidden = true;
    try {
        const response = await axios({
            url: CONFIG.BACKEND_API + '/user/login',
            method: 'post',
            data: new URLSearchParams({
                username: document.querySelector('.username').value.trim(),
                password: document.querySelector('.password').value
            }),
            withCredentials: true
        });
        if (response.data.code !== 0) throw new Error(response.data.message);
        if (!response.data.result?.id || !response.data.result?.sessionId) throw new Error('登录状态返回异常，请重试');
        localStorage.setItem('user_info', JSON.stringify(response.data.result));
        window.location.href = 'index.html';
    } catch (error) {
        const reason = error.response?.data?.message || (error.response?.status >= 500 ? '服务暂不可用，请稍后重试' : error.message === 'Network Error' ? '连接失败，请检查网络' : error.message);
        loginStatus.textContent = '登录失败：' + reason;
        loginStatus.dataset.state = 'error';
        loginStatus.hidden = false;
    } finally {
        loginButton.disabled = false;
        loginButton.removeAttribute('aria-busy');
        loginButton.textContent = '登录';
    }
}
