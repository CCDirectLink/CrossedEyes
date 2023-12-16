import { LoudWalls } from '../environment/loudwalls'
import { MenuOptions } from '../options'
import { TextGather } from '../tts/gather-text'
import CrossedEyes, { PauseListener } from '../plugin'
import { isAiming } from '../environment/puzzle'
import { HintSystem } from './hint-system'

const crypto: typeof import('crypto') = (0, eval)('require("crypto")')

export class AimAnalyzer implements PauseListener {
    static g: AimAnalyzer

    lastSelected: string | undefined
    aimAnnounceOn: boolean = false

    constructor() { /* in prestart */
        AimAnalyzer.g = this
        CrossedEyes.pauseables.push(this)
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
        sc.QuickMenuAnalysis.inject({
            update() {
                this.parent()
                if (sc.quickmodel.isQuickCheck() && MenuOptions.puzzleEnabled && ig.gamepad.isButtonPressed(ig.BUTTONS.FACE3 /* y */)) {
                    self.aimAnnounceOn = !self.aimAnnounceOn
                    MenuOptions.ttsEnabled && TextGather.g.speakI(`Aim analysis ${self.aimAnnounceOn ? 'on' : 'off'}`)
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
                    for (let i = 0; i < Math.min(5, check.hitE.length); i++) {
                        const collE = check.hitE[i]
                        const e: ig.Entity = collE.entity
                        if (e) {
                            if (e.uuid == this.lastSelected) { return }
                            const hint: sc.QUICK_MENU_TYPES.NPC | sc.QUICK_MENU_TYPES.Hints | undefined =
                                HintSystem.g.quickMenuAnalysisInstance.createHint(e, false) as any
                            if (hint) {
                                HintSystem.g.activateHint(0, hint)
                                this.lastSelected = e.uuid
                                return
                            }
                        }
                    }
                    if (check.hitE.length == 2 && check.hitE[1].entity.isBall) { return }
                    this.lastSelected = undefined
                    HintSystem.g.deactivateHint(0)
                } else {
                    this.lastSelected = undefined
                    HintSystem.g.deactivateHint(0)
                }
            } else {
                this.lastSelected = undefined
                HintSystem.g.deactivateHint(0)
            }
        }
    }
}
