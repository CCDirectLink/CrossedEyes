import type * as _ from 'cc-blitzkrieg'
import { MenuOptions } from './options'
import { mapNumber } from './spacialaudio'

export function playSoundRelative(path: string, pos: Vec2, speed: number) {
    const sound = new ig.Sound(path)
    const handle = sound.play(false, {
        speed
    })
    const soundPosVec2: Vec2 = Vec2.create(pos)
    Vec2.add(soundPosVec2, ig.game.playerEntity.coll.pos)
    const soundPos: Vec3 = Vec3.createC(soundPosVec2.x, soundPosVec2.y, ig.game.playerEntity.coll.pos.z)
    
    handle.setFixPosition(soundPos, 30*16)

}

const countdown1: string = 'media/sound/misc/countdown-1.ogg'
const countdown2: string = 'media/sound/misc/countdown-2.ogg'
const computerBeep: string = 'media/sound/misc/computer-beep-success.ogg'
const sounds = [ countdown1, countdown2, computerBeep ]

export class PuzzleBeeper {
    lockInAt() {

    }
    initPrestart() {
        sounds.forEach(str => new ig.Sound(str))
        const farAwayFreq: number = 1300
        const maxFreq: number = 0

        let lastBeepTime: number = 0

        const targetDeg: number = 90
        const minDegDistToSpeedup: number = 110
        const lockInDegDist: number = 10

        let lockedIn: boolean = false
        let normalBeepSlience: boolean = false

        const r = 15
        const theta = targetDeg * (Math.PI / 180)
        
        const newAim: Vec2 = Vec2.createC(
            r * Math.cos(theta),
            r * Math.sin(theta),
        )

        ig.ENTITY.Crosshair.inject({
            deferredUpdate(): void {
                this.parent()
                if (lockedIn) {
                    Vec2.assign(ig.game.playerEntityCrosshairInstance._aimDir, newAim)
                }
            }
        })

        ig.ENTITY.Player.inject({
            update() {
                this.parent()

                const aiming: boolean = ig.input.state("aim") || ig.gamepad.isRightStickDown()
                if (! aiming) {
                    lockedIn = false
                    return
                }
                if (!ig.game || !ig.game.playerEntity ||  !MenuOptions.puzzleEnabled) { return }
                const deg = ig.game.playerEntity.aimDegrees /* set by cc-blitzkrieg */
                if (! deg) { return }

                const dist: number = /* distance between target and current aim */
                    Math.min(Math.abs(deg - targetDeg),
                    Math.abs(360 - deg - targetDeg))


                if (dist <= lockInDegDist) {
                    if (! lockedIn) {
                        lockedIn = true
                        normalBeepSlience = true
                        playSoundRelative(countdown1, newAim, 1)
                        setTimeout(() => {
                            playSoundRelative(countdown2, newAim, 1)
                            normalBeepSlience = false
                            lastBeepTime = Date.now()
                        }, 200)
                    }
                } else if (lockedIn) {
                    lockedIn = false
                    normalBeepSlience = true
                    playSoundRelative(countdown2, newAim, 1)
                    setTimeout(() => {
                        playSoundRelative(countdown1, newAim, 1)
                        normalBeepSlience = false
                        lastBeepTime = Date.now()
                    }, 200)
                    return
                }
                if (lockedIn || normalBeepSlience) { return }

                const now: number = Date.now()
                const timeDiff = now - lastBeepTime
                const time: number = dist >= minDegDistToSpeedup ? farAwayFreq : 
                    Math.max(
                    mapNumber(deg, targetDeg - minDegDistToSpeedup, targetDeg, farAwayFreq, maxFreq),
                    mapNumber(deg, targetDeg + minDegDistToSpeedup, targetDeg, farAwayFreq, maxFreq))

                if (timeDiff >= time) {
                    const speed: number = 1
                    playSoundRelative(computerBeep, newAim, speed)
                    lastBeepTime = now
                }
            }
        })
    }
}
