import { MenuOptions } from '../optionsManager'
import CrossedEyes from '../plugin'
import { SpecialAction } from '../special-action'
import { expressionMap } from './expressionMap'
import { fontImgToName } from './fontImgToTextMap'
import { CharacterSpeakData } from './tts'

function getReadableText(orig: string): string {
    let text: string = orig
        .replace(/\\c\[[^\]]*\]/g, '')
        .replace(/\\s\[[^\]]*\]/g, '')
        .replace(/%/g, ' percent')
        .replace(/\+/g, ' and ')

    const imgMatches: string[] | null = text.match(/\\i\[[^\]]*\]/g)
    for (let img of imgMatches ?? []) {
        const replacement: string = fontImgToName(img.substring(3, img.length - 1))
        if (replacement === undefined) {
            console.warn(`IMAGE: '${img}' is unmapped`)
        }
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

    private connect: { count: number; template: string; args: sc.TextLike[] } | undefined
    private lastMessage: sc.TextLike = ''
    public ignoreInteract: number = 0
    public ignoreInteractTo: number = 0

    public charSpeak(textLike: sc.TextLike, data: CharacterSpeakData): void {
        this.interrupt()
        this.characterSpeakCall(getReadableText(textLike!.toString()), data)
    }

    public speak(textLike: sc.TextLike): void {
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

    public speakI(textLike: sc.TextLike): void {
        this.interrupt()
        this.speak(textLike)
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

    constructor(
        private speakCall: (text: string) => void,
        private characterSpeakCall: (text: string, data: CharacterSpeakData) => void,
        public interrupt: () => void
    ) {
        /* in prestart */

        TextGather.g = this
        CrossedEyes.initPoststarters.push(this)
        SpecialAction.setListener('RSP', 'repeatLast', () => {
            MenuOptions.ttsEnabled && this.speakI(this.lastMessage)
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
            if (this.ignoreInteract > 0) {
                this.ignoreInteract--
            } else if (Date.now() > this.ignoreInteractTo) {
                interruptCopy()
            }
        }
        this.initGather()
    }

    initPoststart() {
        const self = this
        let lastArea: string | undefined
        let lastMapKeys: string[] | undefined
        sc.Model.addObserver<sc.MapModel>(
            sc.map,
            new (class {
                modelChanged(model: sc.Model, msg: sc.MAP_EVENT) {
                    if (MenuOptions.ttsEnabled && model == sc.map && !sc.model.isCutscene() && msg == sc.MAP_EVENT.MAP_ENTERED) {
                        const area: string = sc.map.getCurrentAreaName().value
                        const map: string = sc.map.getCurrentMapName().value

                        let toSpeak: string = ''

                        if (area != lastArea) {
                            toSpeak += `${area} - `
                            lastArea = area
                        }
                        let currMapKeys = Object.keys(ig.vars.storage.maps)
                        if (lastMapKeys) {
                            const mapPath = ig.game.mapName.toCamel().toPath('', '')
                            if (!lastMapKeys.includes(mapPath) && currMapKeys.includes(mapPath)) {
                                toSpeak += 'new'
                            }
                        }
                        lastMapKeys = currMapKeys

                        toSpeak += `map: ${map}`
                        self.speakI(toSpeak)
                        self.ignoreInteract = 1
                    }
                }
            })()
        )
        sc.GameModel.inject({
            enterTitle() {
                this.parent()
                lastArea = undefined
                lastMapKeys = undefined
            },
        })
    }

    private initGather() {
        const self = this
        let prevChar: string | undefined

        let sideMsg: boolean = false
        sc.SideMessageHudGui.inject({
            showNextSideMessage() {
                self.interrupt()
                sideMsg = true
                this.parent()
                sideMsg = false
            },
        })
        let buttonSayChoice: boolean = true
        sc.VoiceActing.inject({
            init() {
                this.parent()
                this.load()
            },
            play(exp: sc.CharacterExpression, label: ig.LangLabel) {
                const isOn = MenuOptions.ttsChar
                if (isOn) {
                    if (leaSounds && exp.character.name == 'main.lea') {
                        this.active = true
                        self.interrupt()
                    } else {
                        let charName: string = ig.LangLabel.getText((exp.character.data as any).name)
                        if (charName == '???') {
                            charName = 'Unknown'
                        }

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
                        } else if (labelStr.startsWith('...') && labelStr.length <= 5) {
                            /* cover: ... ...! ...? ...?! */
                            text = `${expression} ${charName} is silent${labelStr.substring(3)}`
                        } else {
                            text = `${prevChar != charName ? `${expression} ${charName} says: ` : ''}${labelStr}`
                        }
                        sideMsg && (text = `Side: ${text}`)
                        prevChar = charName
                        self.charSpeak(text, {})
                    }
                }
                this.parent(exp, label)
                if (isOn) {
                    this.active = false
                }
            },
        })
        sc.MessageModel.inject({
            clearBlocking() {
                self.interrupt()
                buttonSayChoice = true
                this.parent()
            },
            clearAll() {
                prevChar = undefined
                this.parent()
            },
        })

        sc.CenterMsgBoxGui.inject({
            init(...args) {
                this.parent(...args)
                MenuOptions.ttsEnabled && self.speakI(this.textGui.text)
            },
            _close() {
                MenuOptions.ttsEnabled && self.interrupt()
                return this.parent()
            },
        })

        ig.EVENT_STEP.SHOW_AR_MSG.inject({
            start(...args) {
                MenuOptions.ttsEnabled && self.speakI(this.text)
                return this.parent(...args)
            },
        })

        sc.InputForcer.inject({
            setEntry(action, title, textKeyboard, textGamepad) {
                if (MenuOptions.ttsEnabled) {
                    textGamepad = ig.LangLabel.getText(textGamepad as ig.LangLabel.Data)
                    if (textGamepad == 'Press \\i[throw] + \\i[throw] + \\i[throw] + \\i[throw]') {
                        textGamepad = 'Press \\i[throw] or \\i[gamepad-x] 4 times'
                    }
                    this.parent(action, title, textKeyboard, textGamepad)
                    self.speakI(`${ig.LangLabel.getText(title as ig.LangLabel.Data)}: ${textGamepad}`)
                } else {
                    this.parent(action, title, textKeyboard, textGamepad)
                }
            },
            _endBlock() {
                MenuOptions.ttsEnabled && self.interrupt()
                this.parent()
            },
        })
        /* fix sc.InputForcer not accepting Gamepad X as a attack button and forcing R1 */
        sc.Control.inject({
            fullScreenAttacking(): boolean {
                return sc.control.autoControl
                    ? sc.control.autoControl.get('attacking')
                    : ig.input.pressed('aim') ||
                          ig.gamepad.isButtonPressed(sc.control._getAttackButton()) ||
                          /* fix here -> */ ig.gamepad.isButtonPressed(sc.control._getMeleeButton())
            },
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
                MenuOptions.ttsEnabled && self.speakI('Quick Menu')
            },
            exitQuickMenu() {
                this.parent()
                /* how is this called in the title screen???? dont know */
                if (sc.model.currentState == sc.GAME_MODEL_STATE.GAME) {
                    self.interrupt()
                }
            },
        })

        sc.RingMenuButton.inject({
            focusGained() {
                this.parent()
                if (MenuOptions.ttsEnabled) {
                    let text: string | undefined
                    switch (this.state) {
                        case sc.QUICK_MENU_STATE.NONE:
                            break
                        case sc.QUICK_MENU_STATE.ITEMS:
                            text = 'Items'
                            break
                        case sc.QUICK_MENU_STATE.CHECK:
                            text = 'Analysis'
                            break
                        case sc.QUICK_MENU_STATE.PARTY:
                            text = 'Party'
                            break
                        case sc.QUICK_MENU_STATE.MAP:
                            text = 'Map'
                            break
                    }
                    if (text) {
                        self.speakI(text)
                        SpecialAction.setListener('LSP', 'quickMenuDescription', () => {
                            MenuOptions.ttsEnabled && this.focus && self.speakI(this.data)
                        })
                    }
                }
            },
        })

        /* ------------------ menu ------------------ */
        let ignoreButtonFrom: number = 0

        sc.ButtonGui.inject({
            focusGained() {
                if (MenuOptions.ttsEnabled) {
                    const diff = Date.now() - ignoreButtonFrom
                    if (diff > 50) {
                        if (buttonSayChoice && sc.message.blocking && !ig.game.paused && !ig.loading && !sc.model.isTitle()) {
                            self.speak(this.text)
                            buttonSayChoice = false
                        } else {
                            self.speakI(this.text)
                        }
                    }
                }
                return this.parent()
            },
        })

        sc.OptionsMenu.inject({
            exitMenu() {
                this.parent()
                MenuOptions.ttsEnabled && self.interrupt()
            },
        })
        sc.OptionsTabBox.inject({
            showMenu() {
                if (MenuOptions.ttsEnabled) {
                    self.speakArgs('Options menu, Category General: ${0}')
                    ignoreButtonFrom = Date.now()
                }
                this.parent()
            },
        })

        sc.ItemTabbedBox.TabButton.inject({
            onPressedChange(pressed: boolean) {
                if (pressed && MenuOptions.ttsEnabled) {
                    self.speakArgs('Category ${0}: ${1}', this.text)
                    ignoreButtonFrom = Date.now()
                }
                return this.parent(pressed)
            },
        })
        sc.OptionRow.inject({
            init(option, row, rowGroup, local, width, height) {
                this.parent(option, row, rowGroup, local, width, height)
                this._rowGroup.elements[this.row].forEach(e => (e.optionRow = this))
            },
        })

        function optionValueToString(optionName: string): [string, string] {
            const entry = sc.OPTIONS_DEFINITION[optionName]
            const val: string | number | boolean = sc.options.get(optionName) as any
            switch (entry.type) {
                case 'BUTTON_GROUP':
                    return ['Button group', Object.keys(entry.data)[val as number]]
                case 'ARRAY_SLIDER':
                    return ['Slider', `${((val as number) * 100).floor()}%`]
                case 'OBJECT_SLIDER':
                    return ['Slider', `${entry.showPercentage ? `${((val as number) * 100).floor()}%` : Object.values(entry.data).findIndex(e => e == val) + 1}`]
                case 'CHECKBOX':
                    return ['Checkbox', `${val}`]
                case 'CONTROLS':
                    return ['Keybinding', 'not supported']
                case 'LANGUAGE':
                    return [
                        '',
                        Object.entries(sc.LANGUAGE)
                            .sort((a, b) => (a[1] as number) - (b[1] as number))
                            .map(e => e[0])[val as number],
                    ]
                case 'INFO':
                    return ['', '']
            }
        }

        let lastButtonGroup: string | undefined
        let lastRowButtonGroupSpeak: number = 0
        sc.RowButtonGroup.inject({
            init() {
                this.parent()
                this.addSelectionCallback((button?: ig.FocusGui) => {
                    if (MenuOptions.ttsEnabled) {
                        const or: sc.OptionRow = (button as sc.RowButtonGroup['elements'][0][0])?.optionRow
                        if (!or) {
                            return
                        }
                        const entry: { name: string; description: string } = ig.lang.labels.sc.gui.options[or.optionName]
                        if (entry && Date.now() - lastRowButtonGroupSpeak > 100) {
                            lastRowButtonGroupSpeak = Date.now()
                            if (or.option.type == 'BUTTON_GROUP') {
                                if (or.optionName == lastButtonGroup) {
                                    return
                                }
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
                            self.speakI(text)
                        }
                        SpecialAction.setListener('LSP', 'optionsRead', () => {
                            sc.menu.isOptions() && self.speakI(`${entry.description}`)
                        })
                    }
                })
            },
        })
        sc.OPTION_GUIS[sc.OPTION_TYPES.CHECKBOX].inject({
            onPressed(checkbox: sc.CheckboxGui) {
                this.parent(checkbox)
                checkbox == this.button && MenuOptions.ttsEnabled && self.speakI(checkbox.pressed)
            },
        })
        sc.OPTION_GUIS[sc.OPTION_TYPES.ARRAY_SLIDER].inject({
            onLeftRight(direction: boolean) {
                this.parent(direction)
                MenuOptions.ttsEnabled && self.speakI(`${((this._lastVal / this.scale) * 100).floor()}%`)
            },
        })
        sc.OPTION_GUIS[sc.OPTION_TYPES.OBJECT_SLIDER].inject({
            onLeftRight(direction: boolean) {
                this.parent(direction)
                MenuOptions.ttsEnabled &&
                    self.speakI(`${this.currentNumber instanceof sc.TextGui ? this.currentNumber.text : (this.currentNumber as sc.NumberGui).targetNumber}`)
            },
        })

        sc.ModalButtonInteract.inject({
            show() {
                MenuOptions.ttsEnabled && self.speakArgs(`Dialog: \${0}, \${1}`, this.textGui.text)
                this.parent()
            },
            hide() {
                MenuOptions.ttsEnabled && self.interrupt()
                this.parent()
            },
        })
        sc.SaveSlotButton.inject({
            focusGained() {
                this.parent()
                if (MenuOptions.ttsEnabled) {
                    const slot = this.slotOver
                    const sg = slot.slotGui
                    const name: string = sg instanceof sc.NumberGui ? sg.targetNumber.toString() : sg instanceof sc.TextGui ? sg.text!.toString() : ''

                    const chapter: number = this.chapter.chapterGui.targetNumber
                    const location: string = this.location.location.text!.toString()
                    const speak = `Slot ${name}, chapter ${chapter}, ${location}`
                    TextGather.g.speakI(speak)

                    const level: number = this.level.targetNumber
                    const hours = this.time.hour.targetNumber
                    const playtime: string = `${hours > 0 ? `${hours} hours` : ''}${this.time.minute.targetNumber} minutes`
                    SpecialAction.setListener('LSP', 'saveMenu', () => {
                        TextGather.g.speakI(`level ${level}, playtime ${playtime}`)
                    })
                }
            },
            focusLost() {
                this.parent()
                SpecialAction.setListener('LSP', 'saveMenu', () => {})
                TextGather.g.interrupt()
            },
        })

        sc.SaveSlotNewButton.inject({
            focusGained() {
                this.parent()
                MenuOptions.ttsEnabled && TextGather.g.speakI('Create new save file')
            },
        })
    }
}
