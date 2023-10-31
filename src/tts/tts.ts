import { MenuOptions } from '../options'
import { injectTextGathering } from './gather-text'
import { TTSScreenReader } from './tts-screen-reader'
import { TTSSpeechSynthesisAPI } from './tts-speech-synthesis'

export interface TTSInterface {
    init(queue: TTS['speakQueue'], increseQueueId: () => number): Promise<void>
    isReady(): boolean
    speak(text: string): void
    interrupt(): void
}

export enum TTSTypes {
    'Built-in' = 0,
    'Screen reader' = 1,
}

export class TTS {
    speakQueue: Record<number, any> = {}
    speakQueueId: number = 0

    ttsInstance!: TTSInterface

    clearQueue() {
        this.speakQueue = {}
        this.speakQueueId = 0
        this.ttsInstance?.interrupt()
    }

    constructor() { /* in prestart */
        injectTextGathering(
            (text: string) => this.ttsInstance && this.ttsInstance.speak(text),
            () => { this.clearQueue() }
        )
    }

    async initPoststart() {
        switch (MenuOptions.ttsType) {
            case TTSTypes['Built-in']:
                this.ttsInstance = new TTSSpeechSynthesisAPI()
                break
            case TTSTypes['Screen reader']: 
                this.ttsInstance = new TTSScreenReader()
                break
            default: throw new Error()
        }
        this.ttsInstance.init(this.speakQueue, () => this.speakQueueId++)
    }
}
