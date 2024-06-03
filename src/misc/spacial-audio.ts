import { Opts } from '../options'

/* in prestart */
window.IG_FORCE_HTML5_AUDIO = true
// @ts-expect-error
ig.SOUND_RANGE_TYPE.CIRCULAR = 1 /* damn rfg how can a typo like this exist */

ig.SoundHandleWebAudio.inject({
    setFixPosition(point: Vec3, range?: number | undefined, type?: ig.SOUND_RANGE_TYPE | undefined): void {
        if (!Opts.spacialAudio) {
            return this.parent(point, range, type)
        }
        this.pos = {
            get point(): Vec3 {
                throw new Error('cannot get audio pos directly')
            },
            set point(_) {
                throw new Error('cannot set audio pos directly')
            },
            point3d: Vec3.create(point),
            entity: null,
            align: null,
            offset: null,
            range: range || 1600,
            rangeType: type || ig.SOUND_RANGE_TYPE.CIRULAR,
        }
    },
    setEntityPosition(entity: ig.Entity, align: ig.ENTITY_ALIGN, offset: null, range?: number | undefined, type?: ig.SOUND_RANGE_TYPE | undefined): void {
        if (!Opts.spacialAudio) {
            return this.parent(entity, align, offset, range, type)
        }
        this.pos = {
            get point(): Vec3 {
                throw new Error('cannot get audio pos directly')
            },
            set point(_) {
                throw new Error('cannot set audio pos directly')
            },
            point3d: Vec3.createC(0, 0, 0),
            entity,
            align,
            offset,
            range: range || 1600,
            rangeType: type || ig.SOUND_RANGE_TYPE.CIRULAR,
        }
        this._updateEntityPos(true)
    },
    _updateEntityPos(force?: boolean): void {
        if (!Opts.spacialAudio) {
            return this.parent(force)
        }
        if (this.pos && this.pos.entity) {
            if (force || !this.pos.entity._killed) {
                const pos = this.pos.entity.getAlignedPos(this.pos.align!)
                this.offset && Vec2.add(pos, this.offset)
                Vec3.assign(this.pos.point3d, pos)
            } else {
                this.pos.entity = null
            }
        }
    },
})

const soundPosCache = Vec3.create()
const playerPosCache = Vec3.create()

ig.SoundHandleWebAudio.inject({
    // @ts-expect-error
    play() {
        if (!Opts.spacialAudio) {
            // @ts-expect-error
            return this.parent()
        }
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
                    pauseOffset = ((this._contextTimeOnPause - this._contextTimeOnStart) * this._speed) % this._duration
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
        if (!Opts.spacialAudio) {
            return this.parent()
        }
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

                if ((ig.SOUND_RANGE_TYPE[this.pos.rangeType] as unknown as number) == ig.SOUND_RANGE_TYPE.HORIZONTAL) {
                    soundPosCache.x = 0
                } else if ((ig.SOUND_RANGE_TYPE[this.pos.rangeType] as unknown as number) == ig.SOUND_RANGE_TYPE.VERTICAL) {
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

ig.SoundWebAudio.inject({
    play(pos, settings) {
        const ret = this.parent(pos, settings)
        ret.path = this.webAudioBuffer.path
        return ret
    },
})

const groupPosCache = Vec3.create()
ig.SoundManager.inject({
    _solveGroupRequests(group) {
        if (!Opts.spacialAudio) {
            return this.parent(group)
        }
        if (group.playing.length > 0 && group.playing.last().getPlayTime() < 2 / 60) {
            return false
        }

        const requests: ig.SoundHandleBase[] = group.requests
        for (let i = requests.length; i--; ) {
            if (requests[i].isLooping()) {
                this.playSoundHandle(requests[i], group)
                requests.splice(i, 1)
            }
        }

        let foundRequest: ig.SoundHandleBase | undefined
        let leastDistance: number = -1
        for (let i = requests.length; i--; ) {
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
        for (let i = group.playing.length; i--; ) {
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

/* attack audio fix */
sc.Combat.inject({
    showHitEffect(entity, hitPos, hitDegree, hitElement, shielded, critical, ignoreSounds, spriteFilter) {
        const assignC_copy = Vec2.assignC
        Vec2.assignC = function (vec: Vec2, x?: Nullable<number>, y?: Nullable<number>) {
            if (Opts.spacialAudio && x == hitPos.x && y == hitPos.y - hitPos.z) {
                return Vec3.assign(vec as Vec3, hitPos)
            } else {
                return assignC_copy(vec, x, y)
            }
        }
        const ret = this.parent(entity, hitPos, hitDegree, hitElement, shielded, critical, ignoreSounds, spriteFilter)
        Vec2.assignC = assignC_copy
        return ret
    },
})
