import { Lang } from '../../lang-manager'
import { Opts } from '../../options'
import { interrupt, speak } from './api'

/* in prestart */
let levelStatData: sc.PlayerModel.LevelUpDelta
sc.PlayerLevelNotifier.inject({
    runLevelUpScene(player, model) {
        levelStatData = { ...model.levelUpDelta }
        this.parent(player, model)
    },
    onLevelUpEventStart() {
        this.parent()
        if (!Opts.tts) return
        const names = {
            level: Lang.stats.level,
            cp: Lang.stats.circuitPoints,
            hp: Lang.stats.health,
            attack: Lang.stats.attack,
            defense: Lang.stats.defense,
            focus: Lang.stats.focus,
        } as const

        const strings: string[] = Object.entriesT(names)
            .map(([key, statName]) => {
                const value = levelStatData[key]
                if (value) return Lang.stats.statDifferenceTemplate.supplant({ sign: Lang.misc.plus, value, statName })
            })
            .filter(Boolean) as string[]

        const text = `${Lang.menu.levelup} ${strings.join(', ')}.`
        speak(text)
    },
    onLevelUpEventEnd() {
        this.parent()
        interrupt()
    },
})
