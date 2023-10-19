export type SoundQueueEntry = {
    name: keyof typeof SoundManager.sounds
    wait?: number
    speed?: number
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
    static playSoundPath(path: string, speed: number, pos?: Vec3) {
        const sound = new ig.Sound(path)
        const handle = sound.play(false, {
            speed
        })
        pos && handle.setFixPosition(pos, 100*16)
    }

    static playSound(name: keyof typeof SoundManager.sounds, speed: number, pos?: Vec3) {
        SoundManager.playSoundPath(SoundManager.sounds[name], speed, pos)
    }
    
    static playSoundAtRelative(name: keyof typeof SoundManager.sounds, speed: number, pos: Vec2) {
        const soundPosVec2: Vec2 = Vec2.create(pos)
        Vec2.add(soundPosVec2, ig.game.playerEntity.coll.pos)
        const soundPos: Vec3 = Vec3.createC(soundPosVec2.x, soundPosVec2.y, ig.game.playerEntity.coll.pos.z)
        
        SoundManager.playSound(name, speed, soundPos)
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
                    SoundManager.playSoundAtRelative(e.name, e.speed ?? 1, e.pos)
                } else {
                    SoundManager.playSound(e.name, e.speed ?? 1, e.pos)
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
}
