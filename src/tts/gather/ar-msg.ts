import { speakIC } from './api'

/* in prestart */
ig.EVENT_STEP.SHOW_AR_MSG.inject({
    start(...args) {
        speakIC(this.text)
        return this.parent(...args)
    },
})
