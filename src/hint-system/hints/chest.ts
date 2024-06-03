import { Lang } from '../../lang-manager'
import { Opts } from '../../options'
import { HintBase, HintData, HintSystem } from '../hint-system'

export class HChest implements HintBase {
    entryName = 'Chest' as const

    constructor() {
        /* run in prestart */
        HintSystem.customColors['Chests'] = sc.ANALYSIS_COLORS.GREEN
        const self = this
        ig.ENTITY.Chest?.inject({
            getQuickMenuSettings(): Omit<sc.QuickMenuTypesBaseSettings, 'entity'> {
                return { type: 'Hints', hintName: self.entryName, hintType: 'Chests', disabled: !(Opts.hints && !this.isOpen) }
            },
        })
    }
    getDataFromEntity(e: ig.Entity): HintData {
        if (!(e instanceof ig.ENTITY.Chest)) throw new Error()
        return Lang.hints.Chest
    }
}
