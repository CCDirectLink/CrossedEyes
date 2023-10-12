import { MenuOptions } from "./options"

export function mapNumber(input: number, fromStart: number, fromEnd: number, toStart: number, toEnd: number) {
    return fromEnd == fromStart ? toEnd : toStart + (toEnd - toStart) * ((input - fromStart) / (fromEnd - fromStart))
}

const c_res = {}
const c_tmpPos: Vec3 = { x: 0, y: 0, z: 0}
const c_tmpPoint: Vec3 = { x: 0, y: 0, z: 0}

export class SpacialAudio {
    initSpacialAudio() {
        window.IG_FORCE_HTML5_AUDIO = true
        // @ts-expect-error
        ig.SOUND_RANGE_TYPE.CIRCULAR = 1 /* damn rfg how can a typo like this exist */

         ig.SoundHandleWebAudio.inject({
            setFixPosition(point: Vec3, range?: number | undefined, type?: ig.SOUND_RANGE_TYPE | undefined): void {
                if (! MenuOptions.spacialAudioEnabled) { return this.parent(point, range, type) }
                this.pos = {
                    get point(): Vec3 { throw new Error('cannot get audio pos directly') },
                    set point(_) { throw new Error('cannot set audio pos directly') },
                    point3d: Vec3.createC(point.x, point.y, point.z),
                    entity: null,
                    align: null,
                    offset: null,
                    range: range || 1600,
                    rangeType: type || ig.SOUND_RANGE_TYPE.CIRCULAR
                }
            },
            setEntityPosition(entity: ig.Entity, align: ig.ENTITY_ALIGN, offset: null, range?: number | undefined, type?: ig.SOUND_RANGE_TYPE | undefined): void {
                if (! MenuOptions.spacialAudioEnabled) { return this.parent(entity, align, offset, range, type) }
                this.pos = {
                    get point(): Vec3 { throw new Error('cannot get audio pos directly') },
                    set point(_) { throw new Error('cannot set audio pos directly') },
                    point3d: Vec3.createC(0, 0, 0),
                    entity: entity,
                    align: align,
                    offset: offset,
                    range: range || 1600,
                    rangeType: type || ig.SOUND_RANGE_TYPE.CIRCULAR
                }
                this._updateEntityPos(true)
            },
            _updateEntityPos(force?: boolean): void {
                if (! MenuOptions.spacialAudioEnabled) { return this.parent(force) }
                if (this.pos && this.pos.entity) {
                    if (force || !this.pos.entity._killed) {
                        const pos = this.pos.entity.getAlignedPos(this.pos.align!, Vec3.create())
                        this.offset && Vec2.add(pos, this.offset)
                        Vec3.assign(this.pos.point3d, pos)
                    } else {
                        this.pos.entity = null
                    }
                }
            }
        })
        
        const soundPosCache = Vec3.create()
        const playerPosCache = Vec3.create()

        ig.SoundHandleWebAudio.inject({
            play() {
                if (! MenuOptions.spacialAudioEnabled) { return this.parent() }
                if (!this._playing && this._buffer) {
                    const audioContext: ig.WebAudio = ig.soundManager.context
                    if (this.pos && !this._nodePosition) {
                        this._nodePosition = audioContext.createPanner()
                        this._nodePosition.panningModel = 'HRTF'
                        this._nodePosition.distanceModel = 'linear'
                        this._nodePosition.refDistance = 0.02 * this.pos.range
                        this._nodePosition.maxDistance = this.pos.range
                        this._setPosition()
                    }
                    if (this._nodeSource) {
                        this._fadeTimer = this._fadeDuration - this._fadeTimer
                        this._fadeIn = true
                    } else {
                        let pauseOffset: number = 0
                        if (this._contextTimeOnPause == -1) {
                            this._contextTimeOnStart = audioContext.getCurrentTime()
                            this._fadeIn = false
                        } else {
                            pauseOffset = (this._contextTimeOnPause - this._contextTimeOnStart) * this._speed % this._duration
                            const currentTime: number = audioContext.getCurrentTime()
                            this._contextTimeOnStart = this._contextTimeOnStart + (currentTime - this._contextTimeOnPause)
                            this._contextTimeOnPause = -1
                            this._fadeIn = true
                            this._fadeTimer = this._fadeDuration
                        }
                        this._nodeSource = audioContext.createBufferGain(this._buffer, this._fadeIn ? 0 : this._volume * this._volume, this._speed)
                        this._nodeSource.setLoop(this._loop)
                        if (this._nodePosition) {
                            this._nodeSource.connect(this._nodePosition)
                            ig.soundManager.connectSound(this._nodePosition)
                        } else {
                            ig.soundManager.connectSound(this._nodeSource)
                        }
                        this._nodeSource.play(audioContext.getCurrentTimeRaw() + this._startTime, this._offset + pauseOffset)
                    }
                    this._playing = true
                }
            },
            _setPosition() {
                if (! MenuOptions.spacialAudioEnabled) { return this.parent() }
                if (this.pos) {
                    this._updateEntityPos()
                    if (this._nodePosition) {
                        const min: number = this.pos.range * 0.02
                        const max: number = this.pos.range - min

                        Vec3.assign(soundPosCache, this.pos.point3d ?? Vec3.create())
                        if (ig.game.playerEntity) {
                            ig.game.playerEntity.getAlignedPos(ig.ENTITY_ALIGN.CENTER, playerPosCache)
                            Vec3.sub(soundPosCache, playerPosCache)
                        }

                        if (ig.SOUND_RANGE_TYPE[this.pos.rangeType] as unknown as number == ig.SOUND_RANGE_TYPE.HORIZONTAL) {
                            soundPosCache.x = 0
                        } else if (ig.SOUND_RANGE_TYPE[this.pos.rangeType] as unknown as number == ig.SOUND_RANGE_TYPE.VERTICAL) {
                            soundPosCache.y = 0
                        }

                        const distance: number = Vec3.length(soundPosCache)

                        const clamped: number = distance < min ? 0 : KEY_SPLINES.EASE_SOUND.get(((distance - min) / max).limit(0, 1)) * this.pos.range
                        if (clamped === 0) {
                            this._nodePosition.panningModel = 'equalpower'
                        } else {
                            this._nodePosition.panningModel = 'HRTF'
                        }

                        Vec3.length(soundPosCache, clamped)

                        this._nodePosition.positionX.value = soundPosCache.x
                        this._nodePosition.positionY.value = soundPosCache.z
                        this._nodePosition.positionZ.value = soundPosCache.y
                    }
                }
            },
        })
        
        const groupPosCache = Vec3.create()
        ig.SoundManager.inject({
            _solveGroupRequests(group) {
                if (! MenuOptions.spacialAudioEnabled) { return this.parent(group) }
                if (group.playing.length > 0 && group.playing[group.playing.length - 1].getPlayTime() < 2/60) {
                    return false
                }

                const requests: ig.SoundHandleBase[] = group.requests
                for (let i = requests.length; i--;) {
                    if (requests[i].isLooping()) {
                        this.playSoundHandle(requests[i], group)
                        requests.splice(i, 1)
                    } 
                }

                let foundRequest: ig.SoundHandleBase | undefined
                let leastDistance: number = -1
                for (let i = requests.length; i--;) {
                    const request = requests[i]
                    let distance: number = 0
                    if (request.pos) {
                        Vec3.assign(groupPosCache, request.pos.point3d ?? Vec3.create())
                        if (ig.game.playerEntity) {
                            ig.game.playerEntity.getAlignedPos(ig.ENTITY_ALIGN.CENTER, playerPosCache)
                            Vec3.sub(groupPosCache, playerPosCache)
                        }
                        distance = Vec3.length(groupPosCache)
                    }
                    if (leastDistance == -1 || distance < leastDistance) {
                        leastDistance = distance
                        foundRequest = requests[i]
                    }
                }
                for (let i = group.playing.length; i--;)  {
                    if (!group.playing[i].isLooping()) {
                        group.playing[i].stop()
                    }
                }
                if (foundRequest) {
                    this.playSoundHandle(foundRequest, group)
                }
                requests.length = 0
                return true
            },
        })
    }
    
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
                console.log(new Date().toUTCString(), 'play at', check.pos.x, check.pos.y, check.pos.z, 'distance', check.distance, 'speed', speed)
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
