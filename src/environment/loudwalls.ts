import { AimAnalyzer, isAiming } from '../hint-system/aim-analyze'
import { MenuOptions } from '../optionsManager'
import CrossedEyes, { PauseListener } from '../plugin'
import { SoundManager, isHandleMuted, muteHandle } from '../sound-manager'

const c_res = {}
const c_tmpPos: Vec3 = { x: 0, y: 0, z: 0 }
const c_tmpPoint: Vec3 = { x: 0, y: 0, z: 0 }

const range: number = 5 * 16

type CheckDirectionReturn = { type: 'none' | 'blocked' | 'collided'; pos: Vec3; distance: number; hitE?: ig.Physics.CollEntry[] }

export class LoudWalls implements PauseListener {
    static g: LoudWalls

    private handles: Record<string, { handle: ig.SoundHandleWebAudio; sound: string }> = {}
    constructor() {
        /* in prestart */
        LoudWalls.g = this
        CrossedEyes.pauseables.push(this)
        const self = this
        ig.ENTITY.Player.inject({
            update() {
                this.parent()
                MenuOptions.loudWalls && self.handleWallSound()
            },
        })
    }

    pause(): void {
        Object.values(this.handles ?? {}).forEach(h => h?.handle.setFixPosition(Vec3.createC(-1000, -1000, 0), 0))
    }

    private handleWallSound() {
        if (CrossedEyes.isPaused) {
            return
        }
        const dirs: [string, Vec2][] = [
            ['wallDown', { x: 0, y: 1 }],
            ['wallRight', { x: 1, y: 0 }],
            ['wallUp', { x: 0, y: -1 }],
            ['wallLeft', { x: -1, y: 0 }],
        ]
        const playerFaceAngle: number = (Vec2.clockangle(ig.game.playerEntity.face) * 180) / Math.PI
        for (const [dirId, dir] of dirs) {
            if (this.handleSoundAt(dirId, dir, playerFaceAngle, SoundManager.sounds.wall, LoudWalls.checkDirection(Vec2.create(dir), range, ig.COLLTYPE.PROJECTILE))) {
                continue
            }

            const { handle } = this.handles[dirId] ?? { handle: undefined }
            if (handle && (!handle.pos || !isHandleMuted(handle))) {
                muteHandle(handle, range)
            }
        }
    }

    private handleSoundAt(dirId: string, dir: Vec2, playerFaceAngle: number, soundName: string, check: CheckDirectionReturn): boolean {
        const volume = MenuOptions.wallVolume
        if (volume == 0) {
            return false
        }
        let { handle, sound } = this.handles[dirId] ?? { handle: undefined, sound: undefined }
        if (check.type === 'collided') {
            if (!handle || !handle._playing || sound != soundName) {
                this.handles[dirId] = {
                    handle: new ig.Sound(soundName, volume).play(true, {
                        speed: 1,
                    }),
                    sound: soundName,
                }
                handle = this.handles[dirId].handle
                muteHandle(handle, range)
            }

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
                const dirFaceAngle: number = (Vec2.clockangle(dir) * 180) / Math.PI
                const angleDist: number = Math.min(Math.abs(playerFaceAngle - dirFaceAngle), 360 - Math.abs(playerFaceAngle - dirFaceAngle))
                handle._nodeSource.bufferNode.playbackRate.value = angleDist >= 140 ? 0.7 : 1
                handle._nodeSource.gainNode.gain.value = volume * (AimAnalyzer.g.aimAnnounceOn && isAiming() ? 0.4 : 1)
            }
            return true
        }
        return false
    }

    static checkDirection(dir: Vec2, distance: number, collType: ig.COLLTYPE, trackEntityTouch: boolean = true): CheckDirectionReturn {
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
        trackEntityTouch && (ig.game.physics._trackEntityTouch = true)
        const collided: boolean = ig.game.trace(
            result,
            pos.x,
            pos.y,
            zPos,
            dir.x,
            dir.y,
            Constants.BALL_SIZE,
            Constants.BALL_SIZE,
            Constants.BALL_Z_HEIGHT,
            collType,
            null,
            hitEntityList
        )
        trackEntityTouch && (ig.game.physics._trackEntityTouch = false)

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
