import { Opts } from '../options'
import { CharacterSpeakData, TTS, TTSInterface } from './tts'

export class TTSWebSpeech implements TTSInterface {
    calibrateSpeed = false
    supportedPlatforms = new Set<'win32' | 'linux' | 'darwin'>(['win32', 'darwin', 'linux'])
    voiceName: string = 'English (Received Pronunciation)+Annie espeak-ng'
    voices!: SpeechSynthesisVoice[]
    voice!: SpeechSynthesisVoice

    queue: string[] = []

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

    async init() {
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
            if (voices.length > 0) {
                resolve(voices)
                return
            }
            const id = setInterval(() => {
                voices = speechSynthesis.getVoices()
                if (voices.length > 0) {
                    clearInterval(id)
                    resolve(voices)
                }
            }, 100)
        })
    }

    isReady(): boolean {
        return !!this.voice
    }

    speak(text: string, ignoreLen = false) {
        if (!this.isReady()) {
            return
        }
        text = text.trim()
        if (!text) {
            return
        }

        ignoreLen || this.queue.push(text)
        if (ignoreLen || this.queue.length == 1) {
            const utter = new SpeechSynthesisUtterance(text)
            utter.pitch = Opts.ttsPitch
            utter.rate = Opts.ttsSpeed
            utter.volume = Opts.ttsVolume
            utter.voice = this.voice
            speechSynthesis.speak(utter)
            utter.addEventListener('end', () => {
                TTS.g.onSpeechEndListeners.forEach(i => i.onSpeechEnd())
                this.queue.shift()
                if (this.queue.length > 0) {
                    this.speak(this.queue[0], true)
                }
            })
        }
    }

    characterSpeak(text: string, _: CharacterSpeakData): void {
        this.speak(text)
    }

    clearQueue(): void {
        speechSynthesis.cancel()
        this.queue = []
    }
}
