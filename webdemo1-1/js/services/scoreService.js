const ScoreService = {
    /**
     * 创建评分记录
     * @param {Object} scoreData - 评分数据
     * @returns {Promise}
     */
    createScoreAction: function (scoreData) {
        const userInfo = JSON.parse(localStorage.getItem("user_info") || "{}");
        const sessionId = userInfo.sessionId;

        return axios({
            url: CONFIG.BACKEND_API + '/scoreAction/createScoreAction',
            method: 'post',
            data: scoreData,
            headers: {
                'Content-Type': 'application/json',
                'session': sessionId // Add session header
            },
            withCredentials: true
        });
    },

    /**
     * 上传音频文件
     * @param {Blob|File} audioFile - 音频文件对象
     * @returns {Promise<string>} - 返回音频文件的URL
     */
    uploadAudioFile: function (audioFile) {
        const userInfo = JSON.parse(localStorage.getItem("user_info") || "{}");
        const sessionId = userInfo.sessionId;

        const formData = new FormData();
        formData.append('audioFile', audioFile, 'recording.mp3');

        return axios({
            url: CONFIG.BACKEND_API + '/scoreAction/uploadAudioFile',
            method: 'post',
            data: formData,
            headers: {
                'Content-Type': 'multipart/form-data',
                'session': sessionId // Add session header
            },
            withCredentials: true
        }).then(response => {
            if (response.data.code === 0) {
                return response.data.result;
            } else {
                throw new Error(response.data.message);
            }
        });
    },

    /**
     * 查找当前用户的评分记录
     * @returns {Promise<Array>}
     */
    findCurrentUserScoreActions: function () {
        const userInfo = JSON.parse(localStorage.getItem("user_info") || "{}");
        const sessionId = userInfo.sessionId;

        return axios({
            url: CONFIG.BACKEND_API + '/user/findCurrentUserScoreActions',
            method: 'get',
            headers: {
                'session': sessionId // Add session header
            },
            withCredentials: true
        }).then(response => {
            if (response.data.code === 0) {
                // Check if result is 0 (which seems to be returned when no list is found or user has no scores)
                // The user reported: {"code":0,"message":"操作成功！","result":0}
                if (response.data.result === 0) {
                    return [];
                }
                return response.data.result;
            } else {
                throw new Error(response.data.message);
            }
        });
    },

    /**
     * 查找所有评分记录 (管理员用)
     * @returns {Promise<Array>}
     */
    findAllScoreActions: function () {
        const userInfo = JSON.parse(localStorage.getItem("user_info") || "{}");
        const sessionId = userInfo.sessionId;

        return axios({
            url: CONFIG.BACKEND_API + '/scoreAction/findAllScoreActions',
            method: 'get',
            headers: {
                'session': sessionId // Add session header
            },
            withCredentials: true
        }).then(response => {
            if (response.data.code === 0) {
                return response.data.result;
            } else {
                throw new Error(response.data.message);
            }
        });
    }
};

window.ScoreService = ScoreService;
