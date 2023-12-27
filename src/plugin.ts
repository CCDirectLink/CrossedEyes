import { Mod1 } from 'cc-blitzkrieg/src/types'
import { SpacialAudio } from './spacial-audio'
import type * as _ from 'cc-vim'
import type * as __ from 'cc-blitzkrieg'
import { MenuOptions } from './options'
import { LoudWalls } from './environment/loudwalls'
import { SoundManager } from './sound-manager'
import { TTS } from './tts/tts'
import { SpecialAction } from './special-action'
import { EntityBeeper } from './environment/entity-beeper'
import { AimAnalyzer } from './hint-system/aim-analyze'
import { HintSystem } from './hint-system/hint-system'
import { LoudJump } from './environment/loudjump'
import { InteratableHandler } from './environment/interactables'
import { MovementSoundTweaker } from './environment/movementSounds'
import { CharacterSpeechSynchronizer } from './tts/char-speech-sync'
import { AutoUpdater } from './autoupdate'
import { TextGather } from './tts/gather-text'
import { godmode } from './godmode'

export interface PauseListener {
    pause?(): void
}

export interface InitPoststart {
    initPoststart(): void
}

export default class CrossedEyes {
    static dir: string
    static mod: Mod1

    static pauseables: PauseListener[] = []
    static initPoststarters: InitPoststart[] = []
    static isPaused: boolean = false

    constructor(mod: Mod1) {
        CrossedEyes.dir = mod.baseDirectory
        CrossedEyes.mod = mod
        CrossedEyes.mod.isCCL3 = mod.findAllAssets ? true : false
        CrossedEyes.mod.isCCModPacked = mod.baseDirectory.endsWith('.ccmod/')
    }

    private pauseAll() {
        CrossedEyes.isPaused = true
        CrossedEyes.pauseables.forEach(p => p.pause && p.pause())
    }
    private resumeAll() {
        CrossedEyes.isPaused = false
    }

    async prestart() {
        this.addVimAliases()
        new AutoUpdater().checkAndInstall()
        new MenuOptions()
        new SoundManager()
        new SpacialAudio()
        new MovementSoundTweaker()
        new LoudWalls()
        new HintSystem()
        new AimAnalyzer()
        new LoudJump()
        new InteratableHandler()
        new SpecialAction()
        new TTS()
        new EntityBeeper()
        new CharacterSpeechSynchronizer()

        const self = this
        ig.Game.inject({
            setPaused(paused: boolean) {
                this.parent(paused)
                if (paused) {
                    self.pauseAll()
                } else if (!ig.game.events.blockingEventCall) {
                    self.resumeAll()
                }
            },
        })
        ig.EventManager.inject({
            clear() {
                this.parent()
                self.resumeAll()
            },
            _startEventCall(event) {
                this.parent(event)
                if (event.runType == ig.EventRunType.BLOCKING) {
                    self.pauseAll()
                }
            },
            _endEventCall(event) {
                const initial = this.blockingEventCall
                this.parent(event)
                if (this.blockingEventCall === null && this.blockingEventCall != initial) {
                    self.resumeAll()
                }
            },
        })

        this.addTestMapTitleScreenButton()
    }

    addTestMapTitleScreenButton() {
        let startWithTestMap: boolean = false
        function startTestMap(titleGuiInstance?: sc.TitleScreenButtonGui) {
            startWithTestMap = true
            ig.bgm.clear('MEDIUM_OUT')
            if (titleGuiInstance) {
                ig.interact.removeEntry(titleGuiInstance.buttonInteract)
            } else {
                ig.interact.entries.forEach(e => ig.interact.removeEntry(e))
            }
            ig.game.start(sc.START_MODE.STORY, 0)
            ig.game.setPaused(false)
            godmode()
        }
        sc.TitleScreenButtonGui.inject({
            init() {
                this.parent()
                ig.lang.labels.sc.gui['title-screen']['CrossedEyesTestMap'] = 'CrossedEyes test map'
                const self1 = this
                this._createButton('CrossedEyesTestMap', this.buttons.last().hook.pos.y + 39, 100 - this.buttons.length, () => {
                    startTestMap(self1)
                })
            },
        })
        sc.CrossCode.inject({
            start(mode: sc.START_MODE | undefined, transitionTime: number | undefined) {
                this.parent(mode, transitionTime)
            },
            transitionEnded() {
                if (startWithTestMap) {
                    ig.game.teleport('crossedeyes/test', new ig.TeleportPosition('entrance'), 'NEW')
                    startWithTestMap = false
                } else {
                    this.parent()
                }
            },
        })
    }

    addLogCopyKeybinding() {
        ig.input.bind(ig.KEY.F4, 'copylog')
        ig.game.addons.preUpdate.push(
            new (class {
                async onPreUpdate() {
                    if (ig.input.pressed('copylog')) {
                        MenuOptions.ttsEnabled && TextGather.g.speakI('uploading')
                        const fs: typeof import('fs') = require('fs')
                        const data = fs.readFileSync('biglog.txt').toString()
                        const form = new FormData()
                        form.append('file', new File([data], 'crosscode.log'))

                        const res = await fetch('http://0.vern.cc', {
                            method: 'POST',
                            body: form,
                        })
                        const link = (await res.text()).trim()
                        console.log(link)
                        navigator.clipboard.writeText(link)
                        MenuOptions.ttsEnabled && TextGather.g.speakI('Log link copied to clipboard')
                    }
                }
            })()
        )
    }

    async poststart() {
        CrossedEyes.initPoststarters.forEach(p => p.initPoststart())
        this.addLogCopyKeybinding()
    }

    addVimAliases() {
        if (window.vim) {
            /* optional dependency https://github.com/krypciak/cc-vim */
        }
    }
}
