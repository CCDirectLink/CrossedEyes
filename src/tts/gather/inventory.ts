import { Lang } from '../../lang-manager'
import { Opts } from '../../options'
import { SpecialAction } from '../../special-action'
import { interrupt, speakI } from './api'

export {}

sc.ItemBoxButton.inject({
    focusGained() {
        this.parent()
        if (!Opts.tts) return
        speakI(this.button.text!.toString())
        SpecialAction.setListener('LSP', 'inventoryItemDescription', () => speakI(this.data.description))

        const id: sc.ItemID = this.data.id
        if (Number(id) > 0 && sc.inventory.isBuffID(id)) {
            SpecialAction.setListener('R2', 'quickMenuConsumeableModifiers', () => {
                const buffs = getBuffTexts(id)!
                const duration = getBuffDuration(id)!
                const text = Lang.stats.buffTemplate.supplant({ duration, buffs: buffs.join(', ') })
                speakI(text)
            })
        }
    },
    focusLost() {
        this.parent()
        interrupt()
        if (!Opts.tts) return
        SpecialAction.setListener('LSP', 'inventoryItemDescription', () => {})
        SpecialAction.setListener('R2', 'quickMenuConsumeableModifiers', () => {})
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
