import { Opts } from '../plugin'

ig.EVENT_STEP.SET_PLAYER_CORE.inject({
    start() {
        /* disallow disabling quick menu */
        if (Opts.hints && this.core == sc.PLAYER_CORE.QUICK_MENU && this.value == false) {
            return
        }
        this.parent()
    },
})

/* enable the quick menu on preset load (doing this manually for ms solar preset was very annyoing */
sc.SavePreset?.inject({
    load(...args) {
        this.parent(...args)
        setTimeout(() => sc.model.player.setCore(sc.PLAYER_CORE.QUICK_MENU, true), 2000)
    },
})
