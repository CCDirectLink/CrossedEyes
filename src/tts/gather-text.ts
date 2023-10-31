import { MenuOptions } from '../options'
import { SpecialAction } from '../special-action'
import { expressionMap } from './expressionMap'

function getReadableText(orig: string): string {
    return orig.replace(/\\c\[[^\]]*\]/g, '').replace(/\\i\[[^\]]*\]/g, '').replace(/\\s\[[^\]]*\]/g, '').replace(/%/g, ' percent')
}

function interpolateString(template: string, ...values: (string | number)[]): string {
    return template.replace(/\${(\d+)}/g, (match: string, index: string) => {
        const valueIndex: number = parseInt(index, 10)
        if (valueIndex >= 0 && valueIndex < values.length) {
            return values[valueIndex].toString()
        }
        return match
    })
}

const leaSounds: boolean = false

export function injectTextGathering(speakCall: (text: string) => void, interrupt: () => void) {
    let connect: { count: number, template: string, args: string[] } | undefined

    function speak(textLike: sc.TextLike): void {
        const text = getReadableText(textLike!.toString())
        if (connect?.count) {
            connect.count--
            connect.args.push(text)
        }
        if (connect?.count == 0) {
            speakCall(interpolateString(connect.template, ...connect.args))
            connect = undefined
        } else {
            speakCall(text)
        }
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
            const isOn = MenuOptions.ttsCharEnabled
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
            MenuOptions.ttsMenuEnabled && speakInterrupt(this.text)
            return this.parent()
        },
    })
    sc.CenterMsgBoxGui.inject({
        init(...args) {
            this.parent(...args)
            MenuOptions.ttsMenuEnabled && speak(this.textGui.text)
        },
        _close() {
            MenuOptions.ttsMenuEnabled && interrupt()
            return this.parent()
        },
    })

    ig.EVENT_STEP.SHOW_AR_MSG.inject({
        start(...args) {
            MenuOptions.ttsMenuEnabled && speakInterrupt(this.text)
            return this.parent(...args)
        },
    })

    sc.OptionsTabBox.inject({
        showMenu() {
            if (MenuOptions.ttsMenuEnabled) {
                connect = { count: 2, template: 'Options menu, General, ${1}', args: [] }
            }
            this.parent()
        }
    })

    sc.ItemTabbedBox.TabButton.inject({
        onPressedChange(pressed: boolean) {
            if (pressed && MenuOptions.ttsMenuEnabled) {
                connect = { count: 2, template: '${0}, ${2}, ${1}', args: [getReadableText(this.text!.toString())] }
            }
            return this.parent(pressed)
        },
    })
    sc.OptionRow.inject({
        init(option, row, rowGroup, local, width, height) {
            this.parent(option, row, rowGroup, local, width, height)
            this._rowGroup.elements[this.row].forEach(e => e.optionRow = this)
        },
    })

    function optionValueToString(optionName: string): [string, string] {
        const entry = sc.OPTIONS_DEFINITION[optionName]
        const val: string | number | boolean = sc.options.get(optionName) as any
        switch (entry.type) {
            case 'BUTTON_GROUP': return ['Button group', Object.keys(entry.data)[val as number]]
            case 'ARRAY_SLIDER': return ['Slider', `${(val as number * 100).floor()}%`]
            case 'OBJECT_SLIDER':
                return ['Slider', `${entry.showPercentage ?
                    `${(val as number * 100).floor()}%` :
                    Object.values(entry.data).findIndex(e => e == val) + 1 
                }`]
            case 'CHECKBOX': return ['Checkbox', `${val}`]
            case 'CONTROLS': return ['Keybinding', 'not supported']
            case 'LANGUAGE': return ['', Object.entries(sc.LANGUAGE).sort((a, b) => (a[1] as number) - (b[1] as number)).map(e => e[0])[val as number]]
            case 'INFO': return ['', '']
        }
    }

    let lastButtonGroup: string | undefined
    sc.RowButtonGroup.inject({
        init() {
            this.parent()
            this.addSelectionCallback((button?: ig.FocusGui) => {
                if (MenuOptions.ttsMenuEnabled) {
                    const or: sc.OptionRow = (button as sc.RowButtonGroup['elements'][0][0])?.optionRow
                    if (! or) { return }
                    const entry: { name: string, description: string } = ig.lang.labels.sc.gui.options[or.optionName]
                    if (entry) {
                        if (or.option.type == 'BUTTON_GROUP') {
                            if (or.optionName == lastButtonGroup) { return }
                            const index: number = sc.options.get(or.optionName) as number
                            this._lastRowIndex = index
                            this.rowIndex[this.currentRow] = index 
                            this.focusCurrentButton(this.currentRow, this.rowIndex[this.currentRow], false, false, true)
                            lastButtonGroup = or.optionName
                        } else {
                            lastButtonGroup = undefined
                        }
                        const optStr = optionValueToString(or.optionName)
                        const text: string = `${entry.name}, ${optStr[0]}, ${optStr[1]}`
                        speakInterrupt(text)
                    }
                    SpecialAction.setListener('optionsRead', () => {
                        sc.menu.isOptions() && speakInterrupt(`${entry.description}`)
                    })
                }
            })
        },
    })
    sc.OPTION_GUIS[sc.OPTION_TYPES.CHECKBOX].inject({
        onPressed(checkbox: sc.CheckboxGui) {
            this.parent(checkbox)
            checkbox == this.button && MenuOptions.ttsMenuEnabled && speakInterrupt(checkbox.pressed)
        }
    })
    sc.OPTION_GUIS[sc.OPTION_TYPES.ARRAY_SLIDER].inject({
        onLeftRight(direction: boolean) {
            this.parent(direction)
            MenuOptions.ttsMenuEnabled && speakInterrupt(`${(this._lastVal / this.scale * 100).floor()}%`)
        }
    })
    sc.OPTION_GUIS[sc.OPTION_TYPES.OBJECT_SLIDER].inject({
        onLeftRight(direction: boolean) {
            this.parent(direction)
            MenuOptions.ttsMenuEnabled && speakInterrupt(
                `${this.currentNumber instanceof sc.TextGui ? this.currentNumber.text : (this.currentNumber as sc.NumberGui).targetNumber}`)
        }
    })
}
