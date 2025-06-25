import { AimAnalyzer, isAiming } from '../hint-system/aim-analyze'
import { Opts } from '../options'
import CrossedEyes from '../plugin'
import { SoundManager } from '../sound-manager'

const c_res = {}
const c_tmpPos: Vec3 = { x: 0, y: 0, z: 0 }
const c_tmpPoint: Vec3 = { x: 0, y: 0, z: 0 }

const range: number = 5 * 16

type CheckDirectionReturn = { type: 'none' | 'blocked' | 'collided'; pos: Vec3; distance: number; hitE?: ig.CollEntry[] }

export class LoudWalls {
    static g: LoudWalls

    static dirs: [string, Vec2][] = [
        ['wall_down', { x: 0, y: 1 }],
        ['wall_right', { x: 1, y: 0 }],
        ['wall_up', { x: 0, y: -1 }],
        ['wall_left', { x: -1, y: 0 }],
    ]
    static get continiousConfig(): SoundManager.ContiniousSettings {
        return {
            paths: ['wall'],
            changePitchWhenBehind: true,
            pathsBehind: ['wallLP'],
            getVolume: () => Opts.wallVolume * (AimAnalyzer.g.aimAnalyzeOn && isAiming() ? 0.4 : 1),
            condition: () => !(isAiming() && AimAnalyzer.g.wallScanOn),
        }
    }

    constructor() {
        /* in prestart */
        LoudWalls.g = this
        const self = this
        ig.ENTITY.Player.inject({
            update() {
                this.parent()
                Opts.spacialAudio && Opts.loudWalls && self.handleWallSound()
            },
        })
        for (const dir of LoudWalls.dirs) {
            SoundManager.continious[dir[0]] = LoudWalls.continiousConfig
        }
    }

    private handleWallSound() {
        if (CrossedEyes.isPaused || ig.game.playerEntity?.floating) {
            return
        }
        for (const [dirId, dir] of LoudWalls.dirs) {
            const check = LoudWalls.checkDirection(Vec2.create(dir), range, ig.COLLTYPE.PROJECTILE)

            if (check.type !== 'collided') {
                SoundManager.stopContinious(dirId)
                continue
            }

            if (check.distance <= range * 0.02) {
                check.pos.z = 0
                Vec2.assign(check.pos, dir)
                Vec3.length(check.pos, range * 0.021)
                Vec2.add(check.pos, ig.game.playerEntity.getCenter(c_tmpPos))
                check.pos.z = ig.game.playerEntity.coll.pos.z
            }
            SoundManager.handleContiniousEntry(dirId, check.pos, range, 0, dir)
        }
    }

    static checkDirection(dir: Vec2, distance: number, collType: ig.COLLTYPE, trackEntityTouch: boolean = true): CheckDirectionReturn {
        if (!ig.game || !ig.game.playerEntity) {
            return { type: 'none', pos: Vec3.create(), distance }
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
        const hitEntityList: ig.CollEntry[] = []
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
