import { Lang } from '../../lang-manager'
import { Opts } from '../../options-manager'
import { Hint, HintData } from '../hint-system'
import { HClimbableTerrain } from './climbable-terrain'

export class HProp implements Hint {
    entryName = 'Prop'

    private props: Record</* propName */ string, HintData> = Lang.hints.props

    constructor() {
        /* run in prestart */
        const self = this
        ig.ENTITY.Prop.inject({
            getQuickMenuSettings(): Omit<sc.QuickMenuTypesBaseSettings, 'entity'> {
                const sett = HClimbableTerrain.getPropConfig(this)
                if (sett) return sett
                return { type: 'Hints', hintName: self.entryName, hintType: 'Chests', disabled: !Opts.hints || !self.props[this.propName] }
            },
        })
    }
    getDataFromEntity(e: ig.Entity): HintData {
        if (!(e instanceof ig.ENTITY.Prop)) throw new Error()
        return this.props[e.propName]
    }
}
