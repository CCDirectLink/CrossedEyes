import { TTS, TTSInterface } from './tts'

export class TTSScreenReader implements TTSInterface {
    queue!: TTS['speakQueue']
    increaseQueueId!: () => number


    async init(queue: TTS['speakQueue'], increaseQueueId: () => number) {
        this.queue = queue
        this.increaseQueueId = increaseQueueId

        const gameDiv = document.getElementById('game')!
        gameDiv.setAttribute('aria-live', 'assertive')
    }

    isReady(): boolean {
        return true
    }

    speak(text: string): void {
        // @ts-expect-error
        ig.system.canvas.setAttribute('aria-label', text)
    }
    interrupt(): void { this.speak('') }
}
