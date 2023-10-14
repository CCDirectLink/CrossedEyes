import type * as _ from 'cc-blitzkrieg'
import { MenuOptions } from './options'
import { mapNumber } from './spacial-audio'
import { PuzzleSelection, PuzzleSelectionStep } from 'cc-blitzkrieg/types/puzzle-selection'
import { SoundManager } from './sound-manager'

class AimHandler {
    constructor(public pb: PuzzleBeeper) {}

    farAwayFreq: number = 1300
    maxFreq: number = 0

    lastBeepTime: number = 0

    minDegDistToSpeedup: number = 110
    lockInDegDist: number = 10

    lockedIn: boolean = false
    normalBeepSlience: boolean = false

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
        ig.ENTITY.Player.inject({
            update() {
                this.parent()
                if (self.lockedIn && sc.control.thrown()) {
                    self.lockedIn = false
                    self.pb.stepI++
                }
            }
        })
    }

    handleAim(step: PuzzleSelectionStep) {
        if (!ig.game || !ig.game.playerEntity || !this.pb.moveToHandler.lockedIn || !MenuOptions.puzzleEnabled) { return }

        if (! step || ! step.pos) { return }
        const targetDeg = step.shootAngle
        if (! targetDeg) { return }

        const r: number = 15
        const theta: number = targetDeg * (Math.PI / 180)
        
        this.newAim = Vec2.createC(
            r * Math.cos(theta),
            r * Math.sin(theta),
        )


        const aiming: boolean = ig.input.state('aim') || ig.gamepad.isRightStickDown()
        if (! aiming) {
            this.lockedIn = false
            return
        }
        if (!ig.game || !ig.game.playerEntity ||  !MenuOptions.puzzleEnabled) { return }
        const deg = ig.game.playerEntity.aimDegrees /* set by cc-blitzkrieg */
        if (! deg) { return }

        const dist: number = /* distance between target and current aim */
            Math.min(Math.abs(deg - targetDeg),
            Math.abs(360 - deg - targetDeg))

        if (dist <= this.lockInDegDist) {
            if (! this.lockedIn) {
                this.lockedIn = true
                this.normalBeepSlience = true
                SoundManager.playSoundQueue([
                    { name: 'countdown1', relativePos: true, pos: this.newAim, wait: 200 },
                    { name: 'countdown2', relativePos: true, pos: this.newAim, wait: 100 },
                    { name: SoundManager.getElementName(step.element), speed: 1.2,
                        condition: () => step.element !== sc.model.player.currentElementMode,
                        action: () => {
                            this.normalBeepSlience = false
                            this.lastBeepTime = Date.now()
                        },
                    },
                ])
            }
        } else if (this.lockedIn) {
            this.lockedIn = false
            this.normalBeepSlience = true
            SoundManager.playSoundQueue([
                { name: 'countdown2', relativePos: true, pos: this.newAim, wait: 200 },
                { name: 'countdown2', relativePos: true, pos: this.newAim,
                    action: () => {
                        this.normalBeepSlience = false
                        this.lastBeepTime = Date.now()
                    }},
            ])
            return
        }
        if (this.lockedIn || this.normalBeepSlience) { return }

        const now: number = Date.now()
        const timeDiff = now - this.lastBeepTime
        const time: number = dist >= this.minDegDistToSpeedup ? this.farAwayFreq : 
            Math.max(
            mapNumber(deg, targetDeg - this.minDegDistToSpeedup, targetDeg, this.farAwayFreq, this.maxFreq),
            mapNumber(deg, targetDeg + this.minDegDistToSpeedup, targetDeg, this.farAwayFreq, this.maxFreq))

        if (timeDiff >= time) {
            const speed: number = 1
            SoundManager.playSoundAtRelative('computerBeep', speed, this.newAim)
            this.lastBeepTime = now
        }
    }
}

class MoveToHandler {
    constructor(public pb: PuzzleBeeper) {}

    farAwayFreq: number = 1000
    maxFreq: number = 0

    lastBeepTime: number = 0

    minDistToSpeedup: number = 8 * 16 
    lockInDist: number = 2 * 16

    lockedIn: boolean = false
    normalBeepSlience: boolean = false
    freezePlayer: boolean = false
    
    handleMoveTo(step: PuzzleSelectionStep) {
        const pos: Vec3 & { level: number } = step.pos
        
        const playerPos: Vec3 = Vec3.create(ig.game.playerEntity.coll.pos)
        const dist: number = Vec3.distance(pos, playerPos)

        const self = this
        if (dist <= this.lockInDist) {
            if (! this.lockedIn) {
                this.lockedIn = true
                ig.game.playerEntity.setPos(pos.x, pos.y, pos.z)
                this.normalBeepSlience = true
                SoundManager.playSound('countdown1', 1.2, pos)
                ig.game.playerEntity.coll.vel = Vec3.create()
                sc.model.player.setCore(sc.PLAYER_CORE.MOVE, false)


                SoundManager.playSoundQueue([
                    { name: 'countdown1', pos, speed: 1.2, wait: 150 },
                    { name: 'countdown2', pos, speed: 1.2,
                        action() {
                            self.normalBeepSlience = false
                            self.lastBeepTime = Date.now()
                    },},
                ])
                setTimeout(() => sc.model.player.setCore(sc.PLAYER_CORE.MOVE, true), 1000)
            }
        } else if (this.lockedIn) {
            this.lockedIn = false
            this.normalBeepSlience = true

            SoundManager.playSoundQueue([
                { name: 'countdown2', pos, speed: 1.2, wait: 150 },
                { name: 'countdown1', pos, speed: 1.2, action: () => {
                    this.normalBeepSlience = false
                    this.lastBeepTime = Date.now()
                }},
            ])
            return
        }
        if (this.lockedIn || this.normalBeepSlience) { return }

        const now: number = Date.now()
        const timeDiff = now - this.lastBeepTime
        const time: number = dist >= this.minDistToSpeedup ? this.farAwayFreq : 
            mapNumber(dist, this.minDistToSpeedup, 0, this.farAwayFreq, this.maxFreq)

        if (timeDiff >= time) {
            const speed: number = 1
            SoundManager.playSound('trainCudeHide', speed, pos)
            this.lastBeepTime = now
        }
    }
}

export class PuzzleBeeper {
    aimHandler: AimHandler = new AimHandler(this)
    moveToHandler: MoveToHandler = new MoveToHandler(this)

    stepI: number = 0
    currentSel!: PuzzleSelection
    cachedSolution!: keyof ig.KnownVars
    finishCondition: string = ''

    initPrestart() {
        blitzkrieg.sels.puzzle.loadAll()

        this.aimHandler.initPrestart()
        
        const self = this
        ig.ENTITY.Player.inject({
            update() {
                this.parent()

                if (!ig.game || !ig.game.playerEntity || !MenuOptions.puzzleEnabled) { return }

                const sel: PuzzleSelection = blitzkrieg.sels.puzzle.inSelStack.peek()
                if (!sel || !sel.data.recordLog || sel.data.recordLog.steps.length == 0) { return }
                if (self.currentSel !== sel) {
                    self.currentSel = sel
                    self.stepI = 0
                    if (self.currentSel.data.completionType === blitzkrieg.PuzzleCompletionType.Normal) {
                        self.cachedSolution = blitzkrieg.PuzzleSelectionManager.getPuzzleSolveCondition(sel) as keyof ig.KnownVars
                    }
                }
                switch (self.currentSel.data.completionType) {
                    case blitzkrieg.PuzzleCompletionType.Normal: {
                        if (ig.vars.get(self.cachedSolution!)) {
                            if (self.stepI > 0) {
                                SoundManager.playSoundQueue([
                                    { name: 'botSuccess', wait: 150 },
                                    { name: 'counter',    wait: 20 },
                                    { name: 'botSuccess' },
                                ])
                                self.stepI = 0
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
            }
        })
    }
}
