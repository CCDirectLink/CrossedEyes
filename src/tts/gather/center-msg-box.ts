import { interrupt, speakIC } from './api'

/* in prestart */
sc.CenterMsgBoxGui.inject({
    init(...args) {
        this.parent(...args)
        speakIC(this.textGui.text!)
    },
    _close() {
        interrupt()
        return this.parent()
    },
})
