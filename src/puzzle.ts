import type * as _ from 'cc-blitzkrieg'
import { MenuOptions } from './options'
import { mapNumber } from './spacialaudio'

export class PuzzleBeeper {
    initPrestart() {
        const farAwayFreq: number = 1500
        const maxFreq: number = 400

        let lastBeepTime: number = 0

        const targetDeg: number = 90
        const minDegDistToSpeedup: number = 50


        const r = 15
        const theta = targetDeg * (Math.PI / 180)
        
        const newAim: Vec2 = Vec2.createC(
            r * Math.cos(theta),
            r * Math.sin(theta),
        )

        ig.ENTITY.Player.inject({
            update() {
                this.parent()

                if (!ig.game || !ig.game.playerEntity || !MenuOptions.puzzleEnabled) { return }
                const deg = ig.game.playerEntity.aimDegrees /* set by cc-blitzkrieg */
                if (! deg) { return }

                const dist: number = /* distance between target and current aim */
                    Math.min(Math.abs(deg - targetDeg),
                    Math.abs(360 - deg - targetDeg))

                const now: number = Date.now()
                const timeDiff = now - lastBeepTime
                const time: number = dist >= minDegDistToSpeedup ? farAwayFreq : 
                    Math.max(
                    mapNumber(deg, targetDeg - minDegDistToSpeedup, targetDeg, farAwayFreq, maxFreq),
                    mapNumber(deg, targetDeg + minDegDistToSpeedup, targetDeg, farAwayFreq, maxFreq))

                if (timeDiff >= time) {
                    console.log(timeDiff, time)
                    const speed: number = 1
                    const handle = new ig.Sound('media/sound/misc/computer-beep-success.ogg').play(false, {
                        speed
                    })
                    const soundPosVec2: Vec2 = Vec2.create(newAim)
                    Vec2.add(soundPosVec2, ig.game.playerEntity.coll.pos)
                    // Vec2.add(soundPosVec2, ig.camera.targets[0]._currentZoomOffset)
                    const soundPos: Vec3 = Vec3.createC(soundPosVec2.x, soundPosVec2.y, ig.game.playerEntity.coll.pos.z)
                    
                    console.log(soundPos)
                    handle.setFixPosition(soundPos, 100)

                    //Vec2.assign(ig.game.playerEntityCrosshairInstance._aimDir, newAim)
                    lastBeepTime = now
                }
            }
        })
    }
}
