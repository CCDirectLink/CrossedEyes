import { Hint, HintData, HintSystem } from '../hint-system'

export class HAnalyzable implements Hint {
    entryName = 'Analyzable'

    constructor() {
        /* run in prestart */
        HintSystem.customColors['Analyzable'] = sc.ANALYSIS_COLORS.YELLOW
        /* no need for ig.ENTITY.Analyzable inject, all 'Analyzable' hint types are redirected here */
    }
    getDataFromEntity(_: ig.Entity, settings: sc.QuickMenuTypesBaseSettings): HintData {
        const name: string = `Analyzable: ${ig.LangLabel.getText(settings.text!)}`
        const description: string = 'None'
        return { name, description }
    }
}
