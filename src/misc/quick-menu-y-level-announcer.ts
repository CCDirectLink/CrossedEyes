import { Lang } from '../lang-manager'
import { Opts } from '../plugin'
import { speakI } from '../tts/gather/api'

export {}
sc.QuickRingMenu.inject({
    update() {
        this.parent()
        if (!Opts.tts || !sc.quickmodel.isQuickNone()) return
        if (ig.gamepad.isButtonPressed(ig.BUTTONS.SELECT)) {
            speakI(Lang.menu.quickMenu.yLevel.supplant({ y: ig.game.playerEntity.coll.pos.z.floor() }))
        }
    },
})
