import { Lang } from '../../lang-manager'
import { Opts } from '../../plugin'
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
        speakArgsC(Lang.menu.options.categorySwitch, this.text!)
        button_setIgnoreFrom(Date.now())

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
            return [Lang.menu.options.buttonGroup, Object.keys(entry.data)[val as number]]
        case 'ARRAY_SLIDER':
            return [Lang.menu.options.slider, `${((val as number) * 100).floor()}%`]
        case 'OBJECT_SLIDER':
            return [Lang.menu.options.slider, `${entry.showPercentage ? `${((val as number) * 100).floor()}%` : Object.values(entry.data).findIndex(e => e == val) + 1}`]
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
                speakI(text)
            }
            SpecialAction.setListener('LSP', 'optionsRead', () => {
                sc.menu.isOptions() && speakI(`${entry.description}`)
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
