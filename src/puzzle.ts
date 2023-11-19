import type * as _ from 'cc-blitzkrieg'
import { MenuOptions } from './options'
import { mapNumber } from './spacial-audio'
import type { PuzzleSelection, PuzzleSelectionStep } from 'cc-blitzkrieg/types/puzzle-selection'
import { PuzzleSounds } from './sound-manager'

export function isAiming(): boolean {
    return ig.input.state('aim') || ig.gamepad.isRightStickDown()
}

class AimHandler {
    constructor(public pb: PuzzleBeeper) {}

    farAwayFreq: number = 1300
    maxFreq: number = 0

    lastBeepTime: number = 0
    shootSoundPlayed: boolean = false

    minDegDistToSpeedup: number = 110
    lockInDegDist: number = 10

    lockedIn: boolean = false
    normalBeepSlience: boolean = false
    shotCount: number = 0

    newAim!: Vec2

    initPrestart() {
        const self = this
        ig.ENTITY.Crosshair.inject({
            deferredUpdate(): void {
                this.parent()
                if (self.lockedIn) {
                    Vec2.assign(ig.game.playerEntityCrosshairInstance._aimDir, self.newAim)
                }
            }
        })
    }

    handleAim(step: PuzzleSelectionStep) {
        if (!this.pb.moveToHandler.lockedIn || !this.pb.moveToHandler.passToAim) { this.lockedIn = false; return }
        if (!ig.game || !ig.game.playerEntity || !MenuOptions.puzzleEnabled) { return }

        const now: number = ig.game.now /* set by cc-blitzkrieg */

        if (this.lockedIn) {
            if (sc.control.thrown()) {
                if (this.shotCount) {
                    this.shotCount--
                }
                if (! this.shotCount) {
                    this.lockedIn = false
                    this.pb.moveToHandler.lockedIn = false
                    this.pb.stepI++
                    if (this.pb.stepI == 1) {
                        this.pb.puzzleStartTime = now
                    }
                    return
                }
            }
            if (this.shotCount) { return }
            const wait = 200
            if (! this.shootSoundPlayed) {
                const lastStep = this.pb.currentSel.data.recordLog!.steps[this.pb.stepI - 1]
                let play: boolean = false
                if (lastStep && !lastStep.split) {
                    const realDiffTime = Math.round((now - this.pb.puzzleStartTime) * sc.options.get('assist-puzzle-speed'))
                    const diff = realDiffTime - step.endFrame
                    // console.log(diff, step.endFrame, realDiffTime)
                    if (diff > -wait) {
                        play = true
                    }
                } else { play = true }

                if (!this.shootSoundPlayed && play) {
                    this.shootSoundPlayed = true
                    this.shotCount = PuzzleSounds.shootNow(wait, () => this.lockedIn, step.shotCount)
                }
            }
        } else {
            this.shootSoundPlayed = false
        }

        if (this.shotCount || ! step || ! step.pos) { return }
        const targetDeg = (step.shootAngle! + 360) % 360
        if (! targetDeg) { return }

        const r: number = 4*16
        const theta: number = targetDeg * (Math.PI / 180)
        
        this.newAim = Vec2.createC(r * Math.cos(theta), r * Math.sin(theta))

        if (! isAiming()) {
            this.lockedIn = false
            return
        }
        if (!ig.game || !ig.game.playerEntity ||  !MenuOptions.puzzleEnabled) { return }
        const deg = (ig.game.playerEntity.aimDegrees + 360) % 360 /* set by cc-blitzkrieg */
        if (! deg) { return }

        const dist: number = Math.min(
            Math.abs(deg - targetDeg),
            360 - Math.abs(deg - targetDeg)
        ) /* distance between target and current aim */

        if (dist <= this.lockInDegDist) {
            if (! this.lockedIn) {
                this.lockedIn = true
                this.normalBeepSlience = true
                PuzzleSounds.aimLockin(this.newAim, step.element, () => {
                    this.normalBeepSlience = false
                    this.lastBeepTime = ig.game.now
                })
            }
        } else if (this.lockedIn) {
            this.lockedIn = false
            this.normalBeepSlience = true

            PuzzleSounds.aimLockout(this.newAim, () => {
                this.normalBeepSlience = false
                this.lastBeepTime = ig.game.now
            })
            return
        }
        if (this.lockedIn || this.normalBeepSlience) { return }

        const timeDiff = now - this.lastBeepTime
        const time: number = dist >= this.minDegDistToSpeedup ? this.farAwayFreq : 
            Math.max(
            mapNumber(deg, targetDeg - this.minDegDistToSpeedup, targetDeg, this.farAwayFreq, this.maxFreq),
            mapNumber(deg, targetDeg + this.minDegDistToSpeedup, targetDeg, this.farAwayFreq, this.maxFreq))

        if (timeDiff >= time) {
            PuzzleSounds.aimGuide(1, this.newAim)
            this.lastBeepTime = now
        }
    }
}

class MoveToHandler {
    constructor(public pb: PuzzleBeeper) {}

    farAwayFreq: number = 1000
    maxFreq: number = 0

    lastBeepTime: number = 0
    normalBeepSlience: boolean = false

    minDistToSpeedup: number = 8 * 16 
    lockinDist: number = 2 * 16
    relockDist: number = 0.5 * 16

    lockedIn: boolean = false
    softLockout: boolean = false
    allowRelock: boolean = false
    passToAim: boolean = false
    
    handleMoveTo(step: PuzzleSelectionStep) {
        const pos: Vec3 & { level: number } = step.pos
        
        const playerPos: Vec3 = Vec3.create(ig.game.playerEntity.coll.pos)
        const dist: number = Vec3.distance(pos, playerPos)

        const now: number = ig.game.now /* set by cc-blitzkrieg */
        if (this.lockedIn) {
            if (step.shootAngle === undefined) {
                const lastStep = this.pb.currentSel.data.recordLog!.steps[this.pb.stepI - 1]
                if (lastStep) {
                    const realDiffTime = Math.round((now - this.pb.puzzleStartTime) * sc.options.get('assist-puzzle-speed'))
                    const diff = realDiffTime - step.endFrame
                    if (diff > 0) {
                        this.lockedIn = false
                        this.passToAim = false
                        this.softLockout = false
                        this.pb.stepI++
                        if (this.pb.stepI == 1) {
                            this.pb.puzzleStartTime = now
                        }
                        PuzzleSounds.moveWaitFinished()
                        return
                    }
                }

            }
        }

        let lockout: boolean = false
        if (dist <= this.lockinDist && pos.z == playerPos.z) {
            Vec3.add(playerPos, ig.game.playerEntity.coll.vel)
            const distWithVel: number = Vec3.distance(pos, playerPos)
            if (! this.softLockout || distWithVel <= this.relockDist) {
                if (! this.lockedIn) {
                    this.lockedIn = true
                    this.softLockout = false
                    
                    ig.game.playerEntity.setPos(pos.x, pos.y, pos.z)
                    ig.game.playerEntity.coll.vel = Vec3.create()
                    sc.model.player.setCore(sc.PLAYER_CORE.MOVE, false)
                    setTimeout(() => sc.model.player.setCore(sc.PLAYER_CORE.MOVE, true), 700)

                    this.normalBeepSlience = true
                    PuzzleSounds.moveLockin(pos, () => {
                        this.normalBeepSlience = false
                        this.lastBeepTime = ig.game.now
                    })

                    if (step.shootAngle) {
                        this.passToAim = true

                    }
                    return
                } else if (dist !== 0) {
                    lockout = true
                    this.softLockout = true
                }
            }
        } else {
            if (this.lockedIn) {
                lockout = true
            }
            this.softLockout = false
        }
        if (lockout) {
            this.lockedIn = false
            this.passToAim = false
            this.normalBeepSlience = true

            PuzzleSounds.moveLockout(pos, () => {
                this.normalBeepSlience = false
                this.lastBeepTime = ig.game.now
            })
            return
        }

        if (this.lockedIn || this.normalBeepSlience) { return }

        const timeDiff = now - this.lastBeepTime
        const time: number = dist >= this.minDistToSpeedup ? this.farAwayFreq : 
            mapNumber(dist, this.minDistToSpeedup, 0, this.farAwayFreq, this.maxFreq)

        if (timeDiff >= time) {
            const speed: number = 1
            PuzzleSounds.moveGuide(speed, pos)
            this.lastBeepTime = now
        }
    }
}

export class PuzzleBeeper {
    aimHandler: AimHandler = new AimHandler(this)
    moveToHandler: MoveToHandler = new MoveToHandler(this)

    puzzleStartTime!: number
    stepI: number = 0
    currentSel!: PuzzleSelection
    cachedSolution!: [keyof ig.KnownVars, any]
    finishCondition: string = ''

    constructor() { /* in prestart */
        blitzkrieg.sels.puzzle.loadAll()

        this.aimHandler.initPrestart()
        
        const self = this
        ig.ENTITY.Player.inject({
            update() {
                this.parent()

                const a = true; if (a) { return }
                if (!ig.game || !ig.game.playerEntity || !MenuOptions.puzzleEnabled || sc.message.blocking) { return }

                const sel: PuzzleSelection = blitzkrieg.sels.puzzle.inSelStack.peek()
                if (!sel || !sel.data.recordLog || sel.data.recordLog.steps.length == 0) { return }
                if (self.currentSel !== sel) {
                    self.currentSel = sel
                    self.stepI = 0
                    if (self.currentSel.data.completionType === blitzkrieg.PuzzleCompletionType.Normal) {
                        self.cachedSolution = (blitzkrieg.PuzzleSelectionManager.getPuzzleSolveCondition(sel) ?? '.') as [keyof ig.KnownVars, any]
                    }
                }
                switch (self.currentSel.data.completionType) {
                    case blitzkrieg.PuzzleCompletionType.Normal: {
                        if (ig.vars.get(self.cachedSolution![0].substring(1)) == self.cachedSolution[1]) {
                            if (self.stepI > 0) {
                                self.stepI = 0
                                PuzzleSounds.puzzleSolved()
                            }
                            return
                        }
                        break
                    }
                    case blitzkrieg.PuzzleCompletionType.GetTo:
                        break
                    case blitzkrieg.PuzzleCompletionType.Item:
                        break

                }
                const step = sel.data.recordLog.steps[self.stepI]
                if (!step || !step.pos) { return }
                self.moveToHandler.handleMoveTo(step)
                self.aimHandler.handleAim(step)
            },
            varsChanged() {
                this.parent!()
                if (MenuOptions.puzzleEnabled && this.floating && ig.vars.get("playerVar.staticFloat")) {
                    this.configs.normal.clearOverwrite()
                    this.configs.aiming.clearOverwrite()
                }
            },
        })
    }
}
