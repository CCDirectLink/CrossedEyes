import { MenuOptions } from '../../options'
import { Hint, HintData } from '../hint-system'

export class HDestructible implements Hint {
    entryName = 'Destructible'

    constructor() { /* run in prestart */
        const self = this
        ig.ENTITY.Destructible.inject({
            getQuickMenuSettings(): Omit<sc.QuickMenuTypesBaseSettings, 'entity'> {
                return { type: 'Hints', hintName: self.entryName, hintType: 'Puzzle', disabled: !(MenuOptions.puzzleEnabled) }
            },
            isQuickMenuVisible() { return false },
        })
    }
    getDataFromEntity(e: ig.Entity): HintData {
        if (!(e instanceof ig.ENTITY.Destructible)) { throw new Error() }

        const name: string = `Destructible`
        const description: string = ``
        return { name, description }
    }
}
