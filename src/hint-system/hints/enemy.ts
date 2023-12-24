import { Hint, HintData } from '../hint-system'

export class HEnemy implements Hint {
    entryName = 'Enemy'
    static check(e: ig.ENTITY.Enemy) {
        return (e.enemyName == 'target-bot' && (e.currentState == 'DO_HIT' || e.currentState == 'DO_NOT_HIT')) ||
            e.enemyName == 'baggy-kun'
    }

    constructor() { /* run in prestart */ }
    getDataFromEntity(e: ig.Entity): HintData {
        if (!(e instanceof ig.ENTITY.Enemy)) { throw new Error() }

        let name: string = ``
        let description: string = ''
        if (e.enemyName == 'target-bot') {
            if (e.currentState == 'DO_HIT') {
                name = 'Target Bot, shootable'
                description = 'Shoot me!'
            } else if (e.currentState == 'DO_NOT_HIT') {
                name = 'Target Bot, blocker'
                description = 'Do not shoot! Will block your balls'
            }
        } else if (e.enemyName == 'baggy-kun') {
            name = 'Training bag'
            description = 'Hit as you will! Cannot be moved and won\'t fight you back.'
        }
        return { name, description }
    }

}
