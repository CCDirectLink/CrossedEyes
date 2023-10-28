import { TTS, TTSInterface } from './tts'

export class TTSSpeechSynthesisAPI implements TTSInterface {
    voiceName: string = 'English (Received Pronunciation)+Annie espeak-ng'
    voices!: SpeechSynthesisVoice[]
    voice!: SpeechSynthesisVoice

    queue!: TTS['speakQueue']
    increaseQueueId!: () => number

    async init(queue: TTS['speakQueue'], increaseQueueId: () => number) {
        this.queue = queue
        this.increaseQueueId = increaseQueueId
        this.getVoices()

        this.voices = (await this.getVoices()).filter(v => v.localService)
        if (this.voices.length == 0) {
            console.log('tts initialization failed')
            return
        }

        this.voice = this.voices.find(e => e.voiceURI == this.voiceName)!
        console.log(this.voice)
    }

    getVoices(): Promise<SpeechSynthesisVoice[]> {
        return new Promise(resolve => {
            let voices = speechSynthesis.getVoices()
            if (voices.length) {
                resolve(voices)
                return
            }
            speechSynthesis.onvoiceschanged = () => {
                voices = speechSynthesis.getVoices()
                resolve(voices)
            }
        })
    }

    isReady(): boolean {
        return !!this.voice
    }

    speak(text: string, pitch: number, speed: number, volume: number): void {
        if (!this.isReady()) { return }
        text = text.trim()
        if (! text) { return }
        console.log(text)

        const utter = new SpeechSynthesisUtterance(text)
        utter.pitch = pitch
        utter.rate = speed
        utter.volume = volume
        utter.voice = this.voice

        speechSynthesis.speak(utter)
        const id = this.increaseQueueId()
        this.queue[id] = utter
        utter.addEventListener('end', () => {
            if (this.queue[id]) {
                delete this.queue[id]
            }
        })
    }

    interrupt(): void {
        speechSynthesis.cancel()
    }
}
