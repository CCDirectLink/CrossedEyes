import { MenuOptions, ttsTypeId } from '../options'
import CrossedEyes from '../plugin'
import { TextGather } from './gather-text'
import { TTSNvda } from './tts-nvda'
import { TTSSpeechSynthesisAPI } from './tts-speech-synthesis'

export interface CharacterSpeakData { }

export interface TTSInterface {
    queue: string[]
    init(onReady: () => void): Promise<void>
    isReady(): boolean
    speak(text: string): void
    characterSpeak(text: string, data: CharacterSpeakData): void
    clearQueue(): void
    speechEndEvents: (() => void)[]
}

export enum TTSTypes {
    'Built-in' = 0,
    'NVDA' = 1,
}

export class TTS {
    static g: TTS

    ttsInstance!: TTSInterface
    lastOption: number = -1
    textGather: TextGather

    private readyCallbacks: (() => void)[] = []

    addReadyCallback(cb: () => void) {
        if (this.ttsInstance && this.ttsInstance.isReady()) {
            cb()
        } else {
            this.readyCallbacks.push(cb)
        }
    }

    constructor() { /* in prestart */
        TTS.g = this
        CrossedEyes.initPoststarters.push(this)
        this.textGather = new TextGather(
            (text: string) => this.ttsInstance && this.ttsInstance.speak(text),
            (text: string, data: CharacterSpeakData) => this.ttsInstance && this.ttsInstance.characterSpeak(text, data),
            () => { this.ttsInstance && this.ttsInstance.clearQueue() }
        )
        const self = this
        sc.OptionModel.inject({
            set(option: string, value: any) {
                this.parent(option, value)
                option == ttsTypeId && self.setup()
            },
        })
    }

    setup() {
        if (this.lastOption != MenuOptions.ttsType) {
            this.lastOption = MenuOptions.ttsType
            switch (MenuOptions.ttsType) {
                case TTSTypes['Built-in']:
                    this.ttsInstance = new TTSSpeechSynthesisAPI()
                    break
                case TTSTypes.NVDA:
                    this.ttsInstance = new TTSNvda()
                    break
                default: throw new Error()
            }
            this.ttsInstance.init(() => { this.readyCallbacks.forEach(cb => cb()); this.readyCallbacks = [] })
        }
    }

    async initPoststart() {
        if (MenuOptions.ttsType == 2 as any) { /* remove me later */
            MenuOptions.ttsType = TTSTypes.NVDA
            MenuOptions.save()
        }
        this.setup()
    }
}
