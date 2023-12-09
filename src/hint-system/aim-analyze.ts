import { LoudWalls } from '../environment/loudwalls'
import { MenuOptions } from '../options'
import { TextGather } from '../tts/gather-text'
import { PauseListener } from '../plugin'
import { isAiming } from '../environment/puzzle'
import { HintSystem } from './hint-system'

const crypto: typeof import('crypto') = (0, eval)('require("crypto")')

export class AimAnalyzer implements PauseListener {
    static g: AimAnalyzer

    recalculateEntities: boolean = true
    lastSelected: string | undefined
    aimAnnounceOn: boolean = false

    constructor(public hintSystem: HintSystem) { /* in prestart */
        AimAnalyzer.g = this
        const self = this
        ig.Entity.inject({
            init(x, y, z, settings) {
                this.parent(x, y, z, settings)
                this.uuid = crypto.randomBytes(20).toString('hex')
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
                        self.aimAnnounceOn = !self.aimAnnounceOn
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
            if (isAiming() && ig.game.playerEntity.gui.crosshair?.active) {
                const aim: Vec2 = Vec2.create(ig.game.playerEntity.gui.crosshair._aimDir)
                const check = LoudWalls.checkDirection(aim, 20 * 16, ig.COLLTYPE.BLOCK)

                if (check && check.hitE && check.hitE.length > 0) {
                    if (this.recalculateEntities) {
                        this.recalculateEntities = false
                        setInterval(() => this.recalculateEntities = true, 1000)
                        this.hintSystem.quickMenuAnalysisInstance.populateHintList()
                    } else {
                        this.hintSystem.quickMenuAnalysisInstance.entities.forEach(
                            e => e instanceof sc.QUICK_MENU_TYPES.Hints && e.nameGui.updateData())
                    }
                    for (let i = 0; i < Math.min(5, check.hitE.length); i++) {
                        const collE = check.hitE[i]
                        const e: ig.Entity = collE.entity
                        if (e) {
                            if (e.uuid == this.lastSelected) { return }
                            const hint: sc.QUICK_MENU_TYPES.NPC | sc.QUICK_MENU_TYPES.Hints | undefined =
                                this.hintSystem.quickMenuAnalysisInstance.entities.find(he => he.entity.uuid == e.uuid) as any
                            if (hint) {
                                HintSystem.activeHint(hint)
                                this.lastSelected = e.uuid
                                return
                            }
                        }
                    }
                    if (check.hitE.length == 2 && check.hitE[1].entity.isBall) { return }
                    this.lastSelected = undefined
                    HintSystem.deactivateHint()
                } else {
                    this.lastSelected = undefined
                    HintSystem.deactivateHint()
                }
            } else {
                this.lastSelected = undefined
                HintSystem.deactivateHint()
            }
        }
    }
}
