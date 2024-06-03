import { Lang } from '../../lang-manager'
import { Opts } from '../../options'
import { HintBase, HintData } from '../hint-system'
import { HClimbableTerrain } from './climbable-terrain'

declare global {
    namespace sc {
        interface PropInteract {
            iconType: keyof typeof sc.PROP_INTERACT_ICONS
            hoverText?: ig.LangLabel.Data
        }
    }
}

export class HProp implements HintBase {
    entryName = 'Prop' as const

    private props: Record</* propName */ string, HintData> = Lang.hints.props

    static getInteractLang(e: ig.ENTITY.Prop): HintData | undefined {
        if (!e.interact) return
        if (e.interact.hoverText) {
            if (e.interact.iconType == 'INFO') {
                const lang = { ...Lang.hints.propInteractableInfo }
                const rest = ig.LangLabel.getText(e.interact.hoverText)
                lang.name = lang.name.supplant({ rest })
                return lang
            }
        }
    }

    constructor() {
        /* run in prestart */
        const self = this

        sc.PropInteract?.inject({
            init(prop, settings) {
                this.parent(prop, settings)
                this.iconType = settings.icon ?? 'INFO'
                this.hoverText = settings.hoverText
            },
        })
        ig.ENTITY.Prop.inject({
            getQuickMenuSettings(): Omit<sc.QuickMenuTypesBaseSettings, 'entity'> {
                const sett = HClimbableTerrain.getPropConfig(this)
                if (sett) return sett
                return {
                    type: 'Hints',
                    hintName: self.entryName,
                    hintType: 'Chests',
                    disabled: this._hidden || !(Opts.hints && (self.props[this.propName] || HProp.getInteractLang(this))),
                }
            },
        })
    }
    getDataFromEntity(e: ig.Entity): HintData {
        if (!(e instanceof ig.ENTITY.Prop)) throw new Error()
        let lang = this.props[e.propName]
        if (lang) return this.props[e.propName]

        return HProp.getInteractLang(e)!
    }
}
