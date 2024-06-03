import { Lang } from '../../lang-manager'
import { isQuickMenuManualVisible } from '../../manuals/quick-menu-all'
import { Opts } from '../../options'
import { speakIC } from '../../tts/gather/api'
import { HintSystem } from '../hint-system'

sc.QuickMenuAnalysis.inject({
    update(...args) {
        if (sc.quickmodel.isQuickCheck() && Opts.hints && !isQuickMenuManualVisible()) {
            let filterAdd = ig.gamepad.isButtonPressed(ig.BUTTONS.DPAD_LEFT) ? -1 : ig.gamepad.isButtonPressed(ig.BUTTONS.DPAD_RIGHT) ? 1 : 0
            if (filterAdd) {
                HintSystem.g.filterIndex += filterAdd
                HintSystem.g.updateFilter()
                speakIC(`${HintSystem.g.filterList[HintSystem.g.filterIndex]}`)
            } else if (ig.gamepad.isButtonPressed(ig.BUTTONS.DPAD_UP)) {
                speakIC(`${Lang.hints.hintFilter}: ${HintSystem.g.filterList[HintSystem.g.filterIndex]}`)
            } else if (ig.gamepad.isButtonPressed(ig.BUTTONS.DPAD_DOWN)) {
                HintSystem.g.filterInSelection = !HintSystem.g.filterInSelection
                speakIC(HintSystem.g.filterInSelection ? Lang.hints.selectionFilterOn : Lang.hints.selectionFilterOff)
                HintSystem.g.updateFilter()
            }
        }
        return this.parent(...args)
    },
})
