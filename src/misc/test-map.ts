import { godmode } from './godmode'

declare global {
    namespace ig.EVENT_STEP {
        interface CROSSEDEYES_LEVEL_UP extends ig.ActionStepBase {}
        interface CROSSEDEYES_LEVEL_UPConstructor extends ImpactClass<CROSSEDEYES_LEVEL_UP> {
            new (settings: {}): CROSSEDEYES_LEVEL_UP
        }
        var CROSSEDEYES_LEVEL_UP: CROSSEDEYES_LEVEL_UPConstructor

        interface CROSSEDEYES_RELOAD_LEVEL extends ig.ActionStepBase {}
        interface CROSSEDEYES_RELOAD_LEVELConstructor extends ImpactClass<CROSSEDEYES_RELOAD_LEVEL> {
            new (settings: {}): CROSSEDEYES_RELOAD_LEVEL
        }
        var CROSSEDEYES_RELOAD_LEVEL: CROSSEDEYES_RELOAD_LEVELConstructor
    }
}

export class TestMap {
    static startWithTestMap: boolean = false

    constructor() {
        /* in prestart */
        sc.CrossCode.inject({
            transitionEnded() {
                if (!TestMap.startWithTestMap) return this.parent()

                ig.game.teleport('crossedeyes/test', new ig.TeleportPosition('entrance'), 'NEW')
                TestMap.startWithTestMap = false
            },
        })

        ig.EVENT_STEP.CROSSEDEYES_LEVEL_UP = ig.EventStepBase.extend({
            run(_actor) {
                const p = ig.game.playerEntity
                if (p.model.level == 99) {
                    /* no p.model.setLevel(98) because it resets the circuit tree */
                    p.model.level = 98
                    p.model.updateStats()
                    sc.Model.notifyObserver(p.model, sc.PLAYER_MSG.LEVEL_CHANGE, null)
                }
                p.model.addExperience(1000, p.model.level, 0, true, sc.LEVEL_CURVES.STATIC_REGULAR)
                return true
            },
        })

        ig.EVENT_STEP.CROSSEDEYES_RELOAD_LEVEL = ig.EventStepBase.extend({
            run(_actor) {
                const tppos = new ig.TeleportPosition()
                const { x, y } = ig.game.playerEntity.getCenter()
                const z = ig.game.playerEntity.coll.pos.z
                tppos.pos = Vec3.createC(x, y, z)
                tppos.baseZPos = z
                tppos.level = ig.game.playerEntity.coll.level as unknown as number
                tppos.face = Vec2.create(ig.game.playerEntity.face)
                ig.game.teleport(ig.game.mapName, tppos)
                ig.game.teleporting.timer = 0
                return true
            },
        })
    }

    static start(titleGuiInstance?: sc.TitleScreenButtonGui) {
        TestMap.startWithTestMap = true
        ig.bgm.clear('MEDIUM_OUT')
        if (titleGuiInstance) {
            ig.interact.removeEntry(titleGuiInstance.buttonInteract)
        } else {
            ig.interact.entries.forEach(e => ig.interact.removeEntry(e))
        }
        ig.game.start(sc.START_MODE.STORY, 0)
        ig.game.setPaused(false)
        godmode()
    }
}
