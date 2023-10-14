import { MenuOptions } from './options'
import { mapNumber } from './spacial-audio';

const c_res = {}
const c_tmpPos: Vec3 = { x: 0, y: 0, z: 0}
const c_tmpPoint: Vec3 = { x: 0, y: 0, z: 0}

export class LoudWalls {
    initLoudWalls() {
        const wallHum = new ig.Sound('media/sound/wall-hum.ogg');
        ig.Game.inject({
            spawnEntity(entity, x, y, z, settings, showAppearEffects) {
                const result = this.parent(entity, x, y, z, settings, showAppearEffects)
                if (MenuOptions.loudWallsEnabled) { return result }
                // @ts-ignore fails at ig.ENTITY.Enemy
                if (result && (entity === 'Enemy' || (typeof entity !== 'string' && entity === ig.ENTITY.Enemy))) {
                    ig.SoundHelper.playAtEntity(wallHum, result, true, {
                        fadeDuration: 0
                    }, 16 * 16)
                }
                return result;
            },
        })

        const dirs: [Vec2, ig.SoundWebAudio][] = [
            [{ x: 0, y: 1 }, new ig.Sound('media/sound/misc/computer-beep-success.ogg')],
            // [{ x: 1, y: 1 }, new ig.Sound('media/sound/misc/computer-beep-success.ogg')],
            [{ x: 1, y: 0 }, new ig.Sound('media/sound/misc/computer-beep-success.ogg')],
            // [{ x: 1, y: -1 }, new ig.Sound('media/sound/misc/computer-beep-success.ogg')],
            [{ x: 0, y: -1 }, new ig.Sound('media/sound/misc/computer-beep-success.ogg')],
            // [{ x: -1, y: -1 }, new ig.Sound('media/sound/misc/computer-beep-success.ogg')],
            [{ x: -1, y: 0 }, new ig.Sound('media/sound/misc/computer-beep-success.ogg')],
            // [{ x: -1, y: 1 }, new ig.Sound('media/sound/misc/computer-beep-success.ogg')],
        ]


        const freq: number = 1000;
        const range: number = 5 * 16;
        let nextDir = 0;
        setInterval(() => {
            if (! MenuOptions.loudWallsEnabled) { return }
            const [dir, sound] = dirs[nextDir];
            const check = this._checkDirection(dir, range);
            if (check.type === 'collided') {
                if (check.distance <= range * 0.02) {
                    check.pos.z = 0
                    Vec2.assign(check.pos, dir)
                    Vec3.length(check.pos, range * 0.021)
                    Vec3.add(check.pos, ig.game.playerEntity.getAlignedPos(ig.ENTITY_ALIGN.CENTER, c_tmpPos))
                }

                const speed = mapNumber(check.distance, 0, range, 1, 0.5)
                // console.log(new Date().toUTCString(), 'play at', check.pos.x, check.pos.y, check.pos.z, 'distance', check.distance, 'speed', speed)
                const handle = sound.play(false, {
                    speed,
                })
                handle.setFixPosition(check.pos, range)
            }
            nextDir = (nextDir + 1) % dirs.length
        }, freq / dirs.length)
    }

    _checkDirection(dir: Vec2, distance: number): { type: 'none' | 'blocked' | 'collided', pos: Vec3, distance: number } {
        if (!ig.game || !ig.game.playerEntity) {
            return { type: 'none', pos: Vec3.createC(0, 0, 0), distance }
        }

        const pos: Vec3 = c_tmpPos

        ig.game.playerEntity.getAlignedPos(ig.ENTITY_ALIGN.CENTER, pos)

        let zPos: number = ig.game.playerEntity.coll.pos.z
        if(ig.game.playerEntity.maxJumpHeight !== undefined && ig.game.playerEntity.maxJumpHeight >= 0) {
            zPos = Math.min(ig.game.playerEntity.coll.pos.z, ig.game.playerEntity.maxJumpHeight)
        }
        zPos += Constants.BALL_HEIGHT

        Vec2.length(dir, distance)

        const result: ig.Physics.TraceResult = ig.game.physics.initTraceResult(c_res)
        const hitEntityList: ig.Physics.CollEntry[] = []
        const collided: boolean = ig.game.trace(
            result, pos.x, pos.y, zPos, dir.x, dir.y,
            Constants.BALL_SIZE, Constants.BALL_SIZE, Constants.BALL_Z_HEIGHT,
            ig.COLLTYPE.PROJECTILE, null, hitEntityList)

        if (! collided) {
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
                return { type: 'blocked', pos: c_tmpPoint, distance: result.dist * distance }
            }
        }
        
        return { type: 'collided', pos: c_tmpPoint, distance: result.dist * distance }
    }
}
