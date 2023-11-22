import { MenuOptions, ttsTypeId } from '../options'
import { TextGather } from './gather-text'
import { TTSNvda } from './tts-nvda'
import { TTSScreenReader } from './tts-screen-reader'
import { TTSSpeechSynthesisAPI } from './tts-speech-synthesis'

export interface TTSInterface {
    init(queue: TTS['speakQueue'], increseQueueId: () => number, onReady: () => void): Promise<void>
    isReady(): boolean
    speak(text: string): void
    interrupt(): void
}

export enum TTSTypes {
    'Built-in' = 0,
    'Screen reader' = 1,
    'NVDA' = 2,
}

export class TTS {
    static global: TTS

    speakQueue: Record<number, any> = {}
    speakQueueId: number = 0

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

    clearQueue() {
        this.speakQueue = {}
        this.speakQueueId = 0
        this.ttsInstance?.interrupt()
    }

    constructor() { /* in prestart */
        this.textGather = new TextGather(
            (text: string) => this.ttsInstance && this.ttsInstance.speak(text),
            () => { this.clearQueue() }
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
                case TTSTypes['Screen reader']: 
                    this.ttsInstance = new TTSScreenReader()
                    break
                case TTSTypes.NVDA:
                    this.ttsInstance = new TTSNvda()
                    break
                default: throw new Error()
            }
            this.ttsInstance.init(this.speakQueue, () => this.speakQueueId++, () => { this.readyCallbacks.forEach(cb => cb()); this.readyCallbacks = [] })
        }
    }

    async initPoststart() {
        this.setup()
    }
}
