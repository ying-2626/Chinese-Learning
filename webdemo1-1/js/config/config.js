const CONFIG = {
    // 部署到服务器后使用域名
    BACKEND_API: 'https://shengdonghanyu.com',
    FASTGPT: {
        API_KEY: 'Bearer fastgpt-zqwHxu6FNdgPMOHiSngQkwZmITk9CDHpiPPQknc70ZNOxdIsFKZZvQEc3BkO71P'
    },
    TENCENT: {
        APPID: "1347318735",
        SECRET_ID: "AKIDHPM6g3JNE1ax61jDTWO3XZO0Riz2rTr2",
        SECRET_KEY: "1oPs79h292hARUJwMYYjogT3a8cxGPL3"
    },
    XUNFEI: {
        APPID: "78836aa7",
        API_SECRET: "ZTVjYzEwOGJkZjczNmIyMjJkYjgxOGE1",
        API_KEY: "9939e98c7aa76c1660cb2023ef9fc120"
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}