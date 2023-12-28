import CrossedEyes, { PauseListener } from '../plugin'
import { SoundManager } from '../sound-manager'
import { MenuOptions } from '../optionsManager'
import { HintSystem } from '../hint-system/hint-system'
import { TextGather } from '../tts/gather-text'

export class InteratableHandler implements PauseListener {
    constructor() {
        /* in prestart */
        CrossedEyes.pauseables.push(this)
        const interactableSound = new ig.Sound(SoundManager.sounds.interactable)
        const interactSound = new ig.Sound(SoundManager.sounds.interact)
        sc.MapInteractEntry.inject({
            setState(state) {
                this.parent(state)
                this.stateUpdate = true
            },
            customUpdate() {
                if (this.stateUpdate && MenuOptions.loudEntities) {
                    if (this.state == sc.INTERACT_ENTRY_STATE.FOCUS) {
                        if (this.interactSoundType != SoundManager.sounds.interact) {
                            this.interactSoundType = SoundManager.sounds.interact
                            this.interactSoundHandle?.stop()
                            this.interactSoundHandle = ig.SoundHelper.playAtEntity(interactSound, this.entity, true, {}, 6 * 16)
                            const hint = HintSystem.g.quickMenuAnalysisInstance.createHint(this.entity, false)
                            if (!hint) {
                                MenuOptions.ttsEnabled && TextGather.g.speakI('Unmapped interact hint')
                            } else {
                                // @ts-expect-error
                                HintSystem.g.activateHint(0, hint, false)
                            }
                        }
                    } else if (this.state == sc.INTERACT_ENTRY_STATE.NEAR) {
                        if (this.interactSoundType != SoundManager.sounds.interactable) {
                            this.interactSoundType = SoundManager.sounds.interactable
                            this.interactSoundHandle?.stop()
                            this.interactSoundHandle = ig.SoundHelper.playAtEntity(interactableSound, this.entity, true, {}, 6 * 16)
                            TextGather.g.interrupt()
                        }
                    } else {
                        if (this.interactSoundHandle) {
                            this.interactSoundHandle.stop()
                            this.interactSoundHandle = undefined
                            this.interactSoundType = undefined
                        }
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
    pause(): void {
        sc.mapInteract.entries.forEach(e => {
            e.interactSoundType = undefined
            e.interactSoundHandle?.stop()
        })
    }
}
