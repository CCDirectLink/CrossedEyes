import { Lang } from '../../lang-manager'
import { Opts } from '../../plugin'
import { Hint, HintData } from '../hint-system'

export class HDestructible implements Hint {
    entryName = 'Destructible'

    private descturcibles: Record</* propName */ string, HintData> = Lang.hints.destructibles

    constructor() {
        /* run in prestart */
        const self = this
        ig.ENTITY.Destructible.inject({
            init(x, y, z, settings) {
                this.parent(x, y, z, settings)
                this.desType = settings.desType
            },
            getQuickMenuSettings(): Omit<sc.QuickMenuTypesBaseSettings, 'entity'> {
                return { type: 'Hints', hintName: self.entryName, hintType: 'Puzzle', disabled: !Opts.hints }
            },
        })
    }
    getDataFromEntity(e: ig.Entity): HintData {
        if (!(e instanceof ig.ENTITY.Destructible)) throw new Error()
        return this.descturcibles[e.desType] ?? this.descturcibles.default
    }
}
