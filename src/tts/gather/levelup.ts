import { Lang } from '../../lang-manager'
import { Opts } from '../../plugin'
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
        let text = `${Lang.menu.levelup} `
        for (const key1 in names) {
            const key = key1 as keyof typeof names
            const value = levelStatData[key]
            if (value) {
                const statName = names[key]
                text += Lang.menu.levelupTemplate.supplant({ value, statName })
            }
        }
        speak(text)
    },
    onLevelUpEventEnd() {
        this.parent()
        interrupt()
    },
})
