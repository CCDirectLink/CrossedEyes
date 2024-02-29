import { Lang } from '../../lang-manager'
import CrossedEyes, { Opts } from '../../plugin'
import { TextGather, speakI } from './api'

/* in prestart */
let lastArea: string | undefined
let lastMapKeys: string[] | undefined

sc.GameModel.inject({
    enterTitle() {
        this.parent()
        lastArea = undefined
        lastMapKeys = undefined
    },
})

CrossedEyes.initPoststart.push(() => {
    sc.Model.addObserver<sc.MapModel>(sc.map, {
        modelChanged(model: sc.Model, msg: sc.MAP_EVENT) {
            if (Opts.tts && model == sc.map && !sc.model.isCutscene() && msg == sc.MAP_EVENT.MAP_ENTERED) {
                const area: string = sc.map.getCurrentAreaName().value
                const map: string = sc.map.getCurrentMapName().value
                if (map === undefined) return

                let toSpeak: string = ''

                if (area != lastArea) {
                    toSpeak += Lang.enviroment.mapEnterAreaTemplate.supplant({ area })
                    lastArea = area
                }
                let currMapKeys = Object.keys(ig.vars.storage.maps)
                let isNew = false
                if (lastMapKeys) {
                    const mapPath = ig.game.mapName.toCamel().toPath('', '')
                    if (!lastMapKeys.includes(mapPath) && currMapKeys.includes(mapPath)) isNew = true
                }
                lastMapKeys = currMapKeys

                toSpeak += (isNew ? Lang.enviroment.mapEnterNewTemplate : Lang.enviroment.mapEnterTemplate).supplant({ map })
                speakI(toSpeak)
                TextGather.ignoreInteractTo = 1
            }
        },
    })
})
