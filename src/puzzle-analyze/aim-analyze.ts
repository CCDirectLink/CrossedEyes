import type { UUID } from 'crypto'
import { LoudWalls } from '../loudwalls'
import { PuzzleElementsAnalysis } from './puzzle-analyze'
import { MenuOptions } from '../options'
import { TextGather } from '../tts/gather-text'
import { PauseListener } from '../plugin'
import { isAiming } from '../puzzle'

export class AimAnalyzer implements PauseListener {
    static g: AimAnalyzer

    recalculateEntities: boolean = true
    lastSelected: UUID | undefined
    aimAnnounceOn: boolean = false


    constructor(public puzzleElementsAnalysis: PuzzleElementsAnalysis) { /* in prestart */
        AimAnalyzer.g = this
        const self = this
        ig.Entity.inject({
            init(x, y, z, settings) {
                this.parent(x, y, z, settings)
                this.uuid = crypto.randomUUID()
            },

        })
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
        sc.QuickMenuAnalysis.inject({
            update() {
                this.parent()
                if (sc.quickmodel.currentState == sc.QUICK_MENU_STATE.CHECK && MenuOptions.ttsEnabled && MenuOptions.puzzleEnabled) {
                    if (ig.gamepad.isButtonPressed(ig.BUTTONS.FACE3 /* y */)) {
                        self.aimAnnounceOn = ! self.aimAnnounceOn
                        TextGather.g.speak(`Aim analysis ${self.aimAnnounceOn ? 'on' : 'off'}`)
                    }
                }
            },
        })
    }

    pause(): void {
        this.lastSelected = undefined
    }

    handle() {
        if (this.aimAnnounceOn) {
            if (isAiming() && ig.game.playerEntityCrosshairInstance?.active) {
                const aim: Vec2 = Vec2.create(ig.game.playerEntityCrosshairInstance._aimDir) /* set by cc-blitzkrieg */
                const check = LoudWalls.checkDirection(aim, 20 * 16, ig.COLLTYPE.PROJECTILE)

                if (check && check.hitE && check.hitE.length > 0) {
                    if (this.recalculateEntities) {
                         this.recalculateEntities = false
                        setInterval(() => this.recalculateEntities = true, 1000)
                        TextGather.g.ignoreInterrupt = true
                        this.puzzleElementsAnalysis.quickMenuAnalysisInstance.show()
                        this.puzzleElementsAnalysis.quickMenuAnalysisInstance.hide()
                        this.puzzleElementsAnalysis.quickMenuAnalysisInstance.exit()
                        TextGather.g.ignoreInterrupt = false
                    } else {
                        this.puzzleElementsAnalysis.quickMenuAnalysisInstance.entities.forEach(
                            e => e instanceof sc.QUICK_MENU_TYPES.PuzzleElements && e.nameGui.updateData())
                    }
                    for (let i = 0; i < Math.min(5, check.hitE.length); i++) {
                        const collE = check.hitE[i]
                        const e: ig.Entity = collE.entity
                        if (e) {
                            if (e.uuid == this.lastSelected) { return }
                            const hint: sc.QuickMenuTypesBase | undefined =
                                this.puzzleElementsAnalysis.quickMenuAnalysisInstance.entities.find(he => he.entity.uuid == e.uuid)
                            if (hint && hint instanceof sc.QUICK_MENU_TYPES.PuzzleElements) {
                                PuzzleElementsAnalysis.activeHint(hint)
                                this.lastSelected = e.uuid
                                return
                            }
                        }
                    }
                    this.lastSelected = undefined
                    PuzzleElementsAnalysis.deactivateHint()
                }
            } else {
                    this.lastSelected = undefined
                PuzzleElementsAnalysis.deactivateHint()
            }
        }
    }
}
