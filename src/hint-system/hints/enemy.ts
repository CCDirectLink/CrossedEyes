import { Lang } from '../../lang-manager'
import { Opts } from '../../options'
import { HintBase, HintData } from '../hint-system'

type EnemyConfig = { lang: HintData; condition?: (e: ig.Entity) => boolean; noEmitSound?: boolean; aimBounceWhitelist?: boolean }

export class HEnemy implements HintBase {
    entryName = 'Enemy' as const

    private static config: Record</* enemyName */ string, Record</*state*/ string, EnemyConfig>>
    private static lang: Record</* enemy type */ string, HintData | Record</* state */ string, HintData>>

    private static getLang(e: ig.ENTITY.Enemy): undefined | HintData {
        const conf = this.config[e.enemyName]
        if (!conf) return
        const states = Object.entries(conf)
        if (states.length == 0) return this.lang[e.enemyName] as HintData
        const stateMatch = states.find(o => e.currentState == o[0] && (!o[1].condition || o[1].condition(e)))
        if (!stateMatch) return
        return stateMatch[1].lang
    }

    static check(e: ig.ENTITY.Enemy): boolean {
        return !!this.getLang(e)
    }

    private static getEnemyConfig(e: ig.ENTITY.Enemy): { emitSound: boolean; match?: EnemyConfig } {
        /* this is only considered if HEnemy.check return true */
        const conf = this.config[e.enemyName]!
        if (!conf) return { emitSound: false }
        const states = Object.entries(conf)
        if (states.length == 0) return { emitSound: true }
        const stateMatch = states.find(o => e.currentState == o[0])
        if (!stateMatch) return { emitSound: true }
        const match = stateMatch[1]
        return { emitSound: !!match.noEmitSound, match }
    }

    static shouldEmitSound(e: ig.ENTITY.Enemy): boolean {
        return this.getEnemyConfig(e).emitSound
    }

    static isAimBounceWhitelisted(e: ig.ENTITY.Enemy): boolean {
        const { match } = this.getEnemyConfig(e)
        if (!match) return false
        return !!match.aimBounceWhitelist
    }

    constructor() {
        /* run in prestart */
        /* injection is done in hint-system/enemy-override.ts */
        HEnemy.config = {
            'target-bot': {
                DO_HIT: { lang: Lang.hints.enemies['target-bot'].canShoot, aimBounceWhitelist: true },
                PERMA_HIT: {
                    lang: Lang.hints.enemies['target-bot'].canShoot,
                    condition: e => e.name == 'targetBot1' && (ig.vars.get('tmp.turrentHit') as number) < 10,
                    aimBounceWhitelist: true,
                },
                DO_NOT_HIT: { lang: Lang.hints.enemies['target-bot'].blocker, noEmitSound: true },
            },
            'baggy-kun': {} /* empty means grab the coresponding lang directly */,
        }
        HEnemy.lang = Lang.hints.enemies
    }
    getDataFromEntity(e: ig.Entity): HintData {
        if (!(e instanceof ig.ENTITY.Enemy)) throw new Error()
        return HEnemy.getLang(e)!
    }
}

export class HEnemyCounter implements HintBase {
    entryName = 'EnemyCounter' as const
    disableWalkedOn = true

    constructor() {
        /* run in prestart */
        const self = this
        ig.ENTITY.EnemyCounter.inject({
            getQuickMenuSettings(): Omit<sc.QuickMenuTypesBaseSettings, 'entity'> {
                return { type: 'Hints', hintName: self.entryName, hintType: 'Puzzle', disabled: !(Opts.hints && this.postCount > 0) }
            },
        })
    }
    getDataFromEntity(e: ig.Entity): HintData {
        if (!(e instanceof ig.ENTITY.EnemyCounter)) throw new Error()

        const lang = { ...Lang.hints.EnemyCounter }
        lang.name = lang.name.supplant({ enemiesLeft: e.postCount })
        return lang
    }
}
