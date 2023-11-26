import { AimAnalyzer } from './hint-system/aim-analyze'
import { MenuOptions } from './options'
import { PauseListener } from './plugin'
import { SoundManager } from './sound-manager'

const c_res = {}
const c_tmpPos: Vec3 = { x: 0, y: 0, z: 0 }
const c_tmpPoint: Vec3 = { x: 0, y: 0, z: 0 }

const range: number = 5 * 16
function turnOffHandle(handle: ig.SoundHandleWebAudio) {
    handle.setFixPosition(Vec3.createC(-1000, -1000, 0), range)
}
function isHandleOff(handle: ig.SoundHandleWebAudio) {
    return handle.pos?.point3d == Vec3.createC(-1000, -1000, 0)
}

export class LoudWalls implements PauseListener {
    static g: LoudWalls

    private handles: Record<string, ig.SoundHandleWebAudio> = {}
    constructor() { /* in prestart */
        LoudWalls.g = this
        const self = this
        ig.ENTITY.Player.inject({
            update() {
                this.parent()
                MenuOptions.loudWallsEnabled && self.handleWallSound()
            }
        })
    }

    pause(): void {
        if (this.handles) {
            Object.values(this.handles).forEach(h => h?.setFixPosition(Vec3.createC(-1000, -1000, 0), 0))
        }
    }

    private handleWallSound() {
        if (ig.game.events.blockingEventCall || AimAnalyzer.g.aimAnnounceOn) { return }
        const dirs: [string, Vec2][] = [
            ['wallDown', { x: 0, y: 1 }],
            ['wallRight', { x: 1, y: 0 }],
            ['wallUp', { x: 0, y: -1 }],
            ['wallLeft', { x: -1, y: 0 }],
        ]
        const playerFaceAngle: number = Vec2.clockangle(ig.game.playerEntity.face) * 180 / Math.PI
        for (const [dirId, dir] of dirs) {
            let handle = this.handles[dirId]
            if (!handle || !handle._playing) {
                handle = this.handles[dirId] = new ig.Sound(SoundManager.sounds.wall).play(true, {
                    speed: 1,
                })
                turnOffHandle(handle)
            }
            const check = LoudWalls.checkDirection(Vec2.create(dir), range, ig.COLLTYPE.PROJECTILE)
            if (check.type === 'collided') {
                if (check.distance <= range * 0.02) {
                    check.pos.z = 0
                    Vec2.assign(check.pos, dir)
                    Vec3.length(check.pos, range * 0.021)
                    Vec3.add(check.pos, ig.game.playerEntity.getAlignedPos(ig.ENTITY_ALIGN.CENTER, c_tmpPos))
                }

                if (!handle.pos || !Vec3.equal(handle.pos.point3d, check.pos)) {
                    handle.setFixPosition(check.pos, range)
                }
                if (handle._nodeSource) {
                    const dirFaceAngle: number = Vec2.clockangle(dir) * 180 / Math.PI
                    const angleDist: number = Math.min(
                        Math.abs(playerFaceAngle - dirFaceAngle),
                        360 - Math.abs(playerFaceAngle - dirFaceAngle)
                    )
                    handle._nodeSource.bufferNode.playbackRate.value = angleDist >= 140 ? 0.7 : 1
                }
            } else if (!handle.pos || !isHandleOff(handle)) {
                turnOffHandle(handle)
            }
        }
    }

    static checkDirection(dir: Vec2, distance: number, collType: ig.COLLTYPE): { type: 'none' | 'blocked' | 'collided', pos: Vec3, distance: number, hitE?: ig.Physics.CollEntry[] } {
        if (!ig.game || !ig.game.playerEntity) {
            return { type: 'none', pos: Vec3.createC(0, 0, 0), distance }
        }

        const pos: Vec3 = c_tmpPos

        ig.game.playerEntity.getAlignedPos(ig.ENTITY_ALIGN.CENTER, pos)

        let zPos: number = ig.game.playerEntity.coll.pos.z
        if (ig.game.playerEntity.maxJumpHeight !== undefined && ig.game.playerEntity.maxJumpHeight >= 0) {
            zPos = Math.min(ig.game.playerEntity.coll.pos.z, ig.game.playerEntity.maxJumpHeight)
        }
        zPos += Constants.BALL_HEIGHT

        Vec2.length(dir, distance)

        const result: ig.Physics.TraceResult = ig.game.physics.initTraceResult(c_res)
        const hitEntityList: ig.Physics.CollEntry[] = []
        ig.game.physics._trackEntityTouch = true
        const collided: boolean = ig.game.trace(
            result, pos.x, pos.y, zPos, dir.x, dir.y,
            Constants.BALL_SIZE, Constants.BALL_SIZE, Constants.BALL_Z_HEIGHT,
            collType, null, hitEntityList)
        ig.game.physics._trackEntityTouch = false

        if (!collided) {
            return { type: 'none', pos, distance }
        }

        Vec2.assign(c_tmpPoint, dir)
        Vec2.mulF(c_tmpPoint, result.dist)
        Vec2.add(c_tmpPoint, pos)
        c_tmpPoint.z = pos.z

        if (dir.x < 0) {
            c_tmpPoint.x -= Constants.BALL_SIZE
            result.dist -= Constants.BALL_SIZE / distance
        }
        if (dir.y < 0) {
            c_tmpPoint.y -= Constants.BALL_SIZE
            result.dist -= Constants.BALL_SIZE / distance
        }

        for (const { entity } of hitEntityList) {
            if (entity.ballDestroyer || (entity.isBallDestroyer && entity.isBallDestroyer(c_tmpPoint, result))) {
                return { type: 'blocked', pos: c_tmpPoint, distance: result.dist * distance, hitE: hitEntityList }
            }
        }

        return { type: 'collided', pos: c_tmpPoint, distance: result.dist * distance, hitE: hitEntityList }
    }
}
