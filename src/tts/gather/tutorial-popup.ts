import { speakIC } from './api'

/* in prestart */
sc.TutorialMarkerGui.inject({
    init(x, y, width, height, text, direction, connectPos, stopTime, doneCallback) {
        this.parent(x, y, width, height, text, direction, connectPos, stopTime, doneCallback)
        speakIC(text)
    },
})
