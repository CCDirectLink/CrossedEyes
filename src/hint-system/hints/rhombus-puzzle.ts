import { Lang } from '../../lang-manager'
import { Opts } from '../../options-manager'
import { Hint, HintData } from '../hint-system'

export class HOLPlatform implements Hint {
    entryName = 'OLPlatform'

    constructor() {
        /* run in prestart */
        const self = this
        ig.ENTITY.OLPlatform.inject({
            getQuickMenuSettings(): Omit<sc.QuickMenuTypesBaseSettings, 'entity'> {
                return {
                    type: 'Hints',
                    hintName: self.entryName,
                    hintType: 'Puzzle',
                    disabled: !Opts.hints || ig.game.mapName == 'rhombus-dng.room-1-6' || ig.game.mapName == 'rhombus-dng.room-5-newer',
                }
            },
        })
    }
    getDataFromEntity(e: ig.Entity): HintData {
        if (!(e instanceof ig.ENTITY.OLPlatform)) throw new Error()
        return Lang.hints.OLPlatform
    }
}

export class HDynamicPlatform implements Hint {
    entryName = 'DynamicPlatform'

    constructor() {
        /* run in prestart */
        const self = this
        ig.ENTITY.DynamicPlatform.inject({
            getQuickMenuSettings(): Omit<sc.QuickMenuTypesBaseSettings, 'entity'> {
                return {
                    type: 'Hints',
                    hintName: self.entryName,
                    hintType: 'Puzzle',
                    disabled: !Opts.hints,
                }
            },
        })
    }
    getDataFromEntity(e: ig.Entity): HintData {
        if (!(e instanceof ig.ENTITY.DynamicPlatform)) throw new Error()
        const lang = { ...Lang.hints.DynamicPlatform }
        if (e.paused) lang.name = lang.namePaused
        return lang
    }
}
