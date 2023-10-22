import { MenuOptions } from "./options"

declare global {
    namespace sc {
        enum LANGUAGE {
            ENGLISH = 0,
            GERMAN = 1,
            CHINESE = 2,
            JAPANESE = 3,
            KOREAN = 4,
            CHINESE_TRAD = 5,
        }
    }
}



const synth: SpeechSynthesis = window.speechSynthesis

function getVoices(): Promise<SpeechSynthesisVoice[]> {
    return new Promise(resolve => {
        let voices = synth.getVoices()
        if (voices.length) {
            resolve(voices)
            return
        }
        speechSynthesis.onvoiceschanged = () => {
            voices = synth.getVoices()
            resolve(voices)
        }
    })
}

interface LanguageVoices {
    gui: string;
    "main.carla": string
    default: string
}

const voiceMap: Partial<Record<keyof typeof sc.LANGUAGE, LanguageVoices>> = {
    ENGLISH: {
        gui: 'English (America)+Alex espeak-ng',
        "main.carla": 'English (America)+Annie espeak-ng',
        default: 'English (America)+Alex espeak-ng',
    }
}

export class TTS {
    voices!: SpeechSynthesisVoice[]
    lvoices!: Record<keyof LanguageVoices, SpeechSynthesisVoice>

    speakQueue: Record<number, SpeechSynthesisUtterance> = {}
    speakQueueId: number = 0

    clearQueue() {
        this.speakQueue = {}
        this.speakQueueId = 0
        synth.cancel()
    }

    speak(voice: SpeechSynthesisVoice, text: string, interrupt: boolean = true, speed: number = 1, pitch: number = 1) {
        text = text.trim()
        if (! text) { return }
        const utter = new SpeechSynthesisUtterance(text)
        utter.pitch = pitch
        utter.rate = speed
        utter.voice = voice
        if (interrupt) {
            this.clearQueue()
        }

        synth.speak(utter)
        const id = this.speakQueueId++
        this.speakQueue[id] = utter
        utter.addEventListener('end', () => {
            if (this.speakQueue[id]) {
                delete this.speakQueue[id]
            }
        })
    }

    getLangVoices() {
        const lang: sc.LANGUAGE = sc.options.get('language')
        const langName: keyof typeof sc.LANGUAGE = (Object.entries(sc.LANGUAGE) as [keyof typeof sc.LANGUAGE, number][]).find(e => e[1] == lang)![0]
        const langEntry: LanguageVoices = voiceMap[langName]!
        console.log(lang, langName, langEntry)

        this.lvoices = Object.fromEntries((Object.entries(langEntry) as [keyof LanguageVoices, string][])
            .map(e => [e[0], this.voices.find(e1 => e1.voiceURI == e[1])])) as Record<keyof LanguageVoices, SpeechSynthesisVoice>
        console.log(this.lvoices)
        // TTS.speak(this.lvoices.lea, 'hello world')
    }

    static getReadableText(orig: string): string {
        const txt: string = orig.replace(/\\c\[[^\]]*\]/g, '').replace(/\\i\[[^\]]*\]/g, '')
        return txt
    }

    async initPrestart() {
        const self = this
        sc.ButtonGui.inject({
            focusGained() {
                let text: string = TTS.getReadableText(this.text!.toString())
                self.speak(self.lvoices.gui, text)
                return this.parent()
            },

        })

        sc.VoiceActing.inject({
            init() {
                this.parent()
                this.load()
            },
            play(exp: sc.CharacterExpression, label: ig.LangLabel) {
                const isOn = MenuOptions.ttsEnabled
                if (isOn) {
                    if (exp.character.name == 'main.lea') {
                        this.active = true
                        self.clearQueue()
                    } else {
                        const text = TTS.getReadableText(label.toString())
                        const voice = self.lvoices[exp.character.name as keyof LanguageVoices] ?? self.lvoices.default
                        self.speak(voice, text)
                    }
                }
                const ret = this.parent(exp, label)
                if (isOn) { this.active = false }
                return ret
            },
        })
    }

    async initPoststart() {
        this.voices = (await getVoices()).filter(v => v.localService)
        if (this.voices.length == 0) {
            console.log('tts initialization failed')
            return
        }
        this.getLangVoices()
    }
}
