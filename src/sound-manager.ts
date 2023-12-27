export function muteHandle(handle: ig.SoundHandleWebAudio, range: number) {
    handle.setFixPosition(Vec3.createC(-1000, -1000, 0), range)
}
export function isHandleMuted(handle: ig.SoundHandleWebAudio) {
    return handle.pos?.point3d == Vec3.createC(-1000, -1000, 0)
}

export function mulSoundVol(s: ig.Sound, mul: number): ig.Sound {
    return new ig.Sound(s.webAudioBuffer.path, s.volume * mul, s.variance, s.group)
}

export type SoundQueueEntry = {
    name: keyof typeof SoundManager.sounds
    wait?: number
    speed?: number
    volume?: number
    condition?: () => boolean
    action?: (played: boolean) => void
} & (
    | {
          relativePos: true
          pos: Vec2
      }
    | {
          relativePos: false
          pos: Vec3
      }
    | {
          relativePos?: undefined
          pos?: Vec3
      }
)

export class SoundManager {
    private static soundQueue: SoundQueueEntry[] = []
    static continiousSounds: Record<string, ig.SoundHandleWebAudio> = {}

    static sounds = {
        wall: 'media/sound/crossedeyes/wall.ogg',
        water: 'media/sound/background/waterfall.ogg',
        hole: 'media/sound/crossedeyes/hole.ogg',
        lower: 'media/sound/crossedeyes/lower.ogg',
        higher: 'media/sound/crossedeyes/higher.ogg',
        land: 'media/sound/crossedeyes/land.ogg',
        entity: 'media/sound/crossedeyes/entity.ogg',
        hint: 'media/sound/crossedeyes/hint.ogg',
        tpr: 'media/sound/crossedeyes/tpr.ogg',
        interactable: 'media/sound/crossedeyes/interactable.ogg',
        interact: 'media/sound/crossedeyes/interact.ogg',

        hitOrganic1: 'media/sound/battle/airon/hit-organic-1.ogg',
        hitOrganic2: 'media/sound/battle/airon/hit-organic-2.ogg',
        hitOrganic3: 'media/sound/battle/airon/hit-organic-3.ogg',
        hitOrganic4: 'media/sound/battle/airon/hit-organic-4.ogg',
    }
    static getElementName(element: sc.ELEMENT): 'neutralMode' | 'coldMode' | 'heatMode' | 'waveMode' | 'shockMode' {
        switch (element) {
            case sc.ELEMENT.NEUTRAL:
                return 'neutralMode'
            case sc.ELEMENT.HEAT:
                return 'heatMode'
            case sc.ELEMENT.COLD:
                return 'coldMode'
            case sc.ELEMENT.SHOCK:
                return 'shockMode'
            case sc.ELEMENT.WAVE:
                return 'waveMode'
        }
    }

    constructor() {
        /* in prestart */
        ig.Game.inject({
            preloadLevel(mapName) {
                ig.soundManager.reset() /* vanilla bug fix?? fixes issues with hint sounds persisting after death */
                this.parent(mapName)
            },
        })
        let i = 0
        ig.SoundManager.inject({
            update() {
                this.parent()
                if ((i += ig.system.ingameTick) > 10) {
                    i = 0
                    SoundManager.cleanupDeadSounds()
                }
            },
        })
        this.preloadSounds()
    }
    private preloadSounds() {
        Object.values(SoundManager.sounds).forEach(str => new ig.Sound(str))
    }

    static cleanupDeadSounds() {
        ig.soundManager.soundStack = ig.soundManager.soundStack.map(e => e.filter(h => h._playing || h._buffer))
    }

    static playSoundPath(path: string, speed: number, volume: number = 1, pos?: Vec3): ig.SoundHandleWebAudio {
        const sound = new ig.Sound(path, volume)
        const handle: ig.SoundHandleWebAudio = sound.play(false, {
            speed,
        })
        pos && handle.setFixPosition(pos, 100 * 16)
        return handle
    }

    static playSound(name: keyof typeof SoundManager.sounds, speed: number, volume?: number, pos?: Vec3): ig.SoundHandleWebAudio {
        return SoundManager.playSoundPath(SoundManager.sounds[name], speed, volume, pos)
    }

    static playSoundAtRelative(name: keyof typeof SoundManager.sounds, speed: number, volume: number, pos: Vec2): ig.SoundHandleWebAudio {
        const soundPosVec2: Vec2 = Vec2.create(pos)
        Vec2.add(soundPosVec2, ig.game.playerEntity.coll.pos)
        const soundPos: Vec3 = Vec3.createC(soundPosVec2.x, soundPosVec2.y, ig.game.playerEntity.coll.pos.z)

        return SoundManager.playSound(name, speed, volume, soundPos)
    }

    static appendQueue(queue: SoundQueueEntry[]) {
        const isPlaying: boolean = SoundManager.soundQueue.length != 0
        this.soundQueue.push(...queue)
        if (!isPlaying) {
            SoundManager.playQueueEntry(this.soundQueue[0], SoundManager.soundQueue)
        }
    }

    static clearQueue() {
        SoundManager.soundQueue = []
    }

    static playQueueEntry(e: SoundQueueEntry, queue: SoundQueueEntry[]) {
        if (!e || queue.length === 0) {
            return
        }

        const action = () => {
            const play: boolean = e.condition ? e.condition() : true
            if (play) {
                if (e.relativePos) {
                    SoundManager.playSoundAtRelative(e.name, e.speed ?? 1, e.volume ?? 1, e.pos)
                } else {
                    SoundManager.playSound(e.name, e.speed ?? 1, e.volume ?? 1, e.pos)
                }
            }
            e.action && e.action(play)
            queue.shift()
            if (queue.length === 0) {
                return
            }
            SoundManager.playQueueEntry(queue[0], queue)
        }

        if (e.wait === undefined || e.wait === 0) {
            action()
        } else {
            setTimeout(action, e.wait)
        }
    }

    static playContiniousSound(id: string, soundName: keyof typeof SoundManager.sounds, speed: number = 1, volume?: number, pos?: Vec3): ig.SoundHandleWebAudio {
        if (this.continiousSounds[id]) {
            this.continiousSounds[id].stop()
        }
        return (this.continiousSounds[id] = pos ? SoundManager.playSound(soundName, speed, volume, pos) : SoundManager.playSound(soundName, speed, volume))
    }

    static stopContiniousSound(id: string) {
        if (this.continiousSounds[id]) {
            this.continiousSounds[id].stop()
            delete this.continiousSounds[id]
        }
    }

    static isContiniousSoundPlaying(id: string): boolean {
        return !!this.continiousSounds[id]
    }
}
