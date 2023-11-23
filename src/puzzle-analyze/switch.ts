import { MenuOptions } from '../options'
import { PuzzleExtension, PuzzleExtensionData } from './puzzle-analyze'

export class PuzzleExtensionSwitch implements PuzzleExtension {
    entryName = 'Switch'

    constructor() { /* run in prestart */
        const self = this
        ig.ENTITY.Switch.inject({
            getQuickMenuSettings(): Omit<sc.QuickMenuTypesBaseSettings, 'entity'> {
                return { type: 'PuzzleElements', puzzleType: self.entryName, disabled: !(MenuOptions.puzzleEnabled) }
            },
            isQuickMenuVisible() { return false },
        })
    }
    getDataFromEntity(e: ig.Entity): PuzzleExtensionData {
        if (!(e instanceof ig.ENTITY.Switch)) { throw new Error() }

        const name: string = `Switch, Status: ${e.isOn ? 'on' : 'off'}`
        const description: string = `Hit with a ball or a melee to toggle.`
        return { name, description }
    }

}
