import { Lang } from '../../lang-manager'
import { Opts } from '../../options'
import CrossedEyes from '../../plugin'
import { SpecialAction } from '../../special-action'
import { interrupt, speakI, speakIC } from './api'

import type {} from 'nax-ccuilib/src/ui/quick-menu/quick-menu-extension'

/* in prestart */
sc.QuickMenu.inject({
    _enterMenu() {
        speakIC(Lang.menu.quickMenu.name)
        this.parent()
    },
    _exitMenu() {
        if (this.ringmenu?.hook?.currentStateName == 'DEFAULT') interrupt()
        this.parent()
    },
})

sc.RingMenuButton.inject({
    focusGained() {
        this.parent()
        if (!Opts.tts) return

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
