const { createApp } = Vue

app = createApp({
    data() {
        return {
            speakText: "请输入要说话的文字",
            voices: [],
            voice: "",
            lang: ""
        }
    },
    created() {
        const self = this
        speechSynthesis.addEventListener("voiceschanged", () => {
            let voices = speechSynthesis.getVoices()
            voices.forEach((value, index, array) => {
                console.log(value.name)
                this.voices.push({ 'value': value, 'label': value.name })
            })
            console.log(voices)
        })
    },
    methods: {
        changeVoice(val) {
            console.log(val)
            this.lang = val.lang
        },
        play() {
            let s = new SpeechSynthesisUtterance(this.speakText)
            s.lang = "zh-CN"
            s.rate = 1
            s.pitch = 1
            s.voice = this.voice
            console.log(s.voice, this.speakText)
            speechSynthesis.cancel();
            speechSynthesis.speak(s)
        }
    }
})
app.use(ElementPlus);
app.mount('#app')