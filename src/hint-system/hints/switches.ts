import { Lang } from '../../lang-manager'
import { Opts } from '../../plugin'
import { HintBase, HintData } from '../hint-system'

export class HSwitch implements HintBase {
    entryName = 'Switch' as const

    constructor() {
        /* run in prestart */
        const self = this
        ig.ENTITY.Switch.inject({
            getQuickMenuSettings(): Omit<sc.QuickMenuTypesBaseSettings, 'entity'> {
                return { type: 'Hints', hintName: self.entryName, hintType: 'Puzzle', disabled: !Opts.hints, aimBounceWhitelist: true }
            },
        })
    }
    getDataFromEntity(e: ig.Entity): HintData {
        if (!(e instanceof ig.ENTITY.Switch)) throw new Error()

        const lang = Lang.hints.Switch
        if (!e.isOn) lang.name = lang.nameOff
        return lang
    }
}

export class HOneTimeSwitch implements HintBase {
    entryName = 'OneTimeSwitch' as const

    constructor() {
        /* run in prestart */
        const self = this
        ig.ENTITY.OneTimeSwitch.inject({
            getQuickMenuSettings(): Omit<sc.QuickMenuTypesBaseSettings, 'entity'> {
                return { type: 'Hints', hintName: self.entryName, hintType: 'Puzzle', disabled: !(Opts.hints && !this.isOn), aimBounceWhitelist: true }
            },
        })
    }
    getDataFromEntity(e: ig.Entity): HintData {
        if (!(e instanceof ig.ENTITY.OneTimeSwitch)) throw new Error()
        return Lang.hints.OneTimeSwitch
    }
}

export class HMultiHitSwitch implements HintBase {
    entryName = 'MultiHitSwitch' as const

    constructor() {
        /* run in prestart */
        const self = this
        ig.ENTITY.MultiHitSwitch.inject({
            getQuickMenuSettings(): Omit<sc.QuickMenuTypesBaseSettings, 'entity'> {
                return { type: 'Hints', hintName: self.entryName, hintType: 'Puzzle', disabled: !(Opts.hints && !this.isOn) }
            },
        })
    }
    getDataFromEntity(e: ig.Entity): HintData {
        if (!(e instanceof ig.ENTITY.MultiHitSwitch)) throw new Error()
        const lang = { ...Lang.hints.MultiHitSwitch }
        lang.description = lang.description.supplant({ hitsToActive: e.hitsToActive })
        return lang
    }
}
