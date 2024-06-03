import { Mod1 } from 'cc-blitzkrieg/src/types'
import { PluginClass } from 'ultimate-crosscode-typedefs/modloader/mod'
import { EntityBeeper } from './environment/entity-beeper'
import { InteractableHandler } from './environment/interactables'
import { LoudJump } from './environment/loudjump'
import { LoudWalls } from './environment/loudwalls'
import { AimAnalyzer } from './hint-system/aim-analyze'
import { HintSystem } from './hint-system/hint-system'
import { LangManager } from './lang-manager'
import { addMenuManuals } from './manuals/all'
import { CrossedEyesHud } from './manuals/hud/crossedeyes-hud'
import { SoundGlossary } from './manuals/hud/sound-glossary'
import { injectIdlePosDisable } from './misc/idle-pose-disable'
import { PauseListener } from './misc/menu-pause'
import { updateQuickRingMenuLayoutLock } from './misc/quick-menu-layout-enforce'
import { RuntimeResources } from './misc/runtime-assets'
import { TestMap } from './misc/test-map'
import { SoundManager } from './sound-manager'
import { SpecialAction } from './special-action'
import { CharacterSpeechSynchronizer } from './tts/char-speech-sync'
import { TTS } from './tts/tts'

import type * as __ from 'cc-blitzkrieg'
import type * as _ from 'cc-vim'
import './misc/modify-prototypes'
import { registerOpts } from './options'

export type ObjectValues<T> = T[keyof T]

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
        registerOpts()

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
        await import('./misc/quick-menu-y-level-announcer')
        await import('./environment/cliff-safeguard')
        injectIdlePosDisable()
        await addMenuManuals()
        updateQuickRingMenuLayoutLock()
    }

    async poststart() {
        CrossedEyes.initPoststart.forEach(p => p())
        await import('./misc/log-keybinding')

        if (!ig.isdemo && localStorage.getItem('crossedeyesDev') == 'true') TestMap.start()
    }
}
