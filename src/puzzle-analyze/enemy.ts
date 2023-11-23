import { MenuOptions } from '../options'
import { PuzzleExtension, PuzzleExtensionData } from './puzzle-analyze'

export class PuzzleExtensionEnemy implements PuzzleExtension {
    entryName = 'Enemy'

    constructor() { /* run in prestart */
        const self = this
        ig.ENTITY.Enemy.inject({
            getQuickMenuSettings(): Omit<sc.QuickMenuTypesBaseSettings, 'entity'> {
                return {
                    type: 'PuzzleElements', puzzleType: self.entryName, disabled:
                        !(MenuOptions.puzzleEnabled && 
                        (this.enemyType.path == 'target-bot' && (this.currentState == 'DO_HIT' || this.currentState == 'DONE' || this.currentState == 'DO_NOT_HIT')))
                }
            },
            isQuickMenuVisible() { return false },
        })
    }
    getDataFromEntity(e: ig.Entity): PuzzleExtensionData {
        if (!(e instanceof ig.ENTITY.Enemy)) { throw new Error() }

        let name: string = ''
        let description: string = ''
        if (e.currentState == 'DO_HIT') {
            name = 'Target Bot, shootable'
            description = 'Shoot me!'
        } else if (e.currentState == 'DONE') {
            name = 'Target Bot, activated'
            description = 'Already activated, no need to shoot'
        } else if (e.currentState == 'DO_NOT_HIT') {
            name = 'Target Bot, blocker'
            description = 'Do not shoot! Will block your balls'
        }
        return { name, description }
    }

}
