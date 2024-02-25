import CrossedEyes from '../plugin'

/* in prestart */

export interface PauseListener {
    pause?(): void
}

function pauseAll() {
    CrossedEyes.isPaused = true
    CrossedEyes.pauseables.forEach(p => p.pause && p.pause())
}
function resumeAll() {
    CrossedEyes.isPaused = false
}

ig.Game.inject({
    setPaused(paused: boolean) {
        this.parent(paused)
        if (paused) {
            pauseAll()
        } else if (!ig.game.events.blockingEventCall) {
            resumeAll()
        }
    },
})
ig.EventManager.inject({
    clear() {
        this.parent()
        resumeAll()
    },
    _startEventCall(event) {
        this.parent(event)
        if (event.runType == ig.EventRunType.BLOCKING) {
            pauseAll()
        }
    },
    _endEventCall(event) {
        const initial = this.blockingEventCall
        this.parent(event)
        if (this.blockingEventCall === null && this.blockingEventCall != initial) {
            resumeAll()
        }
    },
})
