import { Lang } from '../../lang-manager'
import { Opts } from '../../plugin'
import { SpecialAction } from '../../special-action'
import { FontToImgMap } from '../font-img-to-text-map'
import { CharacterSpeakData } from '../tts'

export type ValidTextLike = string | { toString(): string }

export function getReadableText(orig: string): string {
    let text: string = orig
        .trim()
        .replace(/\\c\[[^\]]*\]/g, '')
        .replace(/\\s\[[^\]]*\]/g, '')
        .replace(/%/g, ` ${Lang.misc.percent}`)
        .replace(/\+/g, ` ${Lang.misc.plus}`)
        .replace(/\\\./g, ' ')
        .replace(/\?\?\?/g, Lang.misc.unknown)

    const imgMatches: string[] | null = text.match(/\\i\[[^\]]*\]/g)
    for (let img of imgMatches ?? []) {
        const replacement: string = FontToImgMap.convert(img.substring(3, img.length - 1))
        if (replacement === undefined) {
            console.warn(`IMAGE: '${img}' is unmapped`)
        }
        text = text.replace(img, replacement ?? '')
    }

    text = text.replace(/\,\./g, '.')
    if (text.endsWith(',')) text = text.substring(0, text.length - 1) + '.'

    return text
}

const interpolateStringRegex: RegExp = /\${(\d+)}/g
function interpolateString(template: string, ...values: (string | number)[]): string {
    return template.replace(interpolateStringRegex, (match: string, index: string) => {
        const valueIndex: number = parseInt(index, 10)
        if (valueIndex >= 0 && valueIndex < values.length) {
            return values[valueIndex].toString()
        }
        return match
    })
}

export function speakC(textLike: ValidTextLike): void {
    Opts.tts && staticInstance.speak(textLike)
}
export function speak(textLike: ValidTextLike): void {
    staticInstance.speak(textLike)
}
export function speakIC(textLike: ValidTextLike): void {
    Opts.tts && staticInstance.speakI(textLike)
}
export function speakI(textLike: ValidTextLike): void {
    staticInstance.speakI(textLike)
}
export function speakArgsC(template: string, ...textLikes: ValidTextLike[]) {
    Opts.tts && staticInstance.speakArgs(template, ...textLikes)
}
export function speakArgs(template: string, ...textLikes: ValidTextLike[]) {
    staticInstance.speakArgs(template, ...textLikes)
}
export function charSpeak(textLike: ValidTextLike, data: CharacterSpeakData): void {
    staticInstance.charSpeak(textLike, data)
}
export function interrupt() {
    staticInstance.interrupt()
}

let staticInstance: TextGather

export class TextGather {
    static set ignoreInterruptTo(value: number) {
        staticInstance.ignoreInterruptTo = value
    }
    static get lastMessage() {
        return staticInstance.lastMessage
    }
    private static interruptListeners: (() => void)[] = []
    static addInterruptListener(func: () => void) {
        TextGather.interruptListeners.push(func)
    }

    private connect: { count: number; template: string; args: ValidTextLike[] } | undefined
    private lastMessage: ValidTextLike = ''
    private ignoreInterrupt: number = 0
    private ignoreInterruptTo: number = 0

    charSpeak(textLike: ValidTextLike, data: CharacterSpeakData): void {
        this.interrupt()
        this.characterSpeakCall(getReadableText(textLike.toString()), data)
    }

    speak(textLike: ValidTextLike): void {
        if (this.connect?.count) {
            this.connect.count--
            this.connect.args.push(textLike)
        }
        if (this.connect?.count == 0) {
            this.speakArgs(this.connect.template, ...this.connect.args)
            this.connect = undefined
        } else {
            this.speakCall(getReadableText((textLike ?? '').toString()))
        }
    }

    speakI(textLike: ValidTextLike): void {
        this.interrupt()
        this.speak(textLike)
    }

    speakArgs(template: string, ...textLikes: ValidTextLike[]) {
        const matchArr = template.match(interpolateStringRegex) ?? []
        if (textLikes.length < matchArr.length) {
            this.connect = { count: matchArr.length - textLikes.length, template, args: textLikes }
        } else {
            this.interrupt()
            this.speakCall(interpolateString(template, ...textLikes.map(textLike => getReadableText((textLike ?? '').toString()))))
        }
    }

    constructor(
        private speakCall: (text: string) => void,
        private characterSpeakCall: (text: string, data: CharacterSpeakData) => void,
        public interrupt: () => void
    ) {
        /* in prestart */
        staticInstance = this

        new FontToImgMap()

        SpecialAction.setListener('RSP', 'repeatLast', () => {
            speakI(this.lastMessage)
        })
        const speakCallCopy = speakCall
        this.speakCall = (text: string) => {
            speakCallCopy(text)
            this.lastMessage = text
        }
        const characterSpeakCallCopy = characterSpeakCall
        this.characterSpeakCall = (text: string, data) => {
            characterSpeakCallCopy(text, data)
            this.lastMessage = text
        }

        const interruptCopy = interrupt
        this.interrupt = () => {
            if (this.ignoreInterrupt > 0) {
                this.ignoreInterrupt--
            } else if (Date.now() > this.ignoreInterruptTo) {
                TextGather.interruptListeners.forEach(f => f())
                interruptCopy()
            }
        }
        this.init()
    }

    async init() {
        await import('./ar-msg')
        await import('./button')
        await import('./center-msg-box')
        await import('./changed-maps')
        await import('./dialog-popup')
        await import('./dialogue')
        await import('./help-screen')
        await import('./input-forcer')
        await import('./item-recived')
        await import('./levelup')
        await import('./options-menu')
        await import('./quick-menu')
        await import('./save-menu')
        await import('./tutorial-popup')
        await import('./mod-manager')
        await import('./equipment-menu')
        await import('./quick-menu-food')
        await import('./checkbox')
    }
}
