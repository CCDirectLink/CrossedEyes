import { Opts } from '../plugin'
import CrossedEyes from '../plugin'
import { SoundManager } from '../sound-manager'
import { EntityUtil } from './entity-util'

declare global {
    namespace ig {
        interface Entity {
            entitySoundInited?: boolean
        }
    }
}

export class EntityBeeper {
    private static tprRange = 16 * 16

    private static getSoundConfigNonFull(e?: ig.Entity, id?: number): SoundManager.ContiniousSettings | undefined {
        if (EntityUtil.isOneTimeSwitch(e, id) || EntityUtil.isMultiHitSwitch(e, id))
            return { paths: ['entity'], changePitchWhenBehind: true, pathsBehind: ['entityLP'], condition: () => !e.isOn }
        if (EntityUtil.isSwitch(e, id) || EntityUtil.isDestructible(e, id)) return { paths: ['entity'], changePitchWhenBehind: true, pathsBehind: ['entityLP'] }
        if (EntityUtil.isEnemy(e, id)) return { paths: ['entity'], changePitchWhenBehind: true, pathsBehind: ['entityLP'], range: 16 * 16 }
        if (EntityUtil.isDoor(e, id) && (id !== undefined || (e.name && e.map))) return { paths: ['tpr'], range: this.tprRange, condition: () => e.active }
        if (EntityUtil.isTeleportField(e, id)) return { paths: ['tpr'], range: this.tprRange, condition: () => !!e.interactEntry }
        if (EntityUtil.isTeleportGround(e, id)) return { paths: ['tpr'], range: this.tprRange }
    }

    static getSoundConfig(e?: ig.Entity, id?: number): SoundManager.ContiniousSettings | undefined {
        const config = this.getSoundConfigNonFull(e, id)
        if (config) {
            if (!('paths' in config)) throw new Error('invalid pickContiniousSettingsPath settings: paths not included')
            config.range ??= 6 * 16
            config.getVolume ??= () => Opts.entityHintsVolume
        }
        return config
    }

    private getId(e: ig.Entity) {
        return `entity_${e.uuid}`
    }

    private deactivateEntity(e: ig.Entity) {
        SoundManager.stopCondinious(this.getId(e))
    }

    private handleEntity(e: ig.Entity) {
        const id = this.getId(e)
        if (!e.entitySoundInited) {
            e.entitySoundInited = true
            const obj = EntityBeeper.getSoundConfig(e)
            obj && (SoundManager.continious[id] = obj)
        }
        if (SoundManager.continious[id]) {
            const sett = e.getQuickMenuSettings!()
            if (sett.disabled || sett.dontEmitSound) {
                SoundManager.stopCondinious(id)
            } else {
                const pos = e.getAlignedPos(ig.ENTITY_ALIGN.CENTER)
                SoundManager.handleContiniousEntry(id, pos, undefined, 0, SoundManager.getAngleVecToPlayer(e))
            }
        }
    }

    constructor() {
        /* in prestart */
        SoundManager.continiousCleanupFilters.push('entity')
        const self = this
        ig.Entity.inject({
            hide(...args) {
                this.parent(...args)
                self.deactivateEntity(this)
            },
            onKill(...args) {
                this.parent(...args)
                self.deactivateEntity(this)
            },
            update(...args) {
                this.parent(...args)
                if (CrossedEyes.isPaused || this._hidden || !Opts.loudEntities) return
                self.handleEntity(this)
            },
        })
    }
}
