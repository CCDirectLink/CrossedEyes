import { Mod1 } from 'cc-blitzkrieg/src/types'
import { MenuOptionsManager, OptsType } from './options-manager'
import { LoudWalls } from './environment/loudwalls'
import { SoundManager } from './sound-manager'
import { TTS } from './tts/tts'
import { SpecialAction } from './special-action'
import { EntityBeeper } from './environment/entity-beeper'
import { AimAnalyzer } from './hint-system/aim-analyze'
import { HintSystem } from './hint-system/hint-system'
import { LoudJump } from './environment/loudjump'
import { InteractableHandler } from './environment/interactables'
import { CharacterSpeechSynchronizer } from './tts/char-speech-sync'
import { RuntimeResources } from './misc/runtime-assets'
import { SoundGlossary } from './manuals/hud/sound-glossary'
import { CrossedEyesHud } from './manuals/hud/crossedeyes-hud'
import { LangManager } from './lang-manager'
import { getOptions } from './options'
import { updateQuickRingMenuLayoutLock } from './misc/quick-menu-layout-enforce'
import { PauseListener } from './misc/menu-pause'
import { PluginClass } from 'ultimate-crosscode-typedefs/modloader/mod'
import { TestMap } from './misc/test-map'
import { addMenuManuals } from './manuals/all'

import type * as _ from 'cc-vim'
import type * as __ from 'cc-blitzkrieg'
import './misc/modify-prototypes'

export let Opts: OptsType<ReturnType<typeof getOptions>>

export default class CrossedEyes implements PluginClass {
    static dir: string
    static mod: Mod1

    static initPoststart: (() => void)[] = []

    static pauseables: PauseListener[] = []
    static isPaused: boolean = false /* see ./misc/menu-pause */

    constructor(mod: Mod1) {
        CrossedEyes.dir = mod.baseDirectory
        CrossedEyes.mod = mod
        CrossedEyes.mod.isCCL3 = mod.findAllAssets ? true : false
        CrossedEyes.mod.isCCModPacked = mod.baseDirectory.endsWith('.ccmod/')
    }

    async prestart() {
        new LangManager()
        Opts = new MenuOptionsManager(getOptions()).getOpts()

        new RuntimeResources()
        new SoundManager()
        await import('./misc/spacial-audio')
        await import('./environment/movement-sounds')
        new LoudWalls()
        new HintSystem()
        new LoudJump()
        new InteractableHandler()
        new SpecialAction()
        new TTS()
        new AimAnalyzer()
        new EntityBeeper()
        new CharacterSpeechSynchronizer()
        new CrossedEyesHud()
        new SoundGlossary()

        new TestMap()
        await import('./misc/lang-popup-fix')
        await import('./environment/entity-declutter')
        await import('./misc/scalable-wait')
        await import('./misc/announce-version')
        await import('./misc/menu-pause')
        await import('./misc/title-screen-button')
        await addMenuManuals()
        updateQuickRingMenuLayoutLock()
    }

    async poststart() {
        CrossedEyes.initPoststart.forEach(p => p())
        await import('./misc/log-keybinding')

        localStorage.getItem('crossedeyesDev') == 'true' && TestMap.start()
    }
}
