//检查两次输入密码是否一致
let password = document.querySelector('.password');
let password1 = document.querySelector('.password1');
password1.addEventListener('input', function () {
    let error = document.querySelector('.error');
    if (password.value != password1.value) {
        error.style.color = 'red';
    } else {
        error.style.color = '#f3f3f3';
    }
})


let GetCode = document.querySelector('.GetCode');
let re = /^\w+@[a-zA-Z0-9]{2,10}(?:\.[a-z]{2,4}){1,3}$/;
GetCode.addEventListener('click', function (e) {
    e.preventDefault(); // Prevent form submission
    let email = document.querySelector('.email').value;
    // alert(email)
    // alert(typeof (email));
    //GetCode时检查输入邮箱是否合法
    if (re.test(email)) {
        // alert('code has been sent to your email');
    } else {
        alert('please enter a valid email');
        return;
    }
    //GetCode时发送请求
    GetCode.disabled = true;
    GetCode.textContent = "发送中...";
    GetCode.style.backgroundColor = '#ccc';
    GetCode.style.cursor = 'not-allowed';

    axios({
        url: CONFIG.BACKEND_API + '/user/sendCode',
        method: 'post',
        params: {
            email: email
        },
        withCredentials: true
    }).then(function (response) {
        console.log(response);
        if (response.data.code === 0) {
            alert('Code sent successfully to ' + email);
            // Optional: Start a countdown here
        } else {
            alert(response.data.message);
        }
    }).catch(function (error) {
        console.error(error);
        alert("Failed to send code: " + (error.response?.data?.message || error.message));
    }).finally(function () {
        GetCode.disabled = false;
        GetCode.textContent = "获取验证码"; // Or restore original text
        GetCode.style.backgroundColor = ''; // Restore original style
        GetCode.style.cursor = 'pointer';
    });

})


//注册时发送请求
let loginButton = document.querySelector('.button');
/*
function base64Encode(str) {
    // 将字符串转换为Uint8Array
    const utf8 = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
        utf8[i] = str.charCodeAt(i);
    }
    // 使用btoa()进行Base64编码
    return btoa(String.fromCharCode.apply(null, utf8));
}
*/
function dologin() {
    let input_code = document.querySelector('.code').value;
    let email = document.querySelector('.email').value;
    let user_name = document.querySelector('.username');
    let password = document.querySelector('.password');

    // Verify Code first
    axios({
        url: CONFIG.BACKEND_API + '/user/verifyCode',
        method: 'post',
        params: {
            email: email,
            code: input_code
        },
        withCredentials: true
    }).then(function (verifyResponse) {
        if (verifyResponse.data.code === 0) {
            // Code verified, proceed to signup
            axios({
                url: CONFIG.BACKEND_API + '/user/signup',
                method: 'post',
                params: {
                    username: user_name.value,
                    email: email,
                    password: password.value
                },
                withCredentials: true
            }).then(function (response) {
                console.log(response);
                if (response.data.code === 0) {
                    alert("注册成功！正在自动登录...");
                    // Auto Login
                    axios({
                        url: CONFIG.BACKEND_API + '/user/login',
                        method: 'post',
                        params: {
                            "username": user_name.value,
                            "password": password.value
                        },
                        withCredentials: true
                    }).then(function (loginResponse) {
                        if (loginResponse.data.code === 0) {
                            localStorage.setItem("user_info", JSON.stringify(loginResponse.data.result));
                            window.location.href = 'index.html';
                        } else {
                            alert("自动登录失败，请手动登录: " + loginResponse.data.message);
                            window.location.href = 'login.html';
                        }
                    }).catch(function (loginError) {
                        console.error(loginError);
                        alert("自动登录出错: " + (loginError.response?.data?.message || loginError.message));
                        window.location.href = 'login.html';
                    });
                } else {
                    alert(response.data.message);
                }
            }).catch(function (error) {
                console.error(error);
                alert("Registration failed: " + (error.response?.data?.message || error.message));
            });
        } else {
            alert("Verification failed: " + verifyResponse.data.message);
        }
    }).catch(function (error) {
        console.error(error);
        alert("Verification error: " + (error.response?.data?.message || error.message));
    });
}
