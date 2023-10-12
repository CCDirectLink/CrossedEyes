export {}

declare global {
    namespace ig {
        namespace ENTITY {
            interface Player {
                maxJumpHeight: number
            }
        }
        namespace Physics {
            interface TraceResult {
                dir: Vec2
                dist: number
                levelUp: boolean
                forcePushEntries: null
                forcePushDirs: null
            }
            interface CollEntry {
                _inCollisionMap: boolean
                type: ig.COLLTYPE
                pos: Vec2
                size: Vec2
                padding: Vec2
                parentColl: CollEntry
                ignoreCollision: boolean
                weight: number
                entity: ig.Entity
            }
        }
        interface Physics {
            initTraceResult(this: this, empty: { dir?: Vec2 }): ig.Physics.TraceResult
        }
        interface Game {
            trace(this: this, res: ig.Physics.TraceResult, x: number, y: number, z: number, vx: number, vy: number,
                width: number, height: number, zHeight: number, collType: ig.COLLTYPE,
                entryException: null, collisionList: any[], onGround?: boolean): boolean
        }
        interface Entity {
            isBallDestroyer?(collPos: Vec3, collRes: { dir: Vec2 }, c?: boolean): boolean
        }
        interface SoundHandleBase extends ig.Class {
            pos: null | {
                point: Vec2
                point3d: Vec3,
                entity: ig.Entity | null,
                align: ig.ENTITY_ALIGN | null,
                offset: null,
                range: number
                rangeType: ig.SOUND_RANGE_TYPE
            }
            offset: Vec2

            setFixPosition(this: this, point: Vec3, range?: number, type?: ig.SOUND_RANGE_TYPE): void
            setEntityPosition(this: this, entity: ig.Entity, align: ig.ENTITY_ALIGN, offset: null, range?: number, type?: ig.SOUND_RANGE_TYPE): void
            _updateEntityPos(this: this, force?: boolean): void

            isLooping(this: this): boolean
            getPlayTime(this: this): number
            stop(this: this): void
        }
        interface SoundHandleBaseConstructor extends ImpactClass<ig.SoundHandleBase> {
            new (): ig.SoundHandleBase
        }
        var SoundHandleBase: ig.SoundHandleBaseConstructor

        interface SoundHandleWebAudio extends ig.SoundHandleBase {
            _buffer: null | AudioBufferSourceNode
            _volume: number
            _speed: number
            _time: number
            _duration: number
            _offset: number
            _startTime: number
            _nodeSource: null | ig.WebAudioBufferGain
            _nodePosition: PannerNode
            _loop: boolean
            _playing: boolean
            _fadeTimer: number
            _fadeIn: boolean
            _fadeDuration: number
            _contextTimeOnStart: number
            _contextTimeOnPause: number
            
            _setPosition(this: this): void
            play(this: this): void
        }
        interface SoundHandleWebAudioConstructor extends ImpactClass<ig.SoundHandleWebAudio> {
            new (): ig.SoundHandleWebAudio
        }
        var SoundHandleWebAudio: ig.SoundHandleWebAudioConstructor

        interface SoundPlaySettings {
            fadeDuration?: number
            offset?: number
            startTime?: number
            speed?: number
        }

        interface SoundCommon {
            play(this: this, pos?: boolean, settings?: SoundPlaySettings): ig.SoundHandle
        }

        interface SoundManager {
            _solveGroupRequests(this: this, group: { playing: ig.SoundHandleBase[], requests: ig.SoundHandleBase[] }): void
            playSoundHandle(this: this, a: ig.SoundHandleBase, group: { playing: ig.SoundHandleBase[], requests: ig.SoundHandleBase[] }): void
            connectSound(this: this, connectObj: { connect(gain: GainNode): void }): void
        }
    
        namespace SoundHelper {
            function playAtEntity(sound: ig.Sound, entity: ig.Entity, isLooped: boolean, settings: SoundPlaySettings, range?: number, type?: ig.SOUND_RANGE_TYPE): void
        }

        type SoundHandle = ig.SoundHandleWebAudio // | ig.SoundHandleDefault

        enum SOUND_RANGE_TYPE {
            CIRCULAR = 1,
            HORIZONTAL = 2,
            VERTICAL = 3,
        }

        interface Camera extends ig.GameAddon {
            _currentPos: Vec2
            _currentZoomPos: Vec2
            targets: {
                _currentOffset: Vec2
                _currentZoomOffset: Vec2
            }[]
        }
        interface CameraConstructor extends ImpactClass<ig.Camera> {
            new (): ig.Camera
        }
        var Camera: ig.CameraConstructor
        var camera: ig.Camera
    }

    var Constants: {
        BALL_HEIGHT: 12
        BALL_SIZE: 8
        BALL_Z_HEIGHT: 8
    }
}
