import { MenuOptions } from '../options'
import { PuzzleExtension, PuzzleExtensionData } from './puzzle-analyze'

export class PuzzleExtensionDoor implements PuzzleExtension {
    entryName = 'Door'

    constructor() { /* run in prestart */
        const self = this
        ig.ENTITY.Door.inject({
            getQuickMenuSettings(): Omit<sc.QuickMenuTypesBaseSettings, 'entity'> {
                return { type: 'PuzzleElements', puzzleType: self.entryName, disabled: !(MenuOptions.puzzleEnabled) }
            },
            isQuickMenuVisible() { return true },
        })
    }
    getDataFromEntity(e: ig.Entity): PuzzleExtensionData {
        if (!(e instanceof ig.ENTITY.Door)) { throw new Error() }

        const name: string = `Door, active: ${e.active ? 'yes' : 'no'}`
        const description: string = `Transports you to a different map`
        return { name, description }
    }

}
