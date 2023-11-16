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
                        !(MenuOptions.puzzleEnabled && (this.enemyType.path == 'target-bot' && this.currentState == 'DO_HIT'))
                }
            },
            isQuickMenuVisible() { return false },
        })
    }
    getDataFromEntity(e: ig.Entity): PuzzleExtensionData {
        if (!(e instanceof ig.ENTITY.Enemy)) { throw new Error() }

        const name: string = `Target bot`
        const description: string = `Shoot me!`
        return { name, description }
    }

}
