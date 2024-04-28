import { isQuickMenuManualVisible } from '../../manuals/quick-menu-all'
import { Opts } from '../../plugin'
import { HintSystem, HintUnion } from '../hint-system'

function selectNextHint(add: number) {
    const pPos: Vec3 = ig.game.playerEntity.getAlignedPos(ig.ENTITY_ALIGN.CENTER)
    const sorted: HintUnion[] = (HintSystem.g.sorted = HintSystem.g.quickMenuAnalysisInstance.entities
        .filter(e => e)
        .sort(
            (a, b) =>
                /* prettier-ignore */
                Vec2.distance(a.entity.getAlignedPos(ig.ENTITY_ALIGN.CENTER), pPos) -
                    Vec2.distance(b.entity.getAlignedPos(ig.ENTITY_ALIGN.CENTER), pPos)
        ) as HintUnion[])

    HintSystem.g.currentSelectIndex += add
    if (HintSystem.g.currentSelectIndex == sorted.length) {
        HintSystem.g.currentSelectIndex = 0
    } else if (HintSystem.g.currentSelectIndex < 0) {
        HintSystem.g.currentSelectIndex = sorted.length - 1
    }
    const entry: HintUnion = sorted[HintSystem.g.currentSelectIndex]

    if (entry) {
        HintSystem.g.focusMode = true
        sc.quickmodel.cursorMoved = true
        sc.quickmodel.cursor = Vec2.createC(entry.hook.pos.x + entry.hook.size.x / 2, entry.hook.pos.y + entry.hook.size.y / 2)
        HintSystem.g.quickMenuAnalysisInstance.cursor.moveTo(sc.quickmodel.cursor.x, sc.quickmodel.cursor.y, true)

        HintSystem.g.prevEntry && HintSystem.g.prevEntry.focusLost()
        HintSystem.g.prevEntry = entry
    }
}

sc.QuickMenuAnalysis.inject({
    update(...args) {
        if (sc.quickmodel.isQuickCheck() && Opts.hints && !isQuickMenuManualVisible()) {
            let add = ig.gamepad.isButtonPressed(ig.BUTTONS.LEFT_SHOULDER) ? -1 : ig.gamepad.isButtonPressed(ig.BUTTONS.RIGHT_SHOULDER) ? 1 : 0
            if (add != 0) {
                selectNextHint(add)
            }
        }
        return this.parent(...args)
    },
})

sc.QuickMenuTypesBase.inject({
    isMouseOver() {
        if (
            Opts.hints &&
            sc.quickmodel.isQuickCheck() &&
            !ig.interact.isBlocked() &&
            this.focusable &&
            sc.quickmodel.isDeviceSynced() &&
            ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD &&
            !sc.quickmodel.cursorMoved &&
            HintSystem.g.focusMode &&
            HintSystem.g.sorted.indexOf(this) != HintSystem.g.currentSelectIndex
        ) {
            return false
        }
        return this.parent()
    },
})
