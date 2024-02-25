import { Lang } from '../../lang-manager'
import CrossedEyes, { Opts } from '../../plugin'
import { speak } from './api'

/* in prestart */
const recivedItemRecord: Record<sc.ItemID, number> = {}

sc.ItemHudBox.inject({
    update() {
        this.parent()
        for (const id in recivedItemRecord) {
            let itemName = new sc.ItemContent(id).textGui.text!.toString().trim()
            if (itemName.endsWith('x')) itemName = itemName.slice(0, itemName.length - 1)
            const item = sc.inventory.items[parseInt(id)]
            const rarity = Lang.menu.itemRarityMap[Object.entries(sc.ITEMS_RARITY).find(e => e[1] == item.rarity)![0] as keyof typeof sc.ITEMS_RARITY]
            const type = Lang.menu.itemTypesMap[Object.entries(sc.ITEMS_TYPES).find(e => e[1] == item.type)![0] as keyof typeof sc.ITEMS_TYPES]
            const count = recivedItemRecord[id]
            if (count == 1) {
                speak(Lang.menu.oneItemRecivedTemplate.supplant({ itemName, rarity, type }))
            } else {
                speak(Lang.menu.multipleItemsRecivedTemplate.supplant({ itemName, count, rarity, type }))
            }
            delete recivedItemRecord[id]
        }
    },
})

CrossedEyes.initPoststart.push(() => {
    sc.Model.addObserver<sc.PlayerModel>(sc.model.player, {
        modelChanged(model: sc.Model, msg: sc.PLAYER_MSG, data: sc.PLAYER_MSG_ITEM_OBTAINED_DATA) {
            if (Opts.tts && model == sc.model.player && !sc.model.isCutscene() && msg == sc.PLAYER_MSG.ITEM_OBTAINED) {
                recivedItemRecord[data.id] ??= 0
                recivedItemRecord[data.id] += data.amount
            }
        },
    })
})
