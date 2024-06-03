import type { GuiOption } from 'ccmodmanager/types/mod-options'
import { Lang } from '../../lang-manager'
import { Opts } from '../../options'
import { SpecialAction } from '../../special-action'
import { interrupt, speakArgsC, speakI, speakIC } from './api'
import { button_setIgnoreFrom } from './button'

declare global {
    namespace sc {
        interface RowButtonGroup {
            elements: (sc.ButtonGui & { optionRow: sc.OptionRow })[][]
        }
    }
}

sc.OptionsMenu.inject({
    exitMenu() {
        this.parent()
        interrupt()
    },
})
sc.OptionsTabBox.inject({
    showMenu() {
        speakArgsC(Lang.menu.options.firstOpen)
        button_setIgnoreFrom(Date.now())
        this.parent()
    },
})

sc.ItemTabbedBox.TabButton.inject({
    onPressedChange(pressed: boolean) {
        if (pressed) {
            speakArgsC(Lang.menu.options.categorySwitch, this.text!)
            button_setIgnoreFrom(Date.now())
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
sc.ModOptionsOptionRow.inject({
    init(...args) {
        this.parent(...args)
        this._rowGroup.elements[this.row].forEach(e => (e.optionRow = this))
    },
})

function optionValueToString(entry: sc.OptionDefinition | GuiOption, val: string | number | boolean): [string, string] {
    switch (entry.type) {
        case 'BUTTON_GROUP':
            return [Lang.menu.options.buttonGroup, Object.keys(entry.data!)[val as number]]
        case 'ARRAY_SLIDER':
            return [Lang.menu.options.slider, `${((val as number) * 100).floor()}%`]
        case 'OBJECT_SLIDER': {
            const opt = entry as GuiOption
            let str: string
            if ('customNumberDisplay' in opt && opt.customNumberDisplay) {
                str = opt.customNumberDisplay(val as number).toString()
            } else {
                str = `${entry.showPercentage ? `${((val as number) * 100).floor()}%` : Object.values(entry.data!).findIndex(e => e == val) + 1}`
            }
            return [Lang.menu.options.slider, str]
        }
        case 'CHECKBOX':
            return [Lang.menu.options.checkbox, `${val}`]
        case 'CONTROLS':
            return [Lang.menu.options.keybinding, Lang.misc.notSupported]
        case 'LANGUAGE':
            return [
                '',
                Object.entriesT(sc.LANGUAGE)
                    .sort(([_, langA], [__, langB]) => langA - langB)
                    .map(e => e[0])[val as number],
            ]
        case 'BUTTON':
        case 'JSON_DATA':
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
            if (!Opts.tts) return
            type OptionRowButton = sc.RowButtonGroup['elements'][0][0]
            const or: sc.OptionRow = (button as OptionRowButton)?.optionRow
            if (!or) {
                return
            }
            let name: string
            const description: string = or.optionDes

            const isModOptions = or instanceof sc.ModOptionsOptionRow
            if (isModOptions) {
                name = or.guiOption.name
            } else {
                name = ig.lang.get(`sc.gui.options.${or.optionName}.name`)
            }
            if (name && Date.now() - lastRowButtonGroupSpeak > 100) {
                lastRowButtonGroupSpeak = Date.now()
                let entry: sc.OptionDefinition | GuiOption
                let val: string | number | boolean
                if (isModOptions) {
                    entry = or.guiOption
                    val = sc.modMenu.options[or.guiOption.modId][or.guiOption.baseId]
                } else {
                    entry = sc.OPTIONS_DEFINITION[or.optionName]
                    val = sc.options.get(or.optionName) as any
                }
                if (or.option.type == 'BUTTON_GROUP') {
                    if (or.optionName == lastButtonGroup) {
                        return
                    }
                    const index: number = val as number
                    this._lastRowIndex = index
                    this.rowIndex[this.currentRow] = index
                    this.focusCurrentButton(this.currentRow, this.rowIndex[this.currentRow], false, false, true)
                    lastButtonGroup = or.optionName
                } else {
                    lastButtonGroup = undefined
                }

                const optStr = optionValueToString(entry, val)
                const text: string = `${name}, ${optStr[0]}, ${optStr[1]}`
                speakI(text)
            } else {
                /* unblock */
                lastRowButtonGroupSpeak = 0
            }
            SpecialAction.setListener('LSP', 'optionsRead', () => {
                sc.menu.isOptions() && speakI(`${description}`)
            })
        })
    },
})

sc.OPTION_GUIS[sc.OPTION_TYPES.ARRAY_SLIDER].inject({
    onLeftRight(direction: boolean) {
        this.parent(direction)
        speakIC(`${((this._lastVal / this.scale) * 100).floor()}%`)
    },
})

sc.OPTION_GUIS[sc.OPTION_TYPES.OBJECT_SLIDER].inject({
    onLeftRight(direction: boolean) {
        this.parent(direction)
        speakIC(`${this.currentNumber instanceof sc.TextGui ? this.currentNumber.text : (this.currentNumber as sc.NumberGui).targetNumber}`)
    },
})
