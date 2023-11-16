import { MenuOptions } from '../options'
import { PuzzleExtension, PuzzleExtensionData } from './puzzle-analyze'

export class PuzzleExtensionBounceBlock implements PuzzleExtension {
    entryName = 'BounceBlock'

    constructor() { /* run in prestart */
        const self = this
        ig.ENTITY.BounceBlock.inject({
            getQuickMenuSettings(): Omit<sc.QuickMenuTypesBaseSettings, 'entity'> {
                return { type: 'PuzzleElements', puzzleType: self.entryName, disabled: !(MenuOptions.puzzleEnabled && this.blockState != 2) }
            },
            isQuickMenuVisible() { return false },
        })
    }
    getDataFromEntity(e: ig.Entity): PuzzleExtensionData {
        if (!(e instanceof ig.ENTITY.BounceBlock)) { throw new Error() }

        let dirs: [string, string]
        switch (e.coll.shape!) {
            case ig.COLLSHAPE.RECTANGLE: dirs = ['Rectangle', '']; break
            case ig.COLLSHAPE.SLOPE_NE: dirs = ['North', 'East']; break
            case ig.COLLSHAPE.SLOPE_SE: dirs = ['South', 'East']; break
            case ig.COLLSHAPE.SLOPE_SW: dirs = ['South', 'West']; break
            case ig.COLLSHAPE.SLOPE_NW: dirs = ['North', 'West']; break
        }
        const name: string = `Bounce Block ${dirs[0]} ${dirs[1] ?? ''}`
        const description: string =
            `Balls bounce off it.\n${dirs[0] != 'Rectangle' ? `A ball comint from the ${dirs[0]} will bounce to the ${dirs[1]} and the other way around.` : ''}`
        return { name, description }
    }

}
