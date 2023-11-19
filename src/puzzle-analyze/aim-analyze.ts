import { LoudWalls } from '../loudwalls'
import { PuzzleElementsAnalysis } from './puzzle-analyze'

export class AimAnalyzer {
    recalculateEntities: boolean = true

    constructor(public puzzleElementsAnalysis: PuzzleElementsAnalysis) { /* in prestart */
        const self = this
        ig.ENTITY.Player.inject({
            update() {
                this.parent()
                self.handle()
            },
        })
        ig.Game.inject({
            preloadLevel(mapName) {
                this.parent(mapName)
                self.recalculateEntities = true
            },
        })
    }

    handle() {
        if (ig.game.playerEntityCrosshairInstance?.active) {
            const aim: Vec2 = Vec2.create(ig.game.playerEntityCrosshairInstance._aimDir) /* set by cc-blitzkrieg */
            const check = LoudWalls.checkDirection(aim, 20 * 16)
            console.log(check.distance.round(0))
            if (check && check.hitE && check.hitE.length > 0) {
                const collE = check.hitE[0]
                const e: ig.Entity = collE.entity
                if (e) {
                    if (this.recalculateEntities && this.puzzleElementsAnalysis.quickMenuAnalysisInstance.entities.length == 0 ) {
                        this.recalculateEntities = false
                        this.puzzleElementsAnalysis.quickMenuAnalysisInstance.show()
                        this.puzzleElementsAnalysis.quickMenuAnalysisInstance.hide()
                        this.puzzleElementsAnalysis.quickMenuAnalysisInstance.exit()
                    }
                    const hint: sc.QuickMenuTypesBase | undefined =
                        this.puzzleElementsAnalysis.quickMenuAnalysisInstance.entities.find(he => he.entity == e)
                    if (hint && hint instanceof sc.QUICK_MENU_TYPES.PuzzleElements) {
                        console.log(hint.nameGui.title.text)
                    }
                }
            }
        }
    }
}
