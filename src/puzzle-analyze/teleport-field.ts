import { MenuOptions } from '../options'
import { PuzzleExtension, PuzzleExtensionData } from './puzzle-analyze'

export class PuzzleExtensionTeleportField implements PuzzleExtension {
    entryName = 'TeleportField'

    constructor() { /* run in prestart */
        const self = this
        ig.ENTITY.TeleportField.inject({
            getQuickMenuSettings(): Omit<sc.QuickMenuTypesBaseSettings, 'entity'> {
                return { type: 'PuzzleElements', puzzleType: self.entryName, disabled: !(MenuOptions.puzzleEnabled) }
            },
            isQuickMenuVisible() { return true },
        })
    }
    getDataFromEntity(e: ig.Entity): PuzzleExtensionData {
        if (!(e instanceof ig.ENTITY.TeleportField)) { throw new Error() }

        const name: string = `Teleport Field`
        const description: string = `Transports you to a different map`
        return { name, description }
    }

}
