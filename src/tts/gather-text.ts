import { MenuOptions } from '../options'
import { SpecialAction } from '../special-action'
import { expressionMap } from './expressionMap'
import { fontImgToNameMap } from './fontImgToTextMap'

function getReadableText(orig: string): string {
    let text: string = orig.replace(/\\c\[[^\]]*\]/g, '').replace(/\\s\[[^\]]*\]/g, '')
        .replace(/%/g, ' percent').replace(/\+/g, ' and ')

    const imgMatches: string[] | null = text.match(/\\i\[[^\]]*\]/g)
    for (let img of imgMatches ?? []) {
        const replacement: string = fontImgToNameMap[img.substring(3, img.length - 1)]
        if (replacement === undefined) { console.warn(`IMAGE: '${img}' is unmapped`) }
        text = text.replace(img, replacement ?? '')
    }
    return text
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
export class TextGather {
    private connect: { count: number, template: string, args: string[] } | undefined
    private lastMessage: string = ''

    private speak(textLike: sc.TextLike): void {
        const text = getReadableText(textLike!.toString())
        if (this.connect?.count) {
            this.connect.count--
            this.connect.args.push(text)
            return
        }
        if (this.connect?.count == 0) {
            const text = interpolateString(this.connect.template, ...this.connect.args)
            this.speakCall(text)
            this.connect = undefined
        } else {
            this.speakCall(text)
        }
        this.lastMessage = textLike!.toString()
    }
    private speakInterrupt(textLike: sc.TextLike): void {
        this.interrupt()
        this.speak(textLike)
    }
    constructor(private speakCall: (text: string) => void, private interrupt: () => void) { /* in prestart */
        SpecialAction.setListener('RSP', 'repeatLast', () => {
            MenuOptions.ttsEnabled && this.speakInterrupt(this.lastMessage)
        })
        this.ingame()
        this.menu()
    }

    private ingame() {
        const self = this
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
                        self.interrupt()
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
                                if (!interrupted) { interrupted = true; self.interrupt() }
                                self.speak(`${expression} ${charName} says: `)
                            }
                        }
                        if (sc.message.blocking) {
                            prevChar = charName
                        } else {
                            prevChar = undefined
                        }
                        if (!interrupted) { interrupted = true; self.interrupt() }
                        if (label.toString() == '[nods]') {
                            self.speak(`${charName} nods`)
                        } else {
                            self.speak(label)
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
                self.interrupt()
                return this.parent(...args)
            }
        })

        sc.CenterMsgBoxGui.inject({
            init(...args) {
                this.parent(...args)
                MenuOptions.ttsMenuEnabled && self.speak(this.textGui.text)
            },
            _close() {
                MenuOptions.ttsMenuEnabled && self.interrupt()
                return this.parent()
            },
        })

        ig.EVENT_STEP.SHOW_AR_MSG.inject({
            start(...args) {
                MenuOptions.ttsMenuEnabled && self.speakInterrupt(this.text)
                return this.parent(...args)
            },
        })

        
        sc.InputForcer.inject({
            setEntry(action, title, textKeyboard, textGamepad) {
                this.parent(action, title, textKeyboard, textGamepad)
                MenuOptions.ttsMenuEnabled && self.speakInterrupt(
                    `${ig.LangLabel.getText(title as ig.LangLabel.Data)}: ${ig.LangLabel.getText(textGamepad as ig.LangLabel.Data)}`)
            },
        })
    }

    private menu() {
        const self = this
        let ignoreButtonFrom: number = 0
    
        sc.ButtonGui.inject({
            focusGained() {
                if (MenuOptions.ttsMenuEnabled) {
                    const diff = Date.now() - ignoreButtonFrom
                    if (diff > 50) {
                        self.speakInterrupt(this.text)
                    }
                }
                return this.parent()
            },
        })
        sc.OptionsTabBox.inject({
            showMenu() {
                if (MenuOptions.ttsMenuEnabled) {
                    self.connect = { count: 1, template: 'Options menu, Category General: ${0}', args: [] }
                    ignoreButtonFrom = Date.now()
                }
                this.parent()
            }
        })
    
        sc.ItemTabbedBox.TabButton.inject({
            onPressedChange(pressed: boolean) {
                if (pressed && MenuOptions.ttsMenuEnabled) {
                    self.connect = { count: 1, template: 'Category ${0}: ${1}', args: [getReadableText(this.text!.toString())] }
                    ignoreButtonFrom = Date.now()
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
        let lastRowButtonGroupSpeak: number = 0
        sc.RowButtonGroup.inject({
            init() {
                this.parent()
                this.addSelectionCallback((button?: ig.FocusGui) => {
                    if (MenuOptions.ttsMenuEnabled) {
                        const or: sc.OptionRow = (button as sc.RowButtonGroup['elements'][0][0])?.optionRow
                        if (! or) { return }
                        const entry: { name: string, description: string } = ig.lang.labels.sc.gui.options[or.optionName]
                        if (entry && Date.now() - lastRowButtonGroupSpeak > 100) {
                            lastRowButtonGroupSpeak = Date.now()
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
                            self.speakInterrupt(text)
                        }
                        SpecialAction.setListener('LSP', 'optionsRead', () => {
                            sc.menu.isOptions() && self.speakInterrupt(`${entry.description}`)
                        })
                    }
                })
            },
        })
        sc.OPTION_GUIS[sc.OPTION_TYPES.CHECKBOX].inject({
            onPressed(checkbox: sc.CheckboxGui) {
                this.parent(checkbox)
                checkbox == this.button && MenuOptions.ttsMenuEnabled && self.speakInterrupt(checkbox.pressed)
            }
        })
        sc.OPTION_GUIS[sc.OPTION_TYPES.ARRAY_SLIDER].inject({
            onLeftRight(direction: boolean) {
                this.parent(direction)
                MenuOptions.ttsMenuEnabled && self.speakInterrupt(`${(this._lastVal / this.scale * 100).floor()}%`)
            }
        })
        sc.OPTION_GUIS[sc.OPTION_TYPES.OBJECT_SLIDER].inject({
            onLeftRight(direction: boolean) {
                this.parent(direction)
                MenuOptions.ttsMenuEnabled && self.speakInterrupt(
                    `${this.currentNumber instanceof sc.TextGui ? this.currentNumber.text : (this.currentNumber as sc.NumberGui).targetNumber}`)
            }
        })
    
    }
}

