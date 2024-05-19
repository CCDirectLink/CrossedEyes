import { Lang } from '../lang-manager'
import { speakIC } from '../tts/gather/api'

const id = 'crossedeyes-yLevelAnnounce'
nax.ccuilib.QuickRingMenuWidgets.addWidget({
    name: id,
    title: Lang.menu.quickMenu.widgets.yLevel.title,
    description: Lang.menu.quickMenu.widgets.yLevel.description,
    pressEvent: () => {
        speakIC(Lang.menu.quickMenu.widgets.yLevel.announceTemplate.supplant({ y: ig.game.playerEntity.coll.pos.z.floor() }))
    },
    image: () => ({
        gfx: new ig.Image('media/font/colors/hall-fetica-bold-green.png'),
        srcPos: { x: 64, y: 38 },
        pos: { x: 12, y: 12 },
        size: { x: 12, y: 12 },
    }),
})
