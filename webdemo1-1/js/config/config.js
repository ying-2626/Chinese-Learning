const CONFIG = {
    // 部署到服务器后使用域名
    BACKEND_API: 'https://shengdonghanyu.com',
    
    // FastGPT API - TODO: 迁移到后端代理
    // 警告：此密钥已泄露，需要立即轮换
    FASTGPT: {
        API_KEY: 'Bearer YOUR_FASTGPT_API_KEY_HERE'
    },
    
    // 腾讯云语音评测配置
    // 注意：敏感密钥已迁移到后端，前端不再存储
    TENCENT: {
        // APPID 可以保留在前端，用于标识应用
        APPID: "YOUR_TENCENT_APPID_HERE"
    },
    
    // 讯飞语音配置 - TODO: 迁移到后端代理
    // 警告：此密钥已泄露，需要立即轮换
    XUNFEI: {
        APPID: "YOUR_XUNFEI_APPID_HERE",
        API_SECRET: "YOUR_XUNFEI_API_SECRET_HERE",
        API_KEY: "YOUR_XUNFEI_API_KEY_HERE"
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
