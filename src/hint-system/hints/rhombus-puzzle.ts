import { Opts } from '../../options-manager'
import { Hint, HintData } from '../hint-system'

export class HOLPlatform implements Hint {
    entryName = 'OLPlatform'

    constructor() {
        /* run in prestart */
        const self = this
        ig.ENTITY.OLPlatform.inject({
            getQuickMenuSettings(): Omit<sc.QuickMenuTypesBaseSettings, 'entity'> {
                return { type: 'Hints', hintName: self.entryName, hintType: 'Puzzle', disabled: !Opts.hints || ig.game.mapName == 'rhombus-dng.room-1-6' }
            },
        })
    }
    getDataFromEntity(e: ig.Entity): HintData {
        if (!(e instanceof ig.ENTITY.OLPlatform)) throw new Error()

        const name: string = `Moving block`
        const description: string = 'Extends or retracts when a certain condition is met.'
        return { name, description }
    }
}
