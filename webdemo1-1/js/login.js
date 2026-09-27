const loginForm = document.getElementById('LoginForm');
const loginButton = document.getElementById('login');

loginForm.addEventListener('submit', event => {
    event.preventDefault();
    dologin();
});

async function dologin() {
    if (loginButton.disabled || !loginForm.reportValidity()) return;
    loginButton.disabled = true;
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
        localStorage.setItem('user_info', JSON.stringify(response.data.result));
        window.location.href = 'index.html';
    } catch (error) {
        alert('登录失败：' + (error.response?.data?.message || error.message));
    } finally {
        loginButton.disabled = false;
    }
}
