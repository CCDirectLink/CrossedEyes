import { MenuOptions } from '../../optionsManager'
import { Hint, HintData } from '../hint-system'

export class HWalls implements Hint {
    entryName = 'Walls'

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
                return { type: 'Hints', hintName: self.entryName, hintType: 'Puzzle', disabled: !(MenuOptions.hints && this.parentWall.active) }
            },
        })
    }
    getDataFromEntity(e: ig.Entity): HintData {
        if (!(e instanceof ig.ENTITY.WallBlocker)) {
            throw new Error()
        }

        const whatBlocks = `${
            e.coll.type == ig.COLLTYPE.FENCE
                ? 'blocks everything'
                : e.coll.type == ig.COLLTYPE.NPFENCE
                  ? 'blocks players'
                  : e.coll.type == ig.COLLTYPE.PBLOCK
                    ? 'blocks projectiles'
                    : ''
        }`
        const name: string = `${e.parentWall.condition && e.parentWall.condition.code != 'true' ? 'Conditional ' : ''}Wall, ${whatBlocks}`
        const description: string = `A wall that can be turned off, ${whatBlocks}`
        return { name, description }
    }
}
