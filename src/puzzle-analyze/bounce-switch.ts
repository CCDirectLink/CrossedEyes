import { MenuOptions } from '../options'
import { PuzzleExtension, PuzzleExtensionData } from './puzzle-analyze'

export class PuzzleExtensionBounceSwitch implements PuzzleExtension {
    entryName = 'BounceSwitch'

    constructor() { /* run in prestart */
        const self = this
        ig.ENTITY.BounceSwitch.inject({
            getQuickMenuSettings(): Omit<sc.QuickMenuTypesBaseSettings, 'entity'> {
                return { type: 'PuzzleElements', puzzleType: self.entryName, disabled: !(MenuOptions.puzzleEnabled && !this.isOn) }
            },
            isQuickMenuVisible() { return false },
        })
    }
    getDataFromEntity(e: ig.Entity): PuzzleExtensionData {
        if (!(e instanceof ig.ENTITY.BounceSwitch)) { throw new Error() }

        const name: string = `Bounce Switch`
        const description: string = 'A final destination for a ball that bounced from a Bounce Block'
        return { name, description }
    }

}
