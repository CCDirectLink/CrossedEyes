/* code written by 2767mr */

const c_res = {};
const c_tmpPos = {x: 0, y: 0, z: 0};
const c_tmpPoint = {x: 0, y: 0, z: 0};

export class SpacialAudio {
    initPrestart() {
        const zero = Vec3.createC(0, 0, 0);
        const SoundHandleBase = ig.Class.extend({
            pos: null,
            setFixPosition(point, range, type) {
                this.pos = {
                    get point() { throw new Error('cannot get audio pos directly') },
                    set point(val) { throw new Error('cannot set audio pos directly') },
                    point3d: Vec3.createC(point.x, point.y, point.z),
                    entity: null,
                    align: null,
                    offset: null,
                    range: range || 1600,
                    rangeType: type || ig.SOUND_RANGE_TYPE.CIRCULAR
                }
            },
            setEntityPosition(entity, align, offset, range, type) {
                this.pos = {
                    get point() { throw new Error('cannot get audio pos directly') },
                    set point(val) { throw new Error('cannot set audio pos directly') },
                    point3d: Vec3.createC(0, 0, 0),
                    entity: entity,
                    align: align,
                    offset: offset,
                    range: range || 1600,
                    rangeType: type || ig.SOUND_RANGE_TYPE.CIRCULAR
                };
                this._updateEntityPos(true);
            },
            _updateEntityPos(force) {
                if (this.pos && this.pos.entity) {
                    if (force || !this.pos.entity._killed) {
                        const pos = this.pos.entity.getAlignedPos(this.pos.align, zero);
                        this.offset && g.add(pos, this.offset);
                        this.pos.point3d.x = pos.x;
                        this.pos.point3d.y = pos.y;
                        this.pos.point3d.z = pos.z;
                    } else {
                        this.pos.entity = null
                    }
                }
            }
        });

        const soundPosCache = Vec3.createC(0, 0, 0);
        const playerPosCache = Vec3.createC(0, 0, 0);
        ig.SoundHandle = SoundHandleBase.extend({
            group: null,
            _buffer: null,
            _volume: 0,
            _speed: 0,
            _time: 0,
            _duration: 0,
            _offset: 0,
            _startTime: 0,
            _nodeSource: null,
            _nodePosition: null,
            _loop: false,
            _width: 0,
            _height: 0,
            _playing: false,
            _fadeTimer: 0,
            _fadeIn: false,
            _fadeDuration: 0,
            _contextTimeOnStart: 0,
            _contextTimeOnPause: -1,
            init(sound, offset, startTime, loop, volume, speed, fadeDuration) {
                this._offset = offset || 0;
                this._startTime = startTime || 0;
                this._duration = sound.duration / speed;
                this._loop = loop || false;
                this._buffer = sound;
                this._volume = volume;
                this._speed = speed;
                this._fadeDuration = fadeDuration || 0.1;
                this._doPanning = this._duration >= 1 || this._loop
            },
            update() {
                if (this._doPanning) {
                    this._setPosition();
                }

                if (!this._loop 
                    && this._contextTimeOnPause == -1 
                    && ig.soundManager.context.getCurrentTime() - this._contextTimeOnStart >= this._duration) {

                    ig.soundManager.stopSoundHandle(this);
                    this._buffer = null;
                    this._disconnect();
                    return true;
                }

                if (this._fadeTimer) {
                    this._fadeTimer = this._fadeTimer - ig.system.rawTick;
                    if (this._fadeTimer <= 0) {
                        this._fadeTimer = 0;
                        if (!this._fadeIn) {
                            this._disconnect();
                            return true;
                        }
                    }
                    if (this._nodeSource) {
                        let fadeProgress = this._fadeTimer / this._fadeDuration;
                        if (this._fadeIn) {
                            fadeProgress = 1 - fadeProgress;
                        }
                        this._nodeSource.setVolume(this._volume * this._volume * fadeProgress * fadeProgress);
                    }
                }
                return false;
            },
            isLooping() {
                return this._loop
            },
            setSize(width, height) {
                this._width = width || 0;
                this._height = height || 0
            },
            play() {
                if (!this._playing && this._buffer) {
                    const audioContext = ig.soundManager.context;
                    if (this.pos && !this._nodePosition) {
                        this._nodePosition = audioContext.createPanner();
                        this._nodePosition.panningModel = "HRTF";
                        this._nodePosition.distanceModel = "linear";
                        this._nodePosition.refDistance = 0.02 * this.pos.range;
                        this._nodePosition.maxDistance = this.pos.range;
                        this._setPosition();
                    }
                    if (this._nodeSource) {
                        this._fadeTimer = this._fadeDuration - this._fadeTimer;
                        this._fadeIn = true;
                    } else {
                        let pauseOffset = 0;
                        if (this._contextTimeOnPause == -1) {
                            this._contextTimeOnStart = audioContext.getCurrentTime();
                            this._fadeIn = false
                        } else {
                            pauseOffset = (this._contextTimeOnPause - this._contextTimeOnStart) * this._speed % this._duration;
                            const currentTime = audioContext.getCurrentTime();
                            this._contextTimeOnStart = this._contextTimeOnStart + (currentTime - this._contextTimeOnPause);
                            this._contextTimeOnPause = -1;
                            this._fadeIn = true;
                            this._fadeTimer = this._fadeDuration;
                        }
                        this._nodeSource = audioContext.createBufferGain(this._buffer, this._fadeIn ? 0 : this._volume * this._volume, this._speed);
                        this._nodeSource.setLoop(this._loop);
                        if (this._nodePosition) {
                            this._nodeSource.connect(this._nodePosition);
                            ig.soundManager.connectSound(this._nodePosition);
                        } else {
                            ig.soundManager.connectSound(this._nodeSource);
                        }
                        this._nodeSource.play(audioContext.getCurrentTimeRaw() + this._startTime, this._offset + pauseOffset)
                    }
                    this._playing = true;
                }
            },
            stop() {
                this.pause();
                this._buffer = null;
                ig.soundManager.stopSoundHandle(this);
            },
            _disconnect() {
                if (this._nodeSource) {
                    this._nodeSource.stop(0);
                    if (this._nodePosition) {
                        this._nodeSource.disconnect(this._nodePosition);
                        ig.soundManager.disconnectSound(this._nodePosition);
                    } else {
                        ig.soundManager.disconnectSound(this._nodeSource);
                    }
                    this._nodeSource = null;
                }
            },
            getPlayTime() {
                return ig.soundManager.context.getCurrentTime() - this._contextTimeOnStart;
            },
            pause(instant) {
                if (this._playing) {
                    this._contextTimeOnPause =
                        ig.soundManager.context.getCurrentTime();
                    this._playing = false;
                    if (instant) {
                        this._disconnect();
                        this._fadeTimer = 0
                    } else {
                        this._fadeTimer = this._fadeDuration;
                    }
                    this._fadeIn = false
                }
            },
            _setPosition() {
                if (this.pos) {
                    this._updateEntityPos();
                    if (this._nodePosition) {
                        const min = this.pos.range * 0.02;
                        const max = this.pos.range - min;


                        Vec3.assign(soundPosCache, this.pos.point3d);
                        if (ig.game.playerEntity) {
                            ig.game.playerEntity.getAlignedPos(ig.ENTITY_ALIGN.CENTER, playerPosCache);
                            Vec3.sub(soundPosCache, playerPosCache);
                        }

                        if (ig.SOUND_RANGE_TYPE[this.pos.rangeType] == ig.SOUND_RANGE_TYPE.HORIZONTAL) {
                            soundPosCache.x = 0;
                        } else if (ig.SOUND_RANGE_TYPE[this.pos.rangeType] == ig.SOUND_RANGE_TYPE.VERTICAL) {
                            soundPosCache.y = 0;
                        }

                        const distance = Vec3.length(soundPosCache)

                        const clamped = distance < min ? 0 : KEY_SPLINES.EASE_SOUND.get(((distance - min) / max).limit(0, 1)) * this.pos.range;
                        if (clamped === 0) {
                            this._nodePosition.panningModel = "equalpower";
                        } else {
                            this._nodePosition.panningModel = "HRTF";
                        }


                        Vec3.length(soundPosCache, clamped);

                        this._nodePosition.positionX.value = soundPosCache.x;
                        this._nodePosition.positionY.value = soundPosCache.z;
                        this._nodePosition.positionZ.value = soundPosCache.y;
                    }
                }
            },
            onActionEndDetach() {
                this.stop()
            },
            onEntityKillDetach() {
                this.stop()
            }
        });

        const groupPosCache = Vec3.createC(0, 0, 0);
        ig.SoundManager.inject({
            _solveGroupRequests: function(group) {
                if (group.playing.length > 0 && group.playing[group.playing.length - 1].getPlayTime() < 2/60) {
                    return false;
                }

                const requests = group.requests;
                for (let i = requests.length; i--;) {
                    if (requests[i].isLooping()) {
                        this.playSoundHandle(requests[i], group);
                        requests.splice(i, 1)
                    } 
                }

                let foundRequest;
                let leastDistance = -1;
                for (let i = requests.length; i--;) {
                    const request = requests[i];
                    let distance = 0;
                    if (request.pos) {
                        Vec3.assign(groupPosCache, request.pos.point3d);
                        if (ig.game.playerEntity) {
                            ig.game.playerEntity.getAlignedPos(ig.ENTITY_ALIGN.CENTER, playerPosCache);
                            Vec3.sub(groupPosCache, playerPosCache);
                        }
                        distance = Vec3.length(groupPosCache)
                    }
                    if (leastDistance == -1 || distance < leastDistance) {
                        leastDistance = distance;
                        foundRequest = requests[i]
                    }
                }
                for (let i = group.playing.length; i--;)  {
                    if (!group.playing[i].isLooping()) {
                        group.playing[i].stop();
                    }
                }
                if (foundRequest) {
                    this.playSoundHandle(foundRequest, group);
                }
                requests.length = 0;
                return true
            },
        });

        var wallHum = new ig.Sound('media/sound/wall-hum.ogg');

        ig.Game.inject({
            spawnEntity(type, ...args) {
                const result = this.parent(type, ...args);
                // if (result && (type === 'Enemy' || type === ig.ENTITY.Enemy)) {
                //     ig.SoundHelper.playAtEntity(wallHum, result, true, {
                //         fadeDuration: 0
                //     }, 16 * 16)
                // }
                return result;
            }
        });

        Object.assign(window, {access: this});

        const dirs = [
            [{ x: 0, y: 1 }, new ig.Sound('media/sound/misc/computer-beep-success.ogg')],
            // [{ x: 1, y: 1 }, new ig.Sound('media/sound/misc/computer-beep-success.ogg')],
            [{ x: 1, y: 0 }, new ig.Sound('media/sound/misc/computer-beep-success.ogg')],
            // [{ x: 1, y: -1 }, new ig.Sound('media/sound/misc/computer-beep-success.ogg')],
            [{ x: 0, y: -1 }, new ig.Sound('media/sound/misc/computer-beep-success.ogg')],
            // [{ x: -1, y: -1 }, new ig.Sound('media/sound/misc/computer-beep-success.ogg')],
            [{ x: -1, y: 0 }, new ig.Sound('media/sound/misc/computer-beep-success.ogg')],
            // [{ x: -1, y: 1 }, new ig.Sound('media/sound/misc/computer-beep-success.ogg')],
        ];


        const freq = 1000;
        const range = 5 * 16;
        let nextDir = 0;
        setInterval(() => {
            const [dir, sound] = dirs[nextDir];
            const check = this._checkDirection(dir, range);
            if (check.type === 'collided') {
                if (check.distance <= range * 0.02) {
                    check.pos.z = 0;
                    Vec2.assign(check.pos, dir);
                    Vec3.length(check.pos, range * 0.021);
                    Vec3.add(check.pos, ig.game.playerEntity.getAlignedPos(ig.ENTITY_ALIGN.CENTER, c_tmpPos));
                }

                const speed = mapNumber(check.distance, 0, range, 1, 0.5);
                console.log(new Date().toUTCString(), 'play at', check.pos.x, check.pos.y, check.pos.z, 'distance', check.distance, 'speed', speed);
                const handle = sound.play(false, {
                    speed,
                });
                handle.setFixPosition(check.pos, range);
            }
            nextDir = (nextDir + 1) % dirs.length;
        }, freq / dirs.length);

        function mapNumber(input, fromStart, fromEnd, toStart, toEnd) {
            return fromEnd == fromStart ? toEnd : toStart + (toEnd - toStart) * ((input - fromStart) / (fromEnd - fromStart))
        }
    }

    _checkDirection(dir, distance) {
        if (!ig.game || !ig.game.playerEntity) {
            return { type: 'none', pos: { x: 0, y: 0, z: 0 }, distance };
        }

        const pos = c_tmpPos;

        ig.game.playerEntity.getAlignedPos(ig.ENTITY_ALIGN.CENTER, pos);

        let zPos = ig.game.playerEntity.coll.pos.z;
        if(ig.game.playerEntity.maxJumpHeight !== undefined && ig.game.playerEntity.maxJumpHeight >= 0) {
            zPos = Math.min(ig.game.playerEntity.coll.pos.z, ig.game.playerEntity.maxJumpHeight);
        }
        zPos += Constants.BALL_HEIGHT;

        Vec2.length(dir, distance);

        const result = ig.game.physics.initTraceResult(c_res);
        const hitEntityList = [];
        const collided = ig.game.trace(result, pos.x, pos.y, zPos, dir.x, dir.y, Constants.BALL_SIZE, Constants.BALL_SIZE, Constants.BALL_Z_HEIGHT, ig.COLLTYPE.PROJECTILE, null, hitEntityList);
        if (!collided) {
            return { type: 'none', pos, distance };
        }

        Vec2.assign(c_tmpPoint, dir);
        Vec2.mulF(c_tmpPoint, result.dist);
        Vec2.add(c_tmpPoint, pos);
        c_tmpPoint.z = pos.z;

        if (dir.x < 0) {
            c_tmpPoint.x -= Constants.BALL_SIZE;
            result.dist -= Constants.BALL_SIZE / distance;
        }
        if (dir.y < 0) {
            c_tmpPoint.y -= Constants.BALL_SIZE;
            result.dist -= Constants.BALL_SIZE / distance;
        }

        for (const {entity} of hitEntityList) {
            if (entity.ballDestroyer || (entity.isBallDestroyer && entity.isBallDestroyer(c_tmpPoint, result))) {
                return { type: 'blocked', pos: c_tmpPoint, distance: result.dist * distance };
            }
        }
        
        return { type: 'collided', pos: c_tmpPoint, distance: result.dist * distance };
    }
}
