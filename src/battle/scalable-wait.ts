import { Opts } from '../plugin'

declare global {
    namespace ig.ACTION_STEP {
        interface CROSSEDEYES_VULNERABLE_WAIT extends ig.ActionStepBase {
            original: number
        }
        interface CROSSEDEYES_VULNERABLE_WAITConstructor extends ImpactClass<CROSSEDEYES_VULNERABLE_WAIT> {
            new (settings: { original: number; additionalMultiplier?: number; additionalAdd?: number }): CROSSEDEYES_VULNERABLE_WAIT
        }
        var CROSSEDEYES_VULNERABLE_WAIT: CROSSEDEYES_VULNERABLE_WAITConstructor
    }
}

export class ScalableWaitStep {
    constructor() {
        /* in prestart */
        ig.ACTION_STEP.CROSSEDEYES_VULNERABLE_WAIT = ig.ActionStepBase.extend({
            init(settings) {
                this.original = settings.original
            },
            start(actor: ig.ActorEntity) {
                const time: number = this.original * (Opts.enemyVulnerableMulti - 1)
                actor.stepData.time = time
                actor.stepTimer = actor.stepTimer + (actor.stepData.time || 0)
            },
            run(actor) {
                return actor.stepData.time >= 0 && actor.stepTimer <= 0
            },
        })
    }
}
