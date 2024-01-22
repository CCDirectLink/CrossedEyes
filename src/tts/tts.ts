import { MenuOptions } from '../options-manager'
import { TextGather } from './gather-text'
import { AddonInstaller, TTSNvda } from './tts-nvda'
import { TTSWebSpeech } from './tts-web-speech'

export interface CharacterSpeakData {}

export interface TTSInterface {
    calibrateSpeed: boolean
    supportedPlatforms: Set<'win32' | 'linux' | 'darwin'>
    queue: string[]
    init(): Promise<void>
    isReady(): boolean
    speak(text: string): void
    characterSpeak(text: string, data: CharacterSpeakData): void
    clearQueue(): void
}

export enum TTSTypes {
    'Web Speech' = 0,
    'NVDA' = 1,
}

const implementations: (new () => TTSInterface)[] = [TTSWebSpeech, TTSNvda]

export interface SpeechEndListener {
    onSpeechEnd(): void
}

export class TTS {
    static g: TTS

    ttsInstance!: TTSInterface
    lastOption: TTSTypes | undefined = undefined
    textGather: TextGather

    onSpeechEndListeners: SpeechEndListener[] = []
    onReadyListeners: (() => void)[] = []

    constructor() {
        /* in prestart */
        TTS.g = this
        this.textGather = new TextGather(
            (text: string) => {
                this.ttsInstance && this.ttsInstance.speak(text)
            },
            (text: string, data: CharacterSpeakData) => {
                this.ttsInstance && this.ttsInstance.characterSpeak(text, data)
            },
            () => {
                this.ttsInstance && this.ttsInstance.clearQueue()
            }
        )
        this.optionChangeEvent()
    }

    optionChangeEvent() {
        MenuOptions.ttsEnabled && this.init()
    }

    setup() {
        if (this.lastOption != MenuOptions.ttsType) {
            this.lastOption = MenuOptions.ttsType
            const imp = new implementations[MenuOptions.ttsType]()
            if (imp.supportedPlatforms.has(process.platform as any)) {
                this.ttsInstance = imp
                imp.init()
            }
        }
    }

    async init() {
        AddonInstaller.checkInstall()
        this.setup()

        const interval = setInterval(() => {
            if (this.ttsInstance.isReady()) {
                this.onReadyListeners.forEach(f => f())
                this.onReadyListeners = []
                clearInterval(interval)
            }
        }, 100)
    }
}
