const registrationForm = document.getElementById('LoginForm');
const passwordInput = document.querySelector('.password');
const confirmationInput = document.querySelector('.password1');
const emailInput = document.querySelector('.email');
const registrationButton = document.getElementById('login');
const codeButton = document.querySelector('.GetCode');

function validatePasswords() {
    const mismatch = confirmationInput.value && passwordInput.value !== confirmationInput.value;
    confirmationInput.setCustomValidity(mismatch ? '两次输入的密码不一致' : '');
    document.querySelector('.error').style.color = mismatch ? 'red' : '';
}
passwordInput.addEventListener('input', validatePasswords);
confirmationInput.addEventListener('input', validatePasswords);
registrationForm.addEventListener('submit', event => {
    event.preventDefault();
    dologin();
});

async function userRequest(action, values) {
    const response = await axios({
        url: CONFIG.BACKEND_API + '/user/' + action,
        method: 'post',
        data: new URLSearchParams(values),
        withCredentials: true
    });
    if (response.data.code !== 0) throw new Error(response.data.message);
    return response.data.result;
}

codeButton.addEventListener('click', async event => {
    event.preventDefault();
    if (codeButton.disabled || !emailInput.reportValidity()) return;
    codeButton.disabled = true;
    codeButton.textContent = '发送中...';
    try {
        await userRequest('sendCode', { email: emailInput.value.trim() });
        alert('验证码已发送');
    } catch (error) {
        alert('验证码发送失败：' + (error.response?.data?.message || error.message));
    } finally {
        codeButton.disabled = false;
        codeButton.textContent = '获取验证码';
    }
});

async function dologin() {
    validatePasswords();
    if (registrationButton.disabled || !registrationForm.reportValidity()) return;
    registrationButton.disabled = true;
    const values = {
        email: emailInput.value.trim(),
        username: document.querySelector('.username').value.trim(),
        password: passwordInput.value
    };
    try {
        const verified = await userRequest('verifyCode', {
            email: values.email,
            code: document.querySelector('.code').value.trim()
        });
        if (verified !== true) throw new Error('验证码错误或已过期');
        await userRequest('signup', values);
        try {
            const user = await userRequest('login', { username: values.username, password: values.password });
            localStorage.setItem('user_info', JSON.stringify(user));
            window.location.href = 'index.html';
        } catch (error) {
            alert('注册成功，请登录');
            window.location.href = 'login.html';
        }
    } catch (error) {
        alert('注册失败：' + (error.response?.data?.message || error.message));
    } finally {
        registrationButton.disabled = false;
    }
}
