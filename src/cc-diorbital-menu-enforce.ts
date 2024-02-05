import { getIdFromRingPos } from 'cc-diorbital-menu/src/quick-menu-extension'
import { Opts } from './plugin'

export class CCDiorbitalMenuEnforce {
    static update() {
        sc.QuickRingMenuWidgets.lockLayout = Opts.lockDiorbitalMenu
        if (sc.QuickRingMenuWidgets.lockLayout) {
            sc.QuickRingMenuWidgets.ringConfiguration = {
                [getIdFromRingPos(0, 0)]: '11_items',
                [getIdFromRingPos(0, 2)]: '11_analyze',
                [getIdFromRingPos(0, 4)]: '11_party',
                [getIdFromRingPos(0, 6)]: '11_map',
                [getIdFromRingPos(0, 7)]: 'cc-blitzkrieg_puzzleSkip',
            }
        }
    }
}
