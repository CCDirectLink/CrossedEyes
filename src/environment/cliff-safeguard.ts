import { Lang } from '../lang-manager'

declare global {
    namespace ig.ENTITY {
        interface Player {
            crossedeyes_cliffSafeguardVelCancel?: Vec2
        }
    }
}

const id = 'crossedeyes-cliffSafeguard'
let block: boolean = localStorage[`ccuilib-quickmenuwidget-${id}`] == 'true'
nax.ccuilib.QuickRingMenuWidgets.addWidget({
    name: id,
    title: Lang.menu.quickMenu.widgets.cliffSafeguard.title,
    description: Lang.menu.quickMenu.widgets.cliffSafeguard.description,
    pressEvent: button => {
        block = button.isToggleOn()
    },
    toggle: true,
    image: () => ({
        gfx: new ig.Image('media/gui/circuit-icons.png'),
        srcPos: { x: 25, y: 49 },
        pos: { x: 4, y: 4 },
        size: { x: 24, y: 24 },
    }),
})

/** in miliseconds */
let lastVelCancelSet = 0

ig.Physics.inject({
    moveEntityZ(coll, fVel, prevOnGround) {
        if (coll !== ig.game.playerEntity.coll || !block) return this.parent(coll, fVel, prevOnGround)
        const player = coll.entity as ig.ENTITY.Player

        if (lastVelCancelSet + 50 < ig.game.now) {
            lastVelCancelSet = ig.game.now
            player.crossedeyes_cliffSafeguardVelCancel = Vec2.create()
        }

        /* dont worry about it */
        const collData = coll._collData

        const Vec2_length = Vec2.length

        if (prevOnGround && coll.zGravityFactor > 0 /*&& !coll.noSlipping */ && !collData.forceMoveFrameVel && (collData.holeInfo.mapRes == 1 || collData.groundEntry)) {
            if (collData.holeInfo.mapRes == 1 /* && level.collision!.isOverHole(t, q - level.height!, s, v) */) {
                /* dont worry about it */
                Vec2.assignC(coll.accelDir, 0, 0)

                /* dont worry about it */
                Vec2.length = function length(v: Vec2): any {
                    Vec2.mulC(v, 1.5)
                    player.crossedeyes_cliffSafeguardVelCancel = Vec2.create(v)
                    lastVelCancelSet = ig.game.now
                }
            }
        }
        this.parent(coll, fVel, prevOnGround)

        Vec2.length = Vec2_length
    },
})
