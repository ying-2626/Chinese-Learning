const ScoreService = {
    async createScoreAction(scoreData) {
        return LegacyContent.result(await axios({
            url: CONFIG.BACKEND_API + '/scoreAction/createScoreAction', method:'post', data:scoreData,
            headers: LegacyContent.headers(true), withCredentials:true
        }));
    },
    async uploadAudioFile(audioFile) {
        const headers = LegacyContent.headers();
        const formData = new FormData();
        formData.append('audioFile', audioFile, 'recording.wav');
        const result = LegacyContent.result(await axios({
            url: CONFIG.BACKEND_API + '/scoreAction/uploadAudioFile', method:'post', data:formData,
            headers, withCredentials:true
        }));
        if (typeof result !== 'string' || !result) throw new Error('音频上传未返回地址');
        return result;
    },
    async findCurrentUserScoreActions() {
        const result = LegacyContent.result(await axios({
            url: CONFIG.BACKEND_API + '/user/findCurrentUserScoreActions', method:'get',
            headers:LegacyContent.headers(), withCredentials:true
        }));
        if (result === 0) return [];
        if (!Array.isArray(result)) throw new Error('评测记录返回格式异常');
        return result;
    },
    async findAllScoreActions() {
        return LegacyContent.result(await axios({
            url:CONFIG.BACKEND_API + '/scoreAction/findAllScoreActions', method:'get',
            headers:LegacyContent.headers(), withCredentials:true
        }));
    }
};
if (typeof window !== 'undefined') window.ScoreService = ScoreService;
if (typeof module !== 'undefined' && module.exports) module.exports = ScoreService;
