import { HintSystem } from '../hint-system/hint-system'
import { MenuOptions } from '../options-manager'
import CrossedEyes from '../plugin'
import { SoundManager } from '../sound-manager'

export class EntityBeeper {
    private range = 8 * 16

    private getSoundName(e: ig.Entity): Omit<SoundManager.ContiniousSettings, 'getVolume'> | undefined {
        if (e instanceof ig.ENTITY.OneTimeSwitch || e instanceof ig.ENTITY.MultiHitSwitch) return { paths: ['entity'], condition: () => !e.isOn }
        if (e instanceof ig.ENTITY.Enemy || e instanceof ig.ENTITY.Switch || e instanceof ig.ENTITY.Destructible) return { paths: ['entity'] }
        if (e instanceof ig.ENTITY.Door && e.name && e.map) return { paths: ['tpr'], condition: () => e.active }
        if (e instanceof ig.ENTITY.TeleportField) return { paths: ['tpr'], condition: () => !!e.interactEntry }
        if (e instanceof ig.ENTITY.TeleportGround) return { paths: ['tpr'] }
    }
    private getId(e: ig.Entity) {
        return `entity_${e.uuid}`
    }

    private deactivateEntity(e: ig.Entity) {
        SoundManager.stopCondinious(this.getId(e))
        HintSystem.g.deactivateHint(e)
    }

    private handleEntity(e: ig.Entity) {
        const pos = e.getAlignedPos(ig.ENTITY_ALIGN.CENTER)
        SoundManager.handleContiniousEntry(this.getId(e), pos, this.range, 0)
    }

    constructor() {
        /* in prestart */
        SoundManager.continiousCleanupFilters.push('entity')
        const self = this
        ig.Entity.inject({
            init(x, y, z, settings) {
                this.parent(x, y, z, settings)
                const obj = self.getSoundName(this) as SoundManager.ContiniousSettings
                if (obj) {
                    obj.getVolume = () => MenuOptions.entityHintsVolume
                    SoundManager.continious[self.getId(this)] = obj
                }
            },
            hide(...args) {
                this.parent(...args)
                self.deactivateEntity(this)
            },
            onKill(...args) {
                this.parent(...args)
                self.deactivateEntity(this)
            },
            erase() {
                this.parent()
                self.deactivateEntity(this)
            },
            update(...args) {
                this.parent(...args)
                if (CrossedEyes.isPaused) return
                self.handleEntity(this)
            },
        })
    }
}
