import { Lang } from '../lang-manager'
import CrossedEyes from '../plugin'
import { speakIC } from '../tts/gather/api'
import { TTS } from '../tts/tts'

/* in prestart */
TTS.g.onReadyListeners.push(() => {
    console.log(CrossedEyes.mod.version)
    speakIC(Lang.misc.versionAnnounce.supplant({ version: CrossedEyes.mod.version!.toString().replace(/\./g, ': ') }))
})
