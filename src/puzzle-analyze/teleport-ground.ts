import { MenuOptions } from '../options'
import { PuzzleExtension, PuzzleExtensionData } from './puzzle-analyze'

export class PuzzleExtensionTeleportGround implements PuzzleExtension {
    entryName = 'TeleportGround'

    constructor() { /* run in prestart */
        const self = this
        ig.ENTITY.TeleportGround.inject({
            getQuickMenuSettings(): Omit<sc.QuickMenuTypesBaseSettings, 'entity'> {
                return { type: 'PuzzleElements', puzzleType: self.entryName, disabled: !(MenuOptions.puzzleEnabled) }
            },
            isQuickMenuVisible() { return true },
        })
    }
    getDataFromEntity(e: ig.Entity): PuzzleExtensionData {
        if (!(e instanceof ig.ENTITY.TeleportGround)) { throw new Error() }

        const name: string = `Teleport Ground`
        const description: string = `Transports you to a different map`
        return { name, description }
    }

}
