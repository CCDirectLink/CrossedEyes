import { Opts } from '../options'

export function updateIdlePose() {
    if (Opts.disableIdlePose) {
        disableIdlePose()
    } else {
        ig.game?.playerEntity?.initIdleActions()
    }
}

function disableIdlePose() {
    if (ig.game?.playerEntity?.idle?.actions) {
        ig.game.playerEntity.idle.actions = []
    }
}

export function injectIdlePosDisable() {
    ig.ENTITY.Player.inject({
        initIdleActions() {
            if (Opts.disableIdlePose) {
                disableIdlePose()
                return
            }
            return this.parent()
        },
    })
}
