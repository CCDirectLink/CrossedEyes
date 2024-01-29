import { Opts } from '../../options-manager'
import { Hint, HintData, HintSystem } from '../hint-system'

export class HChest implements Hint {
    entryName = 'Chest'

    constructor() {
        /* run in prestart */
        HintSystem.customColors['Chests'] = sc.ANALYSIS_COLORS.GREEN
        const self = this
        ig.ENTITY.Chest.inject({
            getQuickMenuSettings(): Omit<sc.QuickMenuTypesBaseSettings, 'entity'> {
                return { type: 'Hints', hintName: self.entryName, hintType: 'Chests', disabled: !(Opts.hints && !this.isOpen) }
            },
        })
    }
    getDataFromEntity(e: ig.Entity): HintData {
        if (!(e instanceof ig.ENTITY.Chest)) throw new Error()

        const name: string = `Chest`
        const description: string = "I wonder what's inside?"
        return { name, description }
    }
}
