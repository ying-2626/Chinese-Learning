const CONFIG = {
    // 部署到服务器后使用域名
    BACKEND_API: 'https://shengdonghanyu.com',
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