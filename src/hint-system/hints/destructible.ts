import { Lang } from '../../lang-manager'
import { Opts } from '../../plugin'
import { HintBase, HintData } from '../hint-system'

declare global {
    namespace ig {
        namespace ENTITY {
            interface Destructible {
                desType: keyof typeof sc.DESTRUCTIBLE_TYPE
            }
        }
    }
}

export class HDestructible implements HintBase {
    entryName = 'Destructible' as const

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
                return { type: 'Hints', hintName: self.entryName, hintType: 'Puzzle', disabled: !Opts.hints, aimBounceWhitelist: true }
            },
        })
    }
    getDataFromEntity(e: ig.Entity): HintData {
        if (!(e instanceof ig.ENTITY.Destructible)) throw new Error()
        return this.descturcibles[e.desType] ?? this.descturcibles.default
    }
}
