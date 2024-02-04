import { SoundManager } from '../sound-manager'
import { Opts } from '../options-manager'
import { HintSystem } from '../hint-system/hint-system'
import { speakIC } from '../tts/gather-text'
import { Lang } from '../lang-manager'

const range = 6 * 16

export class InteractableHandler {
    private getId(e: ig.Entity) {
        return `interact_${e.uuid}`
    }

    static get continiousConfig(): SoundManager.ContiniousSettings {
        return {
            paths: ['interactable', 'interact'],
            getVolume: () => Opts.interactableVolume,
        }
    }

    constructor() {
        /* in prestart */
        SoundManager.continiousCleanupFilters.push('interact')
        const self = this
        ig.ENTITY.Chest.inject({
            openUp() {
                this.parent()
                SoundManager.stopCondinious(self.getId(this))
            },
        })
        sc.MapInteractEntry.inject({
            init(entity, handler, icon, zCondition, interrupting) {
                this.parent(entity, handler, icon, zCondition, interrupting)
                SoundManager.continious[self.getId(entity)] = InteractableHandler.continiousConfig
            },
            setState(state) {
                this.parent(state)
                if (this.entity instanceof ig.ENTITY.NPC && (this.entity.xenoDialog || this.entity.xenoDialogGui)) return
                if (this.entity instanceof ig.ENTITY.Chest && this.entity.isOpen) return
                this.stateUpdate = true
            },
            customUpdate() {
                if (this.stateUpdate && Opts.loudEntities) {
                    const id = self.getId(this.entity)
                    if (this.state == sc.INTERACT_ENTRY_STATE.FOCUS) {
                        const changed = SoundManager.handleContiniousEntry(id, this.entity.getAlignedPos(ig.ENTITY_ALIGN.CENTER), range, 1)
                        if (changed) {
                            const hint = HintSystem.g.quickMenuAnalysisInstance.createHint(this.entity, false)
                            if (hint) {
                                speakIC(hint.nameGui.title.text!)
                            } else {
                                speakIC(Lang.enviroment.unmappedInteractHint)
                            }
                        }
                    } else if (this.state == sc.INTERACT_ENTRY_STATE.NEAR) {
                        SoundManager.handleContiniousEntry(id, this.entity.getAlignedPos(ig.ENTITY_ALIGN.CENTER), range, 0)
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
