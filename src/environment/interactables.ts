import { SoundManager } from '../sound-manager'
import { MenuOptions } from '../options-manager'
import { HintSystem } from '../hint-system/hint-system'
import { TextGather } from '../tts/gather-text'

const range = 6 * 16

export class InteratableHandler {
    private getId(e: ig.Entity) {
        return `interact_${e.uuid}`
    }

    constructor() {
        /* in prestart */
        SoundManager.continiousCleanupFilters.push('interact')
        const self = this
        sc.MapInteractEntry.inject({
            init(entity, handler, icon, zCondition, interrupting) {
                this.parent(entity, handler, icon, zCondition, interrupting)
                SoundManager.continious[self.getId(entity)] = {
                    paths: ['interactable', 'interact'],
                    getVolume: () => MenuOptions.interactableVolume,
                }
            },
            setState(state) {
                this.parent(state)
                this.stateUpdate = true
            },
            customUpdate() {
                if (this.stateUpdate && MenuOptions.loudEntities) {
                    const id = self.getId(this.entity)
                    if (this.state == sc.INTERACT_ENTRY_STATE.FOCUS) {
                        const changed = SoundManager.handleContiniousEntry(id, this.entity.coll.pos, range, 1)
                        if (changed) {
                            const hint = HintSystem.g.quickMenuAnalysisInstance.createHint(this.entity, false)
                            if (hint) {
                                MenuOptions.ttsEnabled && TextGather.g.speakI(hint.nameGui.title.text)
                            } else {
                                MenuOptions.ttsEnabled && TextGather.g.speakI('Unmapped interact hint')
                            }
                        }
                    } else if (this.state == sc.INTERACT_ENTRY_STATE.NEAR) {
                        SoundManager.handleContiniousEntry(id, this.entity.coll.pos, range, 0)
                    } else {
                        SoundManager.stopCondinious(id)
                    }
                    this.stateUpdate = false
                }
            },
        })
        ig.ENTITY.Player.inject({
            update() {
                this.parent()
                sc.mapInteract.entries.forEach(e => e.customUpdate())
            },
        })
    }
}
