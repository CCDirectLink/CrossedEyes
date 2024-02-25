import { Lang } from '../../lang-manager'
import CrossedEyes, { Opts } from '../../plugin'
import { SpecialAction } from '../../special-action'
import { interrupt, speakI, speakIC } from './api'

import 'nax-ccuilib/src/headers/nax/quick-menu-public-api.d.ts'
import 'nax-ccuilib/src/headers/nax/quick-menu.d.ts'
import 'nax-ccuilib/src/headers/sc/quick-menu.d.ts'

/* in prestart */
sc.QuickMenuModel.inject({
    enterQuickMenu() {
        this.parent()
        speakIC(Lang.menu.quickmenu)
    },
    exitQuickMenu() {
        this.parent()
        /* how is this called in the title screen???? dont know */
        if (sc.model.currentState == sc.GAME_MODEL_STATE.GAME && /* why */ !ig.game.paused) {
            interrupt()
        }
    },
})

sc.RingMenuButton.inject({
    focusGained() {
        this.parent()
        if (!Opts.tts || this.state == sc.QUICK_MENU_STATE.NONE) return

        speakI(this.title)
        SpecialAction.setListener('LSP', 'quickMenuDescription', () => {
            this.focus && speakI(this.data)
        })
    },
})

CrossedEyes.initPoststart.push(() => {
    sc.Model.addObserver<nax.ccuilib.QuickRingMenuWidgets>(nax.ccuilib.QuickRingMenuWidgets, {
        modelChanged(model: nax.ccuilib.QuickRingMenuWidgets, msg: nax.ccuilib.QUICK_MENU_WIDGET_EVENT, data: nax.ccuilib.QuickMenuWidget) {
            if (Opts.tts && model == nax.ccuilib.QuickRingMenuWidgets && msg == nax.ccuilib.QUICK_MENU_WIDGET_EVENT.CLICK && data.name == 'cc-blitzkrieg_puzzleSkip') {
                if (blitzkrieg.sels.puzzle.inSelStack.peek()) {
                    speakI(Lang.misc.puzzleSolved)
                } else {
                    speakI(Lang.misc.notStandingInPuzzle)
                }
            }
        },
    })
})
