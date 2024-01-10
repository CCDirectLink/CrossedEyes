import { MenuOptions } from '../../options-manager'
import { Hint, HintData } from '../hint-system'

export class HBounceBlock implements Hint {
    entryName = 'BounceBlock'

    constructor() {
        /* run in prestart */
        const self = this
        ig.ENTITY.BounceBlock.inject({
            getQuickMenuSettings(): Omit<sc.QuickMenuTypesBaseSettings, 'entity'> {
                return { type: 'Hints', hintName: self.entryName, hintType: 'Puzzle', disabled: !(MenuOptions.hints && this.blockState != 2) }
            },
        })
        ig.ENTITY.Blocker.inject({
            getQuickMenuSettings(): Omit<sc.QuickMenuTypesBaseSettings, 'entity'> {
                return { type: 'Hints', hintName: self.entryName, hintType: 'Puzzle', disabled: !(MenuOptions.hints && this.active) }
            },
        })
    }
    getDataFromEntity(e: ig.Entity): HintData {
        if (!(e instanceof ig.ENTITY.BounceBlock || e instanceof ig.ENTITY.Blocker)) {
            throw new Error()
        }

        let dirs: [string, string]
        switch (e.coll.shape!) {
            case ig.COLLSHAPE.RECTANGLE:
                dirs = ['Rectangle', '']
                break
            case ig.COLLSHAPE.SLOPE_NE:
                dirs = ['North', 'East']
                break
            case ig.COLLSHAPE.SLOPE_SE:
                dirs = ['South', 'East']
                break
            case ig.COLLSHAPE.SLOPE_SW:
                dirs = ['South', 'West']
                break
            case ig.COLLSHAPE.SLOPE_NW:
                dirs = ['North', 'West']
                break
        }
        const name: string = `Bounce Block ${dirs[0]} ${dirs[1] ?? ''}`
        const description: string = `Balls bounce off it.\n${
            dirs[0] != 'Rectangle' ? `A ball comint from the ${dirs[0]} will bounce to the ${dirs[1]} and the other way around.` : ''
        }`
        return { name, description }
    }
}

export class HBounceSwitch implements Hint {
    entryName = 'BounceSwitch'

    constructor() {
        /* run in prestart */
        const self = this
        ig.ENTITY.BounceSwitch.inject({
            getQuickMenuSettings(): Omit<sc.QuickMenuTypesBaseSettings, 'entity'> {
                return { type: 'Hints', hintName: self.entryName, hintType: 'Puzzle', disabled: !(MenuOptions.hints && !this.isOn) }
            },
        })
    }
    getDataFromEntity(e: ig.Entity): HintData {
        if (!(e instanceof ig.ENTITY.BounceSwitch)) {
            throw new Error()
        }

        const name: string = `Bounce Switch`
        const description: string = 'A final destination for a ball that bounced from a Bounce Block'
        return { name, description }
    }
}
