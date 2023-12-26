import { MenuOptions } from '../../options'
import { Hint, HintData } from '../hint-system'

export class HSwitch implements Hint {
    entryName = 'Switch'

    constructor() { /* run in prestart */
        const self = this
        ig.ENTITY.Switch.inject({
            getQuickMenuSettings(): Omit<sc.QuickMenuTypesBaseSettings, 'entity'> {
                return { type: 'Hints', hintName: self.entryName, hintType: 'Puzzle', disabled: !(MenuOptions.puzzleEnabled) }
            },
        })
    }
    getDataFromEntity(e: ig.Entity): HintData {
        if (!(e instanceof ig.ENTITY.Switch)) { throw new Error() }

        const name: string = `Switch, ${e.isOn ? 'on' : 'off'}`
        const description: string = `Hit with a ball or a melee to toggle.`
        return { name, description }
    }
}

export class HOneTimeSwitch implements Hint {
    entryName = 'OneTimeSwitch'

    constructor() { /* run in prestart */
        const self = this
        ig.ENTITY.OneTimeSwitch.inject({
            getQuickMenuSettings(): Omit<sc.QuickMenuTypesBaseSettings, 'entity'> {
                return { type: 'Hints', hintName: self.entryName, hintType: 'Puzzle', disabled: !(MenuOptions.puzzleEnabled && !this.isOn) }
            },
        })
    }
    getDataFromEntity(e: ig.Entity): HintData {
        if (!(e instanceof ig.ENTITY.OneTimeSwitch)) { throw new Error() }

        const name: string = `One Time Switch`
        const description: string = `Hit with a ball or a melee to activate pernamently.`
        return { name, description }
    }
}

export class HMultiHitSwitch implements Hint {
    entryName = 'MultiHitSwitch'

    constructor() { /* run in prestart */
        const self = this
        ig.ENTITY.MultiHitSwitch.inject({
            getQuickMenuSettings(): Omit<sc.QuickMenuTypesBaseSettings, 'entity'> {
                return { type: 'Hints', hintName: self.entryName, hintType: 'Puzzle', disabled: !(MenuOptions.puzzleEnabled && !this.isOn) }
            },
        })
    }
    getDataFromEntity(e: ig.Entity): HintData {
        if (!(e instanceof ig.ENTITY.MultiHitSwitch)) { throw new Error() }

        const name: string = `Multi Hit Switch`
        const description: string = `Hit with a ball or a melee ${e.hitsToActive} times in rapid succession to activate pernamently.`
        return { name, description }
    }
}
