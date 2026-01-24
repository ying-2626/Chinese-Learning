const ScoreService = {
    /**
     * 创建评分记录
     * @param {Object} scoreData - 评分数据
     * @returns {Promise}
     */
    createScoreAction: function(scoreData) {
        return axios({
            url: CONFIG.BACKEND_API + '/scoreAction/createScoreAction',
            method: 'post',
            data: scoreData,
            headers: {
                'Content-Type': 'application/json'
            },
            withCredentials: true
        });
    },

    /**
     * 上传音频文件
     * @param {Blob|File} audioFile - 音频文件对象
     * @returns {Promise<string>} - 返回音频文件的URL
     */
    uploadAudioFile: function(audioFile) {
        const formData = new FormData();
        formData.append('audioFile', audioFile, 'recording.mp3');

        return axios({
            url: CONFIG.BACKEND_API + '/scoreAction/uploadAudioFile',
            method: 'post',
            data: formData,
            headers: {
                'Content-Type': 'multipart/form-data'
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
    findCurrentUserScoreActions: function() {
        return axios({
            url: CONFIG.BACKEND_API + '/user/findCurrentUserScoreActions',
            method: 'get',
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
     * 查找所有评分记录 (管理员用)
     * @returns {Promise<Array>}
     */
    findAllScoreActions: function() {
        return axios({
            url: CONFIG.BACKEND_API + '/scoreAction/findAllScoreActions',
            method: 'get',
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
