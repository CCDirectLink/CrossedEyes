import { MenuOptions } from '../options'
import { TTS, TTSInterface } from './tts'

export class TTSSpeechSynthesisAPI implements TTSInterface {
    voiceName: string = 'English (Received Pronunciation)+Annie espeak-ng'
    voices!: SpeechSynthesisVoice[]
    voice!: SpeechSynthesisVoice

    queue!: TTS['speakQueue']
    increaseQueueId!: () => number

    getLangVoices(lang: string): SpeechSynthesisVoice[] {
        return this.voices.filter(v => v.lang.startsWith(lang))
    }

    getVoice(): SpeechSynthesisVoice {
        const voice = this.voices.find(e => e.voiceURI == this.voiceName)
        if (voice) {
            return voice
        } else {
            const lang = sc.LANGUAGE_MAP[sc.options.get('language') as sc.LANGUAGE].substring(0, 2)
            let voices = this.getLangVoices(lang)
            if (voices.length == 0) {
                voices = this.getLangVoices('en')
                if (voices.length == 0) {
                    throw new Error('no voices found')
                }
                return voices[0]
            } else {
                return voices[0]
            }
        }
    }

    async init(queue: TTS['speakQueue'], increaseQueueId: () => number) {
        this.queue = queue
        this.increaseQueueId = increaseQueueId
        this.getVoices()

        this.voices = await this.getVoices()
        if (this.voices.length == 0) {
            console.log('tts initialization failed')
            return
        }
        this.voice = this.getVoice()
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

    speak(text: string) {
        if (!this.isReady()) { return }
        text = text.trim()
        if (! text) { return }
        console.log(text)

        const utter = new SpeechSynthesisUtterance(text)
        utter.pitch = MenuOptions.ttsPitch
        utter.rate = MenuOptions.ttsSpeed
        utter.volume = MenuOptions.ttsVolume
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
