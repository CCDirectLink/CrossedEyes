import { Lang } from '../../lang-manager'
import { HintBase, HintData, HintSystem } from '../hint-system'

export class HAnalyzable implements HintBase {
    entryName = 'Analyzable' as const

    constructor() {
        /* run in prestart */
        HintSystem.customColors['Analyzable'] = sc.ANALYSIS_COLORS.YELLOW
        /* no need for ig.ENTITY.Analyzable inject, all 'Analyzable' hint types are redirected here */
    }
    getDataFromEntity(_: ig.Entity, settings: sc.QuickMenuTypesBaseSettings): HintData {
        const lang = { ...Lang.hints.Analyzable }
        lang.name = lang.name.supplant({ name: ig.LangLabel.getText(settings.text!) })
        return lang
    }
}
