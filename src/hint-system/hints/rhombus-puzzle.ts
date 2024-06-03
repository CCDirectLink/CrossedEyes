import { Lang } from '../../lang-manager'
import { Opts } from '../../options'
import { HintBase, HintData } from '../hint-system'

declare global {
    namespace ig {
        namespace ENTITY {
            interface BallChanger {
                settings: ig.ENTITY.BallChanger.Settings
            }
        }
    }
}

export class HOLPlatform implements HintBase {
    entryName = 'OLPlatform' as const

    constructor() {
        /* run in prestart */
        const self = this
        ig.ENTITY.OLPlatform?.inject({
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

export class HDynamicPlatform implements HintBase {
    entryName = 'DynamicPlatform' as const

    constructor() {
        /* run in prestart */
        const self = this
        ig.ENTITY.DynamicPlatform?.inject({
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

export class HBallChanger implements HintBase {
    entryName = 'BallChanger' as const

    typeToLangMap: Record<keyof typeof sc.BALL_CHANGER_TYPE, keyof typeof Lang.hints.BallChanger> = {
        CHANGE_DIR: 'dir',
        CHANGE_ELEMENT: 'element',
        RESET_SPEED: 'resetSpeed',
        CHANGE_SPEED: 'speed',
    } as const

    constructor() {
        /* run in prestart */
        const self = this
        ig.ENTITY.BallChanger?.inject({
            init(x, y, z, settings) {
                this.parent(x, y, z, settings)
                this.settings = settings
            },
            getQuickMenuSettings(): Omit<sc.QuickMenuTypesBaseSettings, 'entity'> {
                return {
                    type: 'Hints',
                    hintName: self.entryName,
                    hintType: 'Puzzle',
                    disabled: !Opts.hints,
                    aimBounceWhitelist: true,
                }
            },
        })
    }
    getDataFromEntity(e: ig.Entity): HintData {
        if (!(e instanceof ig.ENTITY.BallChanger)) throw new Error()
        const ctype = e.settings.changerType
        const lang = { ...Lang.hints.BallChanger[this.typeToLangMap[ctype.type]] }

        if (ctype.type == 'CHANGE_DIR') {
            const dir = Lang.misc.face8[ctype.settings.dir]
            lang.name = lang.name.supplant({ dir })
            lang.description = lang.description.supplant({ dir })
        } else if (ctype.type == 'CHANGE_ELEMENT') {
            const element = Lang.stats[ctype.settings.element.toLowerCaseT()]
            lang.name = lang.name.supplant({ element })
            lang.description = lang.description.supplant({ element })
        }
        return lang
    }
}
