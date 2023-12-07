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

const leaSounds: boolean = false

export class TextGather {
    static g: TextGather

    private connect: { count: number, template: string, args: sc.TextLike[] } | undefined
    private lastMessage: sc.TextLike = ''
    ignoreInterrupt: boolean = false

    public speak(textLike: sc.TextLike): void {
        this.interrupt()
        if (this.connect?.count) {
            this.connect.count--
            this.connect.args.push(textLike)
        }
        if (this.connect?.count == 0) {
            this.speakArgs(this.connect.template, ...this.connect.args)
            this.connect = undefined
        } else {
            this.speakCall(getReadableText(textLike!.toString()))
        }
    }

    public speakArgs(template: string, ...textLikes: sc.TextLike[]) {
        const matchArr = template.match(interpolateStringRegex) ?? []
        if (textLikes.length < matchArr.length) {
            this.connect = { count: matchArr.length - textLikes.length, template, args: textLikes }
        } else {
            this.interrupt()
            this.speakCall(interpolateString(template, ...textLikes.map(textLike => getReadableText(textLike!.toString()))))
        }
    }

    constructor(private speakCall: (text: string) => void, public interrupt: () => void) { /* in prestart */
        TextGather.g = this
        SpecialAction.setListener('RSP', 'repeatLast', () => {
            MenuOptions.ttsEnabled && this.speak(this.lastMessage)
        })
        const speakCallCopy = speakCall
        this.speakCall = (text: string) => {
            speakCallCopy(text)
            this.lastMessage = text
            // console.log(text)
        }
        const interruptCopy = interrupt
        this.interrupt = () => {
            if (! this.ignoreInterrupt) {
                interruptCopy()
                // console.log('interrupt')
            }
        }
        this.ingame()
        this.menu()
    }

    private ingame() {
        const self = this
        let prevChar: string | undefined

        let sideMsg: boolean = false
        sc.SideMessageHudGui.inject({
            showNextSideMessage() {
                self.interrupt()
                sideMsg = true
                this.parent()
                sideMsg = false
            }
        })
        sc.VoiceActing.inject({
            init() {
                this.parent()
                this.load()
            },
            play(exp: sc.CharacterExpression, label: ig.LangLabel) {
                const isOn = MenuOptions.ttsCharEnabled
                if (isOn) {
                    if (leaSounds && exp.character.name == 'main.lea') {
                        this.active = true
                        self.interrupt()
                    } else {
                        let charName: string = ig.LangLabel.getText((exp.character.data as any).name)
                        if (charName == '???') { charName = 'Unknown' }

                        const labelStr: string = label.toString()
                        let expression: string = ''
                        if (!sc.message.blocking || prevChar != charName) {
                            expression = expressionMap[exp.expression]
                            if (expression === undefined) {
                                console.error(`expression: "${exp.expression}" not mapped`)
                                expression = 'Expression mapping error'
                            }
                        }
                        let text: string
                        if (labelStr == '[nods]') {
                            text = `${charName} nods`
                        } else if (labelStr == '...' || labelStr == '...!' || labelStr == '...?') {
                            text = `${expression} ${charName} is silent${labelStr.length == 4 ? labelStr[3] : ''}`
                        } else {
                            text = `${prevChar != charName ? `${expression} ${charName} says: ` : ''}${labelStr}`
                        }
                        sideMsg && (text = `Side: ${text}`)
                        prevChar = charName
                        self.speak(text)
                    }
                }
                this.parent(exp, label)
                if (isOn) { this.active = false }
            },
        })
        sc.MessageModel.inject({
            clearBlocking() {
                self.interrupt()
                this.parent()
            },
            clearAll() {
                prevChar = undefined
                this.parent()
            }
        })
        sc.getMessageTime = function (textLike: sc.TextLike) {
            if (MenuOptions.ttsMenuEnabled) {
                return textLike!.toString().length / 20 * 1.8 * MenuOptions.ttsSpeed + 1
            } else {
                return Math.max(2, (textLike!.toString().length / 20) * 1 + 1) /* original formula */
            }
        }

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
                MenuOptions.ttsMenuEnabled && self.speak(this.text)
                return this.parent(...args)
            },
        })
        
        sc.InputForcer.inject({
            setEntry(action, title, textKeyboard, textGamepad) {
                if (MenuOptions.ttsMenuEnabled) {
                    textGamepad = ig.LangLabel.getText(textGamepad as ig.LangLabel.Data)
                    if (textGamepad == 'Press \\i[throw] + \\i[throw] + \\i[throw] + \\i[throw]') {
                        textGamepad = 'Press \\i[throw] or \\i[gamepad-x] 4 times'
                    }
                    this.parent(action, title, textKeyboard, textGamepad)
                    self.speak( `${ig.LangLabel.getText(title as ig.LangLabel.Data)}: ${textGamepad}`)
                } else {
                    this.parent(action, title, textKeyboard, textGamepad)
                }
            },
            _endBlock() {
                MenuOptions.ttsMenuEnabled && self.interrupt()
                this.parent()
            }
        })
        /* fix sc.InputForcer not accepting Gamepad X as a attack button and forcing R1 */
        sc.Control.inject({
            fullScreenAttacking(): boolean {
                return sc.control.autoControl ? sc.control.autoControl.get('attacking') : ig.input.pressed('aim') ||
                    (ig.gamepad.isButtonPressed(sc.control._getAttackButton()) || /* fix here -> */ ig.gamepad.isButtonPressed(sc.control._getMeleeButton()))
            }
        })

        sc.INPUT_FORCER_ENTRIES.ATTACK_LEFT = {
            cancelAction: true,
            check: function () {
                return !sc.control.fullScreenAttacking() ? false : true
            },
            keep: false,
        }

        sc.QuickMenuModel.inject({
            enterQuickMenu() {
                this.parent()
                MenuOptions.ttsMenuEnabled && self.speak('Quick Menu')
            },
            exitQuickMenu() {
                this.parent()
                /* how is this called in the title screen???? dont know */
                if (sc.model.currentState == sc.GAME_MODEL_STATE.GAME) {
                    self.interrupt()
                }
            }
        })

        sc.RingMenuButton.inject({
            focusGained() {
                this.parent()
                if (MenuOptions.ttsMenuEnabled) {
                    let text: string | undefined
                    switch (this.state) {
                        case sc.QUICK_MENU_STATE.NONE: break;
                        case sc.QUICK_MENU_STATE.ITEMS: text = 'Items'; break
                        case sc.QUICK_MENU_STATE.CHECK: text = 'Analysis'; break
                        case sc.QUICK_MENU_STATE.PARTY: text = 'Party'; break
                        case sc.QUICK_MENU_STATE.MAP: text = 'Map'; break
                    }
                    if (text) {
                        self.speak(text)
                        SpecialAction.setListener('LSP', 'quickMenuDescription', () => {
                            MenuOptions.ttsMenuEnabled && this.focus && self.speak(this.data)
                        })
                    }
                }
            }
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
                        self.speak(this.text)
                    }
                }
                return this.parent()
            },
        })
        
        sc.OptionsMenu.inject({
            exitMenu() {
                this.parent()
                MenuOptions.ttsMenuEnabled && self.interrupt()
            }
        })
        sc.OptionsTabBox.inject({
            showMenu() {
                if (MenuOptions.ttsMenuEnabled) {
                    self.speakArgs('Options menu, Category General: ${0}')
                    ignoreButtonFrom = Date.now()
                }
                this.parent()
            }
        })
    
        sc.ItemTabbedBox.TabButton.inject({
            onPressedChange(pressed: boolean) {
                if (pressed && MenuOptions.ttsMenuEnabled) {
                    self.speakArgs('Category ${0}: ${1}', this.text)
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
                            self.speak(text)
                        }
                        SpecialAction.setListener('LSP', 'optionsRead', () => {
                            sc.menu.isOptions() && self.speak(`${entry.description}`)
                        })
                    }
                })
            },
        })
        sc.OPTION_GUIS[sc.OPTION_TYPES.CHECKBOX].inject({
            onPressed(checkbox: sc.CheckboxGui) {
                this.parent(checkbox)
                checkbox == this.button && MenuOptions.ttsMenuEnabled && self.speak(checkbox.pressed)
            }
        })
        sc.OPTION_GUIS[sc.OPTION_TYPES.ARRAY_SLIDER].inject({
            onLeftRight(direction: boolean) {
                this.parent(direction)
                MenuOptions.ttsMenuEnabled && self.speak(`${(this._lastVal / this.scale * 100).floor()}%`)
            }
        })
        sc.OPTION_GUIS[sc.OPTION_TYPES.OBJECT_SLIDER].inject({
            onLeftRight(direction: boolean) {
                this.parent(direction)
                MenuOptions.ttsMenuEnabled && self.speak(
                    `${this.currentNumber instanceof sc.TextGui ? this.currentNumber.text : (this.currentNumber as sc.NumberGui).targetNumber}`)
            }
        })
 
        sc.ModalButtonInteract.inject({
            show() {
                MenuOptions.ttsMenuEnabled && self.speakArgs(`Dialog: \${0}, \${1}`, this.textGui.text)
                this.parent()
            },
            hide() {
                MenuOptions.ttsMenuEnabled && self.interrupt()
                this.parent()
            },
        })
    }
}

