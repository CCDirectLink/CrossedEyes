import { MenuOptions } from '../options'
import { expressionMap } from './expressionMap'

function getReadableText(orig: string): string {
    return orig.replace(/\\c\[[^\]]*\]/g, '').replace(/\\i\[[^\]]*\]/g, '').replace(/\\s\[[^\]]*\]/g, '')
}

const leaSounds: boolean = false

export function injectTextGathering(speakCall: (text: string) => void, interrupt: () => void) {
    function speak(textLike: sc.TextLike): void {
        const text = getReadableText(textLike!.toString())
        speakCall(text)
    }
    function speakInterrupt(textLike: sc.TextLike): void {
        interrupt()
        speak(textLike)
    }

    let prevChar: string | undefined
    sc.VoiceActing.inject({
        init() {
            this.parent()
            this.load()
        },
        play(exp: sc.CharacterExpression, label: ig.LangLabel) {
            const isOn = MenuOptions.ttsEnabled
            if (isOn) {
                let interrupted: boolean = false
                if (leaSounds && exp.character.name == 'main.lea') {
                    this.active = true
                    interrupt()
                } else {
                    let charName: string = ig.LangLabel.getText((exp.character.data as any).name)
                    if (charName == '???') { charName = 'Unknown' }

                    if (!sc.message.blocking || prevChar != charName) {
                        let expression = expressionMap[exp.expression]
                        if (expression === undefined) {
                            console.error(`expression: "${exp.expression}" not mapped`)
                            expression = 'Expression mapping error'
                        }
                        if (label.toString() != '[nods]') {
                            if (!interrupted) { interrupted = true; interrupt() }
                            speak(`${expression} ${charName} says: `)
                        }
                    }
                    if (sc.message.blocking) {
                        prevChar = charName
                    } else {
                        prevChar = undefined
                    }
                    if (!interrupted) { interrupted = true; interrupt() }
                    if (label.toString() == '[nods]') {
                        speak(`${charName} nods`)
                    } else {
                        speak(label)
                    }
                }
            }
            const ret = this.parent(exp, label)
            if (isOn) { this.active = false }
            return ret
        },
    })
    sc.MessageModel.inject({
        clearAll(...args) {
            prevChar = undefined
            interrupt()
            return this.parent(...args)
        }
    })

    sc.ButtonGui.inject({
        focusGained() {
            MenuOptions.ttsEnabled && speakInterrupt(this.text)
            return this.parent()
        },
    })
    sc.CenterMsgBoxGui.inject({
        init(...args) {
            this.parent(...args)
            MenuOptions.ttsEnabled && speak(this.textGui.text)
        },
        _close() {
            MenuOptions.ttsEnabled && interrupt()
            return this.parent()
        },
    })

    ig.EVENT_STEP.SHOW_AR_MSG.inject({
        start(...args) {
            MenuOptions.ttsEnabled && speak(this.text)
            return this.parent(...args)
        },
    })
}
