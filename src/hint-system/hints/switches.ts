import { Lang } from '../../lang-manager'
import { Opts } from '../../plugin'
import { Hint, HintData } from '../hint-system'

export class HSwitch implements Hint {
    entryName = 'Switch'

    constructor() {
        /* run in prestart */
        const self = this
        ig.ENTITY.Switch.inject({
            getQuickMenuSettings(): Omit<sc.QuickMenuTypesBaseSettings, 'entity'> {
                return { type: 'Hints', hintName: self.entryName, hintType: 'Puzzle', disabled: !Opts.hints }
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

export class HOneTimeSwitch implements Hint {
    entryName = 'OneTimeSwitch'

    constructor() {
        /* run in prestart */
        const self = this
        ig.ENTITY.OneTimeSwitch.inject({
            getQuickMenuSettings(): Omit<sc.QuickMenuTypesBaseSettings, 'entity'> {
                return { type: 'Hints', hintName: self.entryName, hintType: 'Puzzle', disabled: !(Opts.hints && !this.isOn) }
            },
        })
    }
    getDataFromEntity(e: ig.Entity): HintData {
        if (!(e instanceof ig.ENTITY.OneTimeSwitch)) throw new Error()
        return Lang.hints.OneTimeSwitch
    }
}

export class HMultiHitSwitch implements Hint {
    entryName = 'MultiHitSwitch'

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
