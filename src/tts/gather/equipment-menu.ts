import { Lang } from '../../lang-manager'
import { ObjectEntriesT, ObjectKeysT } from '../../misc/modify-prototypes'
import { Opts } from '../../options'
import { SpecialAction } from '../../special-action'
import { interrupt, speakArgsC, speakI } from './api'
import { button_excludeButtonClass } from './button'

declare global {
    namespace sc {
        interface BodyPartButton {
            parentEntry?: sc.EquipBodyPartContainer.Entry
        }
    }
}
/* in prestart */

sc.EquipMenu.inject({
    showMenu(...args) {
        speakArgsC('Equipment menu, ${0}')
        this.parent(...args)
    },
    hideMenu(...args) {
        this.parent(...args)
        interrupt()
        SpecialAction.setListener('LSP', 'equipmentMenuDescription', () => {})
        SpecialAction.setListener('R2', 'equipmentDiff', () => {})
        SpecialAction.setListener('L2', 'equipmentModifierDiff', () => {})
    },
})

sc.EquipRightContainer.inject({
    init(globalButtons) {
        this.parent(globalButtons)

        this.itemList.list.buttonGroup.addSelectionCallback(b1 => {
            const b = b1 as sc.EquipStatusContainer.Button
            if (Opts.tts) {
                speakI(b.button?.text!)

                SpecialAction.setListener('LSP', 'equipmentMenuDescription', () => {
                    speakI(b.data.description)
                })
                SpecialAction.setListener('R2', 'equipmentDiff', () => {
                    statDifference()
                })
                SpecialAction.setListener('L2', 'equipmentModifierDiff', () => {
                    modifierDifference()
                })
            }
        })
    },
})

button_excludeButtonClass(sc.BodyPartButton)
sc.BodyPartButton.inject({
    focusGained() {
        this.parent()
        if (this.parentEntry && Opts.tts) {
            const bodyPart: string = this.parentEntry.text.text!.toString()
            speakI(`${bodyPart}: ${this.textChild.text!.toString()}`)

            SpecialAction.setListener('LSP', 'equipmentMenuDescription', () => {
                speakI((this.data as ig.LangLabel).value)
            })
        }
    },
})

sc.EquipBodyPartContainer.Entry.inject({
    init(bodyPart, equip, x, y, globalButton, topY) {
        this.parent(bodyPart, equip, x, y, globalButton, topY)
        this.button.parentEntry = this
    },
})

let EquipStatusContainer: sc.EquipStatusContainer
sc.EquipStatusContainer.inject({
    init() {
        this.parent()
        EquipStatusContainer = this
    },
    _resetChangeValue(resetModifiersValues) {
        this.parent(resetModifiersValues)
        /* the values arent recalculated when you focus a wepon you already wear, so it shows the has ones */
        ;[...Object.values(this.allModifiers), ...Object.values(this.baseParams)].map(e => (e.changeValueGui.targetNumber = 0))
    },
})

const statIdToLangIdMap: Record<keyof typeof EquipStatusContainer.baseParams, keyof typeof Lang.stats> = {
    hp: 'health',
    atk: 'attack',
    def: 'defense',
    foc: 'focus',
    fire: 'heat',
    cold: 'cold',
    shock: 'shock',
    wave: 'wave',
} as const

function statDifference() {
    const diff = getStats()

    const strings = diff.map(([langId, number]) => {
        return Lang.stats.statDifferenceTemplate.supplant({
            sign: number > 0 ? Lang.misc.plus : Lang.misc.minus,
            value: Math.abs(number),
            statName: Lang.stats[langId],
        })
    })
    const text = strings.length > 0 ? `${strings.join(', ')}.` : Lang.menu.equipment.noStatChanges
    speakI(text)
}

function getStats(): [keyof typeof Lang.stats, number][] {
    const params = EquipStatusContainer.baseParams
    return ObjectEntriesT(statIdToLangIdMap)
        .map(([statId, langId]) => {
            const gui = params[statId]
            const changedNum = gui.changeValueGui.targetNumber
            if (changedNum) return [langId, changedNum]
        })
        .filter(Boolean) as any
}

function modifierDifference() {
    const diff = getModifiers()

    const strings = diff.map(([statName, number]) => {
        return Lang.stats.statDifferenceTemplate.supplant({
            sign: number > 0 ? Lang.misc.plus : Lang.misc.minus,
            value: Math.abs(number),
            statName,
        })
    })
    const text = strings.length > 0 ? `${strings.join(', ')}.` : Lang.menu.equipment.noModifierChanges
    speakI(text)
}

type Modifiers = keyof typeof sc.MODIFIERS
function getModifiers(): [Modifiers, number][] {
    const modifiers = EquipStatusContainer.allModifiers
    return ObjectKeysT(sc.MODIFIERS)
        .map(modifierId => {
            const gui = modifiers[modifierId]
            const changedNum = gui.changeValueGui.targetNumber
            if (changedNum) return [ig.lang.get(`sc.gui.menu.equip.modifier.${modifierId}`), changedNum]
        })
        .filter(Boolean) as any
}
