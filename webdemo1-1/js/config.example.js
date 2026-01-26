const CONFIG = {
    // 自动判断环境，优先使用 localhost 以避免跨域 Cookie 问题
    BACKEND_API: window.location.hostname === '127.0.0.1'
        ? 'http://127.0.0.1:8088'
        : 'http://localhost:8088',
    FASTGPT: {
        API_KEY: 'YOUR_FASTGPT_API_KEY'
    },
    TENCENT: {
        APPID: "YOUR_TENCENT_APPID",
        SECRET_ID: "YOUR_TENCENT_SECRET_ID",
        SECRET_KEY: "YOUR_TENCENT_SECRET_KEY"
    },
    XUNFEI: {
        APPID: "YOUR_XUNFEI_APPID",
        API_SECRET: "YOUR_XUNFEI_API_SECRET",
        API_KEY: "YOUR_XUNFEI_API_KEY"
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
