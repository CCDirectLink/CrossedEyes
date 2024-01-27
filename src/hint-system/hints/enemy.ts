import { Opts } from '../../options-manager'
import { Hint, HintData } from '../hint-system'

export class HEnemy implements Hint {
    entryName = 'Enemy'
    static check(e: ig.ENTITY.Enemy): boolean {
        return (
            (e.enemyName == 'target-bot' &&
                (e.currentState == 'DO_HIT' ||
                    (e.currentState == 'PERMA_HIT' && e.name == 'targetBot1' && (ig.vars.get('tmp.turrentHit') as number) < 10) ||
                    e.currentState == 'DO_NOT_HIT')) ||
            e.enemyName == 'baggy-kun'
        )
    }
    static shouldEmitSound(e: ig.ENTITY.Enemy): boolean {
        /* this is only considered if HEnemy.check return true */
        return !(e.enemyName == 'target-bot' && e.currentState == 'DO_NOT_HIT')
    }

    constructor() {
        /* run in prestart */
        /* injection is done in hint-system/enemy-override.ts */
    }
    getDataFromEntity(e: ig.Entity): HintData {
        if (!(e instanceof ig.ENTITY.Enemy)) {
            throw new Error()
        }

        let name: string = ``
        let description: string = ''
        if (e.enemyName == 'target-bot') {
            if (e.currentState == 'DO_HIT' || e.currentState == 'PERMA_HIT') {
                name = 'Target Bot, shootable'
                description = 'Shoot me!'
            } else if (e.currentState == 'DO_NOT_HIT') {
                name = 'Target Bot, blocker'
                description = 'Do not shoot! Will block your balls'
            }
        } else if (e.enemyName == 'baggy-kun') {
            name = 'Training bag'
            description = "Hit as you will! Cannot be moved and won't fight you back."
            e.ballDestroyer = true
        }
        return { name, description }
    }
}

export class HEnemyCounter implements Hint {
    entryName = 'EnemyCounter'

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
        if (!(e instanceof ig.ENTITY.EnemyCounter)) {
            throw new Error()
        }

        let name: string = `Enemy Counter, enemies left: ${e.postCount}`
        let description: string = 'Counts enemies left. Triggers something after reaching zero.'
        return { name, description }
    }
}
