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
    //获取User信息
    let user_name = document.querySelector('.username');
    let password = document.querySelector('.password');
    // let password_encoded = base64Encode(password.value);
    
    axios({
        url: CONFIG.BACKEND_API + '/user/login',
        method: 'post',
        params: {
            "username": user_name.value,
            "password": password.value
        },
        withCredentials: true // Important for Session-based auth
    }).then(function (response) {
        console.log(response.data.message);
        if (response.data.code === 0) { // Backend success code is 0
            //alert(response.data)
            window.location.href = 'index.html';
            // Store user info if needed, though session handles auth
            localStorage.setItem("user_info", JSON.stringify(response.data.result));
        } else {
            alert(response.data.message);
        }
    }).catch(function (error) {
        console.error(error);
        alert("Login failed: " + (error.response?.data?.message || error.message));
    });
}
