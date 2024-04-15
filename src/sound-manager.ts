import { PauseListener } from './misc/menu-pause'
import CrossedEyes from './plugin'

declare global {
    namespace ig {
        interface SoundHandleBase {
            pos: null | {
                point: Vec2
                point3d: Vec3 /* only thing modified */
                entity: ig.Entity | null
                align: ig.ENTITY_ALIGN | null
                offset: null
                range: number
                rangeType: ig.SOUND_RANGE_TYPE
            }
            dontPauseInQuickAnalysis?: boolean
            path: string
        }
        interface SoundWebAudio {
            origVolume?: number
        }

        // @ts-expect-error
        type SoundHandle = ig.SoundHandleWebAudio // | ig.SoundHandleDefault
        // @ts-expect-error
        type Sound = ig.SoundWebAudio
        // @ts-expect-error
        type SoundConstructor = SoundWebAudioConstructor
        // @ts-expect-error
        var Sound: SoundConstructor
    }
}

export namespace SoundManager {
    export type ContiniousSettings = {
        condition?: () => boolean
    } & (
        | {
              paths: Sounds[]
              getVolume?: () => number
              range?: number
              handle?: ig.SoundHandleWebAudio
          }
        | {
              eventSteps: ig.EventStepBase.Settings[]
              eventCall?: ig.EventCall
          }
    ) &
        (
            | {
                  changePitchWhenBehind: true
                  angle?: number
                  pathsBehind: Sounds[]
              }
            | { changePitchWhenBehind?: false }
        )

    export type Sounds = keyof typeof SoundManager.sounds
}

export class SoundManager implements PauseListener {
    static continious: Record<string, SoundManager.ContiniousSettings> = {}
    static continiousCleanupFilters: string[] = []

    static sounds = {
        wall: 'media/sound/crossedeyes/wall.ogg',
        wallLP: 'media/sound/crossedeyes/lowerpitch/wall.ogg',
        water: 'media/sound/background/waterfall.ogg',
        waterLP: 'media/sound/crossedeyes/lowerpitch/waterfall.ogg',
        hole: 'media/sound/crossedeyes/hole.ogg',
        holeLP: 'media/sound/crossedeyes/lowerpitch/hole.ogg',
        lower: 'media/sound/crossedeyes/lower.ogg',
        lowerLP: 'media/sound/crossedeyes/lowerpitch/lower.ogg',
        higher: 'media/sound/crossedeyes/higher.ogg',
        higherLP: 'media/sound/crossedeyes/lowerpitch/higher.ogg',
        land: 'media/sound/crossedeyes/land.ogg',
        landLP: 'media/sound/crossedeyes/lowerpitch/land.ogg',
        entity: 'media/sound/crossedeyes/entity.ogg',
        entityLP: 'media/sound/crossedeyes/lowerpitch/entity.ogg',
        hint: 'media/sound/crossedeyes/hint.ogg',
        hintLP: 'media/sound/crossedeyes/lowerpitch/hint.ogg',
        tpr: 'media/sound/crossedeyes/tpr.ogg',
        interactable: 'media/sound/crossedeyes/interactable.ogg',
        interact: 'media/sound/crossedeyes/interact.ogg',

        hitOrganic1: 'media/sound/battle/airon/hit-organic-1.ogg',
        hitOrganic2: 'media/sound/battle/airon/hit-organic-2.ogg',
        hitOrganic3: 'media/sound/battle/airon/hit-organic-3.ogg',
        hitOrganic4: 'media/sound/battle/airon/hit-organic-4.ogg',
        bounce1: 'media/sound/battle/ball-bounce-1.ogg',
        bounce2: 'media/sound/battle/ball-bounce-2.ogg',
        bounce3: 'media/sound/battle/ball-bounce-3.ogg',

        // sound glossary stuff
        dash: 'media/sound/battle/dash-3.ogg',
        soundglossaryJump: 'media/sound/crossedeyes/soundglossary/jump.ogg',
        soundglossaryWallbump: 'media/sound/crossedeyes/soundglossary/wallbump.ogg',
        soundglossaryMeele: 'media/sound/crossedeyes/soundglossary/meele.ogg',
        levelup: 'media/sound/battle/level-up.ogg',
        switchToggle: 'media/sound/puzzle/switch-activate-2.ogg',
        barrierGoUp: 'media/sound/puzzle/barrier-up.ogg',
        barrierGoDown: 'media/sound/puzzle/barrier-down.ogg',
        menuBlocked: 'media/sound/menu/menu-blocked.ogg',
    } as const

    constructor() {
        /* in prestart */
        CrossedEyes.pauseables.push(this)
        ig.Game.inject({
            preloadLevel(mapName) {
                // ig.soundManager.reset() /* vanilla bug fix?? fixes issues with hint sounds persisting after death */
                this.parent(mapName)

                for (const id in SoundManager.continious) {
                    for (const filter of SoundManager.continiousCleanupFilters) {
                        if (id.startsWith(filter)) {
                            SoundManager.purgeContinious(id)
                            break
                        }
                    }
                }
            },
        })
        // let i = 0
        // ig.SoundManager.inject({
        //     update() {
        //         this.parent()
        //         if ((i += ig.system.ingameTick) > 10) {
        //             i = 0
        //             SoundManager.cleanupDeadSounds()
        //         }
        //     },
        // })
        /* preload sounds */
        Object.values(SoundManager.sounds).forEach(path => new ig.Sound(path))

        /* name sounds that are run in continious sound event steps */
        let nameNextSound: string | undefined
        ig.SoundWebAudio.inject({
            play(pos, settings) {
                const handle = this.parent(pos, settings)
                if (nameNextSound) {
                    ig.soundManager.addNamedSound(nameNextSound, handle)
                    nameNextSound = undefined
                }
                return handle
            },
        })
        ig.EVENT_STEP.PLAY_SOUND.inject({
            start() {
                if (this.name?.startsWith('crossedeyes')) nameNextSound = this.name
                this.parent()
            },
        })
    }

    pause(): void {
        for (const id in SoundManager.continious) {
            SoundManager.stopCondinious(id)
        }
    }

    static muliplySoundVol(s: ig.Sound, mul: number): ig.Sound {
        return new ig.Sound(s.webAudioBuffer.path, s.volume * mul, s.variance, s.group)
    }

    private static stopHandle(h?: ig.SoundHandleWebAudio) {
        if (h) {
            h._fadeIn = false
            h._loop = false
            h.stop()
            h._disconnect()
        }
    }

    static playSoundPath(path: string, speed: number, volume: number = 1, pos?: Vec3): ig.SoundHandleWebAudio {
        const sound = new ig.Sound(path, volume)
        const handle: ig.SoundHandleWebAudio = sound.play(false, {
            speed,
        })
        pos && handle.setFixPosition(pos, 100 * 16)
        return handle
    }

    static playSound(name: SoundManager.Sounds, speed: number, volume?: number, pos?: Vec3): ig.SoundHandleWebAudio {
        return SoundManager.playSoundPath(SoundManager.sounds[name], speed, volume, pos)
    }

    private static getContiniousEventName(id: string) {
        return `crossedeyes_continious${id}`
    }

    static handleContiniousEntry(
        id: string,
        pos: Vec3,
        range: number | undefined,
        pathId: number,
        dir?: Vec2,
        face: Vec2 = ig.game.playerEntity.face,
        disableBackFacing: boolean = false
    ): boolean {
        const entry = SoundManager.continious[id]
        if (!entry) return false

        if (entry.condition && !entry.condition()) {
            SoundManager.stopCondinious(id)
            return false
        }

        if ('paths' in entry) {
            let handle = entry.handle
            let name: SoundManager.Sounds = entry.paths[pathId]
            let preserveOffset: boolean = false

            if (entry.changePitchWhenBehind && !disableBackFacing) {
                const playerFaceAngle: number = (Vec2.clockangle(face) * 180) / Math.PI

                const dirFaceAngle: number = (Vec2.clockangle(dir!) * 180) / Math.PI
                const angleDist: number = Math.min(Math.abs(playerFaceAngle - dirFaceAngle), 360 - Math.abs(playerFaceAngle - dirFaceAngle))
                const isBehind = angleDist >= (entry.angle ?? 100)
                if (isBehind) {
                    name = entry.pathsBehind[pathId]
                    preserveOffset = true
                }
            }
            const path = SoundManager.sounds[name]
            if (entry.getVolume === undefined) throw new Error('volume is unset')
            const volume = entry.getVolume()

            let soundChanged: boolean = false
            if (handle?.path != path) {
                soundChanged = true
                let offset
                if (preserveOffset && handle?._nodeSource) {
                    offset = (handle._nodeSource.context.currentTime - handle._contextTimeOnStart) % handle._duration
                }
                SoundManager.stopHandle(handle)
                handle = entry.handle = new ig.Sound(path, volume > 0 ? volume : Number.MIN_VALUE).play(true, { offset })
            }
            if (handle?._nodeSource) {
                handle._nodeSource.gainNode.gain.value = volume * sc.options.get('volume-sound')
            }

            if (!handle?.pos || !Vec3.equal(handle.pos.point3d, pos)) {
                range ??= entry.range
                if (range === undefined) throw new Error('range unset')
                handle?.setFixPosition(pos, range)
            }

            return soundChanged
        } else {
            if (!entry.eventCall) {
                const eventName = this.getContiniousEventName(id)
                const steps = entry.eventSteps.map(step => {
                    if (step.type == 'PLAY_SOUND') return { ...step, name: eventName }
                    return step
                })

                const event = new ig.Event({ name: eventName, steps })
                const eventCall = ig.game.events.callEvent(event, ig.EventRunType.PARALLEL, null, () => (entry.eventCall = undefined))
                eventCall.pauseParallel = true
                entry.eventCall = eventCall
            }
        }

        return false
    }

    static stopCondinious(id: string): boolean {
        const entry = SoundManager.continious[id]
        if (!entry) return false
        if ('paths' in entry) {
            if (entry.handle) {
                SoundManager.stopHandle(entry.handle)
                entry.handle = undefined
                return true
            } else return false
        } else {
            if (entry.eventCall) {
                /* stop the damn event */
                entry.eventCall.stack = [{ vars: {}, currentStep: null, stepData: [], event: { rootStep: null as any } as any }]
                entry.eventCall.setDone()
                ig.soundManager.stopNamedSounds(this.getContiniousEventName(id))
                return true
            } else return false
        }
    }

    static purgeContinious(id: string) {
        if (SoundManager.continious[id]) {
            SoundManager.stopCondinious(id)
            delete SoundManager.continious[id]
        }
    }

    static getAngleVecToPlayer(e: ig.Entity): Vec2 {
        const diffPos: Vec2 = e.getAlignedPos(ig.ENTITY_ALIGN.CENTER)
        Vec2.sub(diffPos, ig.game.playerEntity.getAlignedPos(ig.ENTITY_ALIGN.CENTER))
        return Vec2.normalize(diffPos)
    }

    static pickContiniousSettingsPath(sett: SoundManager.ContiniousSettings, index: number): SoundManager.ContiniousSettings {
        if (!('paths' in sett)) throw new Error('invalid pickContiniousSettingsPath settings: paths not included')
        const obj: SoundManager.ContiniousSettings = { ...sett, paths: [sett.paths[index]] }
        if (obj.changePitchWhenBehind) {
            obj.pathsBehind = [obj.pathsBehind[index]]
        }
        return obj
    }
}
