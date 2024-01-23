declare global {
    namespace ig.EVENT_STEP {
        interface CROSSEDEYES_LEVEL_UP extends ig.ActionStepBase {}
        interface CROSSEDEYES_LEVEL_UPConstructor extends ImpactClass<CROSSEDEYES_LEVEL_UP> {
            new (settings: {}): CROSSEDEYES_LEVEL_UP
        }
        var CROSSEDEYES_LEVEL_UP: CROSSEDEYES_LEVEL_UPConstructor
    }
}

export class TestMapMisc {
    constructor() {
        /* in prestart */
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
    }
}
