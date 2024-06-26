import { Lang } from '../../lang-manager'
import { Opts } from '../../options'
import { HintBase, HintData } from '../hint-system'

export class HBounceBlock implements HintBase {
    entryName = 'BounceBlock' as const

    constructor() {
        /* run in prestart */
        const self = this
        ig.ENTITY.BounceBlock.inject({
            getQuickMenuSettings(): Omit<sc.QuickMenuTypesBaseSettings, 'entity'> {
                return { type: 'Hints', hintName: self.entryName, hintType: 'Puzzle', disabled: !(Opts.hints && this.blockState != 2), aimBounceWhitelist: true }
            },
        })
        ig.ENTITY.Blocker.inject({
            getQuickMenuSettings(): Omit<sc.QuickMenuTypesBaseSettings, 'entity'> {
                return { type: 'Hints', hintName: self.entryName, hintType: 'Puzzle', disabled: !(Opts.hints && this.active), aimBounceWhitelist: true }
            },
        })
    }
    getDataFromEntity(e: ig.Entity): HintData {
        if (!(e instanceof ig.ENTITY.BounceBlock || e instanceof ig.ENTITY.Blocker)) throw new Error()

        let dirs: [string, string]
        const l = Lang.misc.face8
        switch (e.coll.shape!) {
            case ig.COLLSHAPE.RECTANGLE:
                dirs = [Lang.misc.rectangle, '']
                break
            case ig.COLLSHAPE.SLOPE_NE:
                dirs = [l.NORTH, l.EAST]
                break
            case ig.COLLSHAPE.SLOPE_SE:
                dirs = [l.SOUTH, l.EAST]
                break
            case ig.COLLSHAPE.SLOPE_SW:
                dirs = [l.SOUTH, l.WEST]
                break
            case ig.COLLSHAPE.SLOPE_NW:
                dirs = [l.NORTH, l.WEST]
                break
        }
        const lang = { ...Lang.hints.BounceBlock }
        lang.name = lang.name.supplant({ dir1: dirs[0], dir2: dirs[1] })
        // prettier-ignore
        lang.description = 
            dirs[0] == 'Rectangle'
            ? lang.descriptionRectangle 
            : (lang.description = lang.description.supplant({ dir1: dirs[0], dir2: dirs[1] }))
        return lang
    }
}

export class HBounceSwitch implements HintBase {
    entryName = 'BounceSwitch' as const

    constructor() {
        /* run in prestart */
        const self = this
        ig.ENTITY.BounceSwitch.inject({
            getQuickMenuSettings(): Omit<sc.QuickMenuTypesBaseSettings, 'entity'> {
                return { type: 'Hints', hintName: self.entryName, hintType: 'Puzzle', disabled: !(Opts.hints && !this.isOn), aimBounceWhitelist: true }
            },
        })
    }
    getDataFromEntity(e: ig.Entity): HintData {
        if (!(e instanceof ig.ENTITY.BounceSwitch)) throw new Error()
        return Lang.hints.BounceSwitch
    }
}
