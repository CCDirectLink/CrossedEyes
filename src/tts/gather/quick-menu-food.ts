import { Lang } from '../../lang-manager'
import { Opts } from '../../plugin'
import { SpecialAction } from '../../special-action'
import { speakI } from './api'

/* in prestart */
sc.QuickItemMenu.inject({
    onSelection(button) {
        this.parent(button)
        if (Opts.tts && button?.button) {
            speakI(button.button.getButtonText())
            SpecialAction.setListener('LSP', 'quickMenuConsumeableDescription', () => {
                if (sc.quickmodel.isQuickItems()) speakI(button.data.description)
            })

            SpecialAction.setListener('R2', 'quickMenuConsumeableModifiers', () => {
                const id: sc.ItemID = button.data.id
                if (sc.quickmodel.isQuickItems() && sc.inventory.isBuffID(id)) {
                    const buffs = getBuffTexts(id)!
                    const duration = getBuffDuration(id)!
                    const text = Lang.stats.buffTemplate.supplant({ duration, buffs: buffs.join(', ') })
                    speakI(text)
                }
            })
        }
    },
})

function getBuffDuration(id: sc.ItemID): number | undefined {
    return (sc.inventory.items[Number(id)].time || 0) * (sc.newgame.get('double-buff-time') ? 2 : 1)
}

function getBuffTexts(id: sc.ItemID): string[] | undefined {
    const item: sc.Inventory.Item | null = sc.inventory.getItem(id)
    const stats = item?.stats
    if (!stats) return
    return stats
        .filter(stat => !stat.startsWith('HEAL')) /* filter out buffs like HEAL-1, HEAL-2 etc. cuz they return ERROR ERROR (duno why) */
        .map(stat => new sc.QuickBuffEntry(sc.STAT_CHANGE_SETTINGS[stat]).statName.text!.toString())
        .map(buff => buff.replace(/-/g, Lang.misc.minus))
}
