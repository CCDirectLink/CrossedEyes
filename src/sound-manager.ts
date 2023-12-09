import { isAiming } from './environment/puzzle'

export function turnOffHandle(handle: ig.SoundHandleWebAudio, range: number) {
    handle.setFixPosition(Vec3.createC(-1000, -1000, 0), range)
}
export function isHandleOff(handle: ig.SoundHandleWebAudio) {
    return handle.pos?.point3d == Vec3.createC(-1000, -1000, 0)
}

export type SoundQueueEntry = {
    name: keyof typeof SoundManager.sounds
    wait?: number
    speed?: number
    volume?: number
    condition?: () => boolean
    action?: (played: boolean) => void
} & ({
    relativePos: true
    pos: Vec2
} | {
    relativePos: false
    pos: Vec3
} | {
    relativePos?: undefined
    pos?: Vec3
})

export class SoundManager {
    private static soundQueue: SoundQueueEntry[] = []
    static continiousSounds: Record<string, ig.SoundHandleWebAudio> = {}

    static sounds = {
        countdown1: 'media/sound/misc/countdown-1.ogg',
        countdown2: 'media/sound/misc/countdown-2.ogg',
        computerBeep: 'media/sound/misc/computer-beep-success.ogg',
        trainCudeHide: 'media/sound/environment/train-cube-hide.ogg',
        botSuccess: 'media/sound/puzzle/bot-success.ogg',
        counter: 'media/sound/puzzle/counter.ogg',
        // botFailure: 'media/sound/puzzle/bot-failure.ogg',
        neutralMode: 'media/sound/move/neutral-mode.ogg',
        coldMode: 'media/sound/move/cold-mode.ogg',
        heatMode: 'media/sound/move/heat-mode.ogg',
        waveMode: 'media/sound/move/wave-mode.ogg',
        shockMode: 'media/sound/move/shock-mode.ogg',
        hitCounterEcho: 'media/sound/battle/hit-counter-echo.ogg',

        wall: 'media/sound/crossedeyes/wall.ogg',
        water: 'media/sound/background/waterfall.ogg',
        hole: 'media/sound/crossedeyes/hole.ogg',
        lower: 'media/sound/crossedeyes/lower.ogg',
        higher: 'media/sound/crossedeyes/higher.ogg',
        land: 'media/sound/crossedeyes/land.ogg',
        entity: 'media/sound/crossedeyes/entity.ogg',
        hint: 'media/sound/crossedeyes/hint.ogg',
        tpr: 'media/sound/crossedeyes/tpr.ogg',
        npc: 'media/sound/crossedeyes/npc.ogg',
    }
    static getElementName(element: sc.ELEMENT): 'neutralMode' | 'coldMode' | 'heatMode' | 'waveMode' | 'shockMode' {
        switch(element) {
            case sc.ELEMENT.NEUTRAL: return 'neutralMode'
            case sc.ELEMENT.HEAT: return 'heatMode'
            case sc.ELEMENT.COLD: return 'coldMode'
            case sc.ELEMENT.SHOCK: return 'shockMode'
            case sc.ELEMENT.WAVE: return 'waveMode'
        }
    }

    static preloadSounds() {
        Object.values(SoundManager.sounds).forEach(str => new ig.Sound(str))
    }
    static playSoundPath(path: string, speed: number, volume: number = 1, pos?: Vec3): ig.SoundHandleWebAudio {
        const sound = new ig.Sound(path, volume)
        const handle: ig.SoundHandleWebAudio = sound.play(false, {
            speed
        })
        pos && handle.setFixPosition(pos, 100*16)
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
        if (! isPlaying) {
            SoundManager.playQueueEntry(this.soundQueue[0], SoundManager.soundQueue)
        }
    }

    static clearQueue() { SoundManager.soundQueue = [] }

    static playQueueEntry(e: SoundQueueEntry, queue: SoundQueueEntry[]) {
        if (!e || queue.length === 0) { return }

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
            if (queue.length === 0) { return }
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
        return this.continiousSounds[id] = pos ?
            SoundManager.playSound(soundName, speed, volume, pos) :
            SoundManager.playSound(soundName, speed, volume)
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

export class PuzzleSounds {
    static puzzleSolved() {
        SoundManager.clearQueue()
        SoundManager.appendQueue([
            {            name: 'botSuccess' },
            { wait: 20,  name: 'counter' },
            { wait: 150, name: 'botSuccess' },
        ])
    }

    static moveGuide(speed: number, pos: Vec3) {
        SoundManager.playSound('trainCudeHide', speed, 1, pos)
    }

    static moveLockin(pos: Vec3, action: () => void) {
        SoundManager.appendQueue([
            {            name: 'countdown1', pos, speed: 1.2, },
            { wait: 150, name: 'countdown2', pos, speed: 1.2, action },
        ])
    }
    static moveLockout(pos: Vec3, action: () => void) {
        SoundManager.appendQueue([
            {            name: 'countdown2', pos, speed: 1.2, },
            { wait: 150, name: 'countdown1', pos, speed: 1.2, action },
        ])
    }

    static moveWaitFinished() {
        SoundManager.clearQueue()
        SoundManager.appendQueue([
            {            name: 'botSuccess' },
        ])
    }
    

    static aimLockin(pos: Vec2, element: sc.ELEMENT, action: () => void) {
        SoundManager.appendQueue([
            {            name: 'countdown1', relativePos: true, pos },
            { wait: 200, name: 'countdown2', relativePos: true, pos },
            { wait: 100, name: SoundManager.getElementName(element), speed: 1.2, action,
                condition: () => isAiming() && element !== sc.model.player.currentElementMode,
            }
        ])
    }

    static aimLockout(pos: Vec2, action: () => void) {
        SoundManager.clearQueue()
        SoundManager.appendQueue([
            {            name: 'countdown2', relativePos: true, pos },
            { wait: 200, name: 'countdown1', relativePos: true, pos, action },
        ])
    }

    static aimGuide(speed: number, pos: Vec2) {
        SoundManager.playSoundAtRelative('computerBeep', speed, 1, pos)
    }

    static shootNow(wait: number, lockinCheck: () => boolean, shotCount?: number): number {
        const entry: SoundQueueEntry = { wait, name: 'hitCounterEcho', speed: 1.1, condition: lockinCheck }
        const queue: SoundQueueEntry[] = [ entry ]
        const waitBetweenSounds: number = 100
        let ret: number = 0
        if (shotCount) {
            ret = shotCount + 1
            for (let i = 0; i < shotCount; i++) {
                const ne = { ...entry }
                ne.wait = waitBetweenSounds
                queue.push(ne)
            }
        }

        SoundManager.appendQueue(queue)
        return ret
    }
}
