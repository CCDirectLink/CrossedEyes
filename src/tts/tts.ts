import { Opts } from '../plugin'
import { TextGather } from './gather/api'
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

    ttsInstance?: TTSInterface
    private lastOption: TTSTypes | undefined

    onSpeechEndListeners: SpeechEndListener[] = []
    onReadyListeners: (() => void)[] = []

    constructor() {
        /* in prestart */
        TTS.g = this
        new TextGather(
            (text: string) => {
                this.ttsInstance?.speak(text)
            },
            (text: string, data: CharacterSpeakData) => {
                this.ttsInstance?.characterSpeak(text, data)
            },
            () => {
                this.ttsInstance?.clearQueue()
            }
        )
        this.optionChangeEvent()
    }

    optionChangeEvent() {
        Opts.tts && this.init()
    }

    setup() {
        if (this.lastOption != Opts.ttsType) {
            this.lastOption = Opts.ttsType
            const imp = new implementations[Opts.ttsType]()
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
            if (this.ttsInstance?.isReady()) {
                this.onReadyListeners.forEach(f => f())
                this.onReadyListeners = []
                clearInterval(interval)
            }
        }, 100)
    }
}
