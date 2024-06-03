import { Lang } from '../../lang-manager'
import { Opts } from '../../options'
import { charSpeak, interrupt } from './api'
import { button_setSayChoice } from './button'

let prevChar: string | undefined

let sideMsg: boolean = false
sc.SideMessageHudGui.inject({
    showNextSideMessage() {
        interrupt()
        sideMsg = true
        this.parent()
        sideMsg = false
    },
})
sc.VoiceActing.inject({
    init() {
        this.parent()
        this.load()
    },
    play(exp: sc.CharacterExpression, label: ig.LangLabel) {
        if (Opts.ttsChar) {
            let character: string = ig.LangLabel.getText(exp.character.data.name)
            if (character == '???') character = Lang.msg.unknownCharacter
            else if (character == 'MISSING LABEL') character = Lang.msg.unnamedNpc

            const sentence: string = label.toString()
            let expression: string = ''
            if (!sc.message.blocking || prevChar != character) {
                expression = (Lang.msg.expressionMap as Record<string, string>)[exp.expression]
                if (expression === undefined) {
                    console.error(`expression: "${exp.expression}" not mapped`)
                    expression = 'Expression mapping error'
                }
            }
            let text: string
            if (sentence == Lang.msg.nodAsInGame) {
                text = Lang.msg.nodTemplate.supplant({ character }) // `${charName} nods`
            } else if (sentence.startsWith('...') && sentence.length <= 5) {
                /* cover: ... ...! ...? ...?! */
                const punctuation = sentence.substring(3)
                text = Lang.msg.silentTemplate.supplant({ expression, character, punctuation })
            } else {
                if (sc.message.blocking && prevChar == character) text = sentence
                else text = Lang.msg.regularTemplate.supplant({ expression, character, sentence })
            }
            sideMsg && (text = Lang.msg.sideMsgTemplate.supplant({ rest: text }))
            prevChar = character
            charSpeak(text, {})
        }
        this.parent(exp, label)
    },
})
sc.MessageModel.inject({
    clearBlocking() {
        interrupt()
        button_setSayChoice(true)
        this.parent()
    },
    clearAll() {
        prevChar = undefined
        this.parent()
    },
})
