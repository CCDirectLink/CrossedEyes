import { Lang } from '../../lang-manager'
import { Opts } from '../../plugin'
import { HintBase, HintData } from '../hint-system'

declare global {
    namespace ig {
        namespace ENTITY {
            interface WallBlocker {
                parentWall: ig.ENTITY.WallBase
            }
        }
    }
}

export class HWalls implements HintBase {
    entryName = 'Walls' as const

    constructor() {
        /* run in prestart */
        const self = this
        ig.ENTITY.WallBase.inject({
            updateWallBlockers(...args) {
                for (const wall of this.wallBlockers) {
                    wall.parentWall = this
                }
                return this.parent(...args)
            },
        })
        ig.ENTITY.WallBlocker.inject({
            getQuickMenuSettings(): Omit<sc.QuickMenuTypesBaseSettings, 'entity'> {
                return { type: 'Hints', hintName: self.entryName, hintType: 'Puzzle', disabled: !(Opts.hints && this.parentWall.active) }
            },
        })
    }
    getDataFromEntity(e: ig.Entity): HintData {
        if (!(e instanceof ig.ENTITY.WallBlocker)) throw new Error()

        const lang = { ...Lang.hints.Wall }
        const whatBlocks = `${
            // prettier-ignore
            e.coll.type == ig.COLLTYPE.FENCE
                ? lang.blocksEverything
                : e.coll.type == ig.COLLTYPE.NPFENCE
                ? lang.blocksPlayers
                : e.coll.type == ig.COLLTYPE.PBLOCK
                ? lang.blocksPlayers
                : ''
        }`
        if (e.parentWall.condition && e.parentWall.condition.code != 'true') lang.name = lang.nameConditional
        lang.name = lang.name.supplant({ whatBlocks })
        lang.description = lang.description.supplant({ whatBlocks })
        return lang
    }
}
