import { Lang } from '../lang-manager'
import { Opts } from '../plugin'
import { speakI } from '../tts/gather/api'
import { HintSystem } from './hint-system'

declare global {
    namespace ig {
        interface Entity {
            isPlayerStandingOnMe?: boolean
        }
    }
}

function groundEntrySet(e: ig.Entity) {
    if (Opts.tts) {
        const hint = HintSystem.g.getHintFromEntity(e)
        if (hint && hint instanceof sc.QUICK_MENU_TYPES.Hints && !hint.nameGui.hintClass?.disableWalkedOn) {
            const title = Lang.hints.walkedOntoTemplate.supplant({
                rest: hint.nameGui.getText()[0],
            })
            speakI(title)
        }
    }
    e.isPlayerStandingOnMe = true
}

function groundEntryUnset(e: ig.Entity) {
    e.isPlayerStandingOnMe = false
    if (!Opts.tts) return
    const hint = HintSystem.g.getHintFromEntity(e)
    if (hint && hint instanceof sc.QUICK_MENU_TYPES.Hints && !hint.nameGui.hintClass?.disableWalkedOn) {
        speakI(Lang.hints.walkedOff)
    }
}

let prevGroundEntity: ig.Entity | false = false
ig.ENTITY.Player.inject({
    update() {
        this.parent()
        if (!Opts.hints) return
        const groundEntry = ig.game.playerEntity.coll?._collData?.groundEntry
        if (!groundEntry) {
            if (prevGroundEntity) {
                groundEntryUnset(prevGroundEntity)
                prevGroundEntity = false
            }
        } else if (groundEntry.entity !== prevGroundEntity) {
            if (prevGroundEntity) groundEntryUnset(prevGroundEntity)
            groundEntrySet(groundEntry.entity)
            prevGroundEntity = groundEntry.entity
        }
    },
})
