import { Opts } from '../options'
import type {} from 'nax-ccuilib/src/ui/quick-menu/quick-menu-extension'
import type { Opts as CCUILibOptsType } from 'nax-ccuilib/src/options'
import type { Opts as CCModManagerOptsType } from 'ccmodmanager/types/options'

export function updateQuickRingMenuLayoutLock() {
    const CCModManagerOpts = modmanager.options['ccmodmanager'] as typeof CCModManagerOptsType
    CCModManagerOpts.manualEnforcerRead = {
        ...CCModManagerOpts.manualEnforcerRead,
        'CCUILib-quickmenu': true,
    }

    const CCUILibOpts = modmanager.options['nax-ccuilib'] as typeof CCUILibOptsType
    CCUILibOpts.lockLayout = Opts.lockDiorbitalMenu

    if (CCUILibOpts.lockLayout) {
        CCUILibOpts.ringConfiguration = {
            0: '11_items',
            1: 'crossedeyes-yLevelAnnounce',
            2: '11_analyze',
            4: '11_party',
            6: '11_map',
            7: 'crossedeyes-cliffSafeguard',
            1000: 'crossedeyes-aimAnalysis',
            1002: 'crossedeyes-wallScan',
            1012: 'cc-blitzkrieg_puzzleSkip',
            1014: 'crossedeyes-aimBounce',
        }
    }
}
