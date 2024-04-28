import { Lang } from '../../lang-manager'
import { isQuickMenuManualVisible } from '../../manuals/quick-menu-all'
import { Opts } from '../../plugin'
import { speakIC } from '../../tts/gather/api'
import { AimAnalyzer, isAiming } from '../aim-analyze'
import { HintSystem } from '../hint-system'

function checkHintTogglePressed() {
    if (ig.gamepad.isButtonPressed(ig.BUTTONS.FACE2 /* x */) && !isQuickMenuManualVisible()) {
        if (HintSystem.g.focusedHE) {
            const foundHEI = HintSystem.g.selectedHE.findIndex(e => e.uuid == HintSystem.g.focusedHE!.uuid)
            if (foundHEI != -1) {
                HintSystem.g.selectedHE.splice(foundHEI, 1)
                speakIC(Lang.hints.unselected)
            } else {
                HintSystem.g.activateHint(HintSystem.g.focusedHE, false)
            }
        }
    }
}

ig.ENTITY.Player.inject({
    update() {
        this.parent()
        if (!Opts.hints) return
        if (AimAnalyzer.g.aimAnalyzeOn && isAiming()) {
            checkHintTogglePressed()
        }
    },
})

sc.QuickMenuAnalysis.inject({
    update(...args) {
        if (sc.quickmodel.isQuickCheck() && Opts.hints && !isQuickMenuManualVisible()) {
            checkHintTogglePressed()
        }
        return this.parent(...args)
    },
})
