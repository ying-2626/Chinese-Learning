import { computed, reactive, ref } from 'vue'
import { createSoeWebSocketUrl } from '@/services/soeApi'
import { createScoreAction, uploadAudioFile } from '@/services/scoreApi'
import { requestFastGpt } from '@/services/chatApi'
import { evalModes, promptTemplates } from '@/data/appData'

const initialScores = {
  accuracy: 0,
  fluency: 0,
  completeness: 0,
  initialSoundScore: 0,
  finalSoundScore: 0,
  toneScore: 0,
  totalScore: 0
}

export function useSpeechEval() {
  const evalText = ref('输入你想要朗读的内容')
  const selectedMode = ref(evalModes[0])
  const status = ref('idle')
  const advice = ref('完成一次朗读后，AI 老师会在这里给出改进建议。')
  const error = ref('')
  const coloredWords = ref([])
  const scores = reactive({ ...initialScores })

  let websocket = null
  let recorder = null
  let audioChunks = []

  const isRecording = computed(() => ['connecting', 'recording', 'closing'].includes(status.value))
  const actionLabel = computed(() => {
    if (status.value === 'connecting') return '建立连接中'
    if (status.value === 'recording') return '录音中，点击停止'
    if (status.value === 'closing' || status.value === 'saving') return '生成报告中'
    return '开始录音'
  })

  function resetScores() {
    Object.assign(scores, initialScores)
    coloredWords.value = []
  }

  function getRecorder() {
    if (recorder) return recorder
    if (!window.RecorderManager) {
      throw new Error('录音组件未加载，请刷新页面重试')
    }
    recorder = new window.RecorderManager('/recorder')
    recorder.onStart = () => {
      audioChunks = []
      status.value = 'recording'
    }
    recorder.onFrameRecorded = ({ isLastFrame, frameBuffer }) => {
      if (frameBuffer) audioChunks.push(frameBuffer)
      if (websocket?.readyState === WebSocket.OPEN && frameBuffer) {
        websocket.send(frameBuffer)
        if (isLastFrame) {
          websocket.send(JSON.stringify({ type: 'end' }))
          status.value = 'closing'
        }
      }
    }
    recorder.onStop = () => {}
    return recorder
  }

  async function toggleRecording() {
    if (isRecording.value) {
      getRecorder().stop()
      return
    }
    await startRecording()
  }

  async function startRecording() {
    error.value = ''
    resetScores()
    advice.value = '正在建立语音评测连接...'
    status.value = 'connecting'

    try {
      const text = evalText.value.trim() || '你好'
      const websocketUrl = await createSoeWebSocketUrl({
        refText: text,
        evalMode: selectedMode.value.value,
        scoreCoeff: 1.0
      })
      websocket = new WebSocket(websocketUrl)
      websocket.onopen = () => getRecorder().start({ sampleRate: 16000, frameSize: 1280 })
      websocket.onmessage = (event) => {
        const payload = JSON.parse(event.data)
        renderResult(payload, payload.final === 1)
        if (payload.final === 1) websocket?.close()
      }
      websocket.onerror = () => {
        error.value = '语音评测连接失败，请确认后端腾讯 SOE 配置可用。'
        safeStop()
      }
      websocket.onclose = () => {
        if (status.value !== 'saving') status.value = 'idle'
        safeStop()
      }
    } catch (err) {
      error.value = err.message || '语音评测启动失败'
      advice.value = '语音评测暂时不可用，请检查后端服务或腾讯 SOE 配置。'
      status.value = 'idle'
    }
  }

  function safeStop() {
    try {
      if (recorder && status.value !== 'idle') recorder.stop()
    } catch {
      // RecorderManager throws if stop is called before start; ignore that stale state.
    }
  }

  function renderResult(payload, isFinal) {
    const result = payload.result
    if (!result) return

    scores.accuracy = Number(result.PronAccuracy || 0)
    scores.fluency = Number(result.PronFluency || 0) * 100
    scores.completeness = Number(result.PronCompletion || 0) * 100
    scores.totalScore = Number(result.SuggestedScore || 0)

    const words = Array.isArray(result.Words) ? result.Words : []
    if (selectedMode.value.label !== '读段落') {
      const detail = calculateDetailScores(words)
      scores.initialSoundScore = detail.initialSoundScore
      scores.finalSoundScore = detail.finalSoundScore
      scores.toneScore = detail.toneScore
    } else {
      scores.initialSoundScore = 0
      scores.finalSoundScore = 0
      scores.toneScore = 0
    }

    coloredWords.value = words
      .filter((item) => item.Word && item.Word !== '*')
      .map((item) => ({
        text: item.Word,
        score: Number(item.PronAccuracy || 0),
        tone: scoreTone(item.PronAccuracy)
      }))

    if (isFinal) {
      status.value = 'saving'
      persistFinalResult(result).finally(() => {
        status.value = 'idle'
      })
    }
  }

  function calculateDetailScores(words) {
    if (!words.length) return { initialSoundScore: 0, finalSoundScore: 0, toneScore: 0 }
    let initialTotal = 0
    let finalTotal = 0
    let toneCorrect = 0

    words.forEach((word) => {
      if (word.PhoneInfos?.length > 0) initialTotal += Number(word.PhoneInfos[0].PronAccuracy || 0)
      if (word.PhoneInfos?.length > 1) finalTotal += Number(word.PhoneInfos[1].PronAccuracy || 0)
      if (word.Tone?.Valid && word.Tone.HypothesisTone !== -1) toneCorrect += 1
    })

    return {
      initialSoundScore: initialTotal / words.length,
      finalSoundScore: finalTotal / words.length,
      toneScore: (toneCorrect / words.length) * 100
    }
  }

  function buildAnalysisPayload(result) {
    const words = Array.isArray(result.Words) ? result.Words : []
    const base = {
      TotalScore: result.SuggestedScore,
      Accuracy: result.PronAccuracy,
      Fluency: Number(result.PronFluency || 0) * 100,
      Integrity: Number(result.PronCompletion || 0) * 100
    }

    if (selectedMode.value.label === '读段落') {
      return {
        ...base,
        Words: words.map((item) => ({
          Word: item.Word,
          PronAccuracy: item.PronAccuracy
        }))
      }
    }

    return {
      ...base,
      Words: words.map((item) => ({
        Word: item.Word,
        PronAccuracy: item.PronAccuracy,
        PhoneInfos: item.PhoneInfos?.map((phoneItem) => ({
          Phone: phoneItem.Phone,
          PronAccuracy: phoneItem.PronAccuracy
        })) || [],
        Tone: item.Tone
      }))
    }
  }

  async function persistFinalResult(result) {
    const analysisPayload = buildAnalysisPayload(result)
    const prompt = selectedMode.value.label === '读段落' ? promptTemplates.paragraph : promptTemplates.default
    const analysisInput = `${JSON.stringify(analysisPayload, null, 2)}\n${prompt}`

    try {
      const [aiAdvice, audioUrl] = await Promise.all([
        requestFastGpt(analysisInput).catch(() => 'AI 点评暂时不可用，但本次语音评分已完成。'),
        uploadAudioFile(new Blob([addWavHeader(mergeAudioChunks())], { type: 'audio/wav' }))
      ])

      advice.value = aiAdvice
      await createScoreAction({
        audioUrl,
        accuracy: scores.accuracy,
        fluency: scores.fluency,
        completeness: scores.completeness,
        initialSoundScore: scores.initialSoundScore,
        finalSoundScore: scores.finalSoundScore,
        toneScore: scores.toneScore,
        totalScore: scores.totalScore,
        advice: aiAdvice
      })
    } catch (err) {
      error.value = err.message || '评分保存失败'
      advice.value = advice.value || '评分已生成，但保存记录失败。'
    }
  }

  function mergeAudioChunks() {
    const totalLength = audioChunks.reduce((sum, chunk) => sum + chunk.byteLength, 0)
    const result = new Uint8Array(totalLength)
    let offset = 0
    audioChunks.forEach((chunk) => {
      result.set(new Uint8Array(chunk), offset)
      offset += chunk.byteLength
    })
    return result.buffer
  }

  function addWavHeader(samples) {
    const dataLength = samples.byteLength
    const buffer = new ArrayBuffer(44 + dataLength)
    const view = new DataView(buffer)

    writeString(view, 0, 'RIFF')
    view.setUint32(4, 36 + dataLength, true)
    writeString(view, 8, 'WAVE')
    writeString(view, 12, 'fmt ')
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)
    view.setUint16(22, 1, true)
    view.setUint32(24, 16000, true)
    view.setUint32(28, 32000, true)
    view.setUint16(32, 2, true)
    view.setUint16(34, 16, true)
    writeString(view, 36, 'data')
    view.setUint32(40, dataLength, true)
    new Uint8Array(buffer, 44).set(new Uint8Array(samples))
    return buffer
  }

  function writeString(view, offset, string) {
    for (let index = 0; index < string.length; index += 1) {
      view.setUint8(offset + index, string.charCodeAt(index))
    }
  }

  function scoreTone(score) {
    if (score < 60) return 'low'
    if (score < 80) return 'mid'
    return 'high'
  }

  return {
    evalText,
    evalModes,
    selectedMode,
    status,
    advice,
    error,
    coloredWords,
    scores,
    isRecording,
    actionLabel,
    toggleRecording
  }
}
