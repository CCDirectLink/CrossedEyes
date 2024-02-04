import { Mod1 } from 'cc-blitzkrieg/src/types'
import { SpacialAudio } from './spacial-audio'
import type * as _ from 'cc-vim'
import type * as __ from 'cc-blitzkrieg'
import { MenuOptionsManager } from './options-manager'
import { LoudWalls } from './environment/loudwalls'
import { SoundManager } from './sound-manager'
import { TTS } from './tts/tts'
import { SpecialAction } from './special-action'
import { EntityBeeper } from './environment/entity-beeper'
import { AimAnalyzer } from './hint-system/aim-analyze'
import { HintSystem } from './hint-system/hint-system'
import { LoudJump } from './environment/loudjump'
import { InteractableHandler } from './environment/interactables'
import { MovementSoundTweaker } from './environment/movement-sounds'
import { CharacterSpeechSynchronizer } from './tts/char-speech-sync'
import { AutoUpdater } from './autoupdate'
import { speakIC } from './tts/gather-text'
import { godmode } from './godmode'
import { LangPopupFix } from './tts/lang-popup-fix'
import { EntityDecluterrer } from './environment/entity-declutter'
import { ScalableWaitStep } from './battle/scalable-wait'
import { RuntimeResources } from './runtime-assets'
import { TestMapMisc } from './tutorial/test-map-misc'
import { SoundGlossary } from './tutorial/sound-glossary'
import { CrossedEyesHud } from './tutorial/crossedeyes-hud'
import { Lang, LangManager } from './lang-manager'

const crypto: typeof import('crypto') = (0, eval)('require("crypto")')

if (!Object.fromEntries) {
    Object.fromEntries = function <T, K extends string | number | symbol>(entries: [K, T][]): Record<K, T> {
        return entries.reduce(
            (acc: Record<K, T>, e: [K, T]) => {
                acc[e[0]] = e[1]
                return acc
            },
            {} as Record<K, T>
        )
    }
}

String.prototype.supplant = function (this: string, o: any) {
    return this.replace(/{([^{}]*)}/g, function (a: any, b: any) {
        var r = o[b]
        return typeof r === 'string' || typeof r === 'number' ? r : a
    })
}

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

    private startWithTestMap: boolean = false

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

        const self = this
        ig.Entity.inject({
            init(x, y, z, settings) {
                this.parent(x, y, z, settings)
                this.uuid = crypto.createHash('sha256').update(`${settings.name}-${x},${y}`).digest('hex')
            },
        })

        new LangManager()
        new AutoUpdater().checkAndInstall()
        new MenuOptionsManager()
        new RuntimeResources()
        new SoundManager()
        new SpacialAudio()
        new MovementSoundTweaker()
        new LoudWalls()
        new HintSystem()
        new LoudJump()
        new InteractableHandler()
        new SpecialAction()
        new TTS()
        new AimAnalyzer()
        new EntityBeeper()
        new CharacterSpeechSynchronizer()
        new LangPopupFix()
        new EntityDecluterrer()
        new ScalableWaitStep()
        new TestMapMisc()
        new CrossedEyesHud()
        new SoundGlossary()

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

    private startTestMap(titleGuiInstance?: sc.TitleScreenButtonGui) {
        this.startWithTestMap = true
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

    addTestMapTitleScreenButton() {
        if (ig.isdemo) return
        const self = this
        sc.TitleScreenButtonGui.inject({
            init() {
                this.parent()
                ig.lang.labels.sc.gui['title-screen']['CrossedEyesTestMap'] = 'CrossedEyes test map'
                const self1 = this
                this._createButton('CrossedEyesTestMap', this.buttons.last().hook.pos.y + 39, 100 - this.buttons.length, () => {
                    self.startTestMap(self1)
                })
            },
        })
        sc.CrossCode.inject({
            start(mode: sc.START_MODE | undefined, transitionTime: number | undefined) {
                this.parent(mode, transitionTime)
            },
            transitionEnded() {
                if (self.startWithTestMap) {
                    ig.game.teleport('crossedeyes/test', new ig.TeleportPosition('entrance'), 'NEW')
                    self.startWithTestMap = false
                } else {
                    this.parent()
                }
            },
        })
    }

    addLogCopyKeybinding() {
        ig.input.bind(ig.KEY.F4, 'copylog')
        let lastLogSent: number = 0
        ig.game.addons.preUpdate.push(
            new (class {
                async onPreUpdate() {
                    if (ig.input.pressed('copylog')) {
                        if (lastLogSent + 2000 > Date.now()) return
                        lastLogSent = Date.now()

                        speakIC(Lang.logupload.uploading)
                        const fs: typeof import('fs') = require('fs')
                        let data = fs.readFileSync('biglog.txt').toString()
                        const lines = data.split('\n')
                        const maxLines = 3000
                        if (lines.length > maxLines) {
                            data = lines.slice(lines.length - maxLines, lines.length).join('\n')
                        }

                        const optionsStr = await blitzkrieg.prettifyJson(
                            JSON.stringify(Object.fromEntries(Object.entries(sc.options.values).filter(e => !e[0].startsWith('modEnabled') && !e[0].startsWith('keys')))),
                            500
                        )
                        data += `\n\n----------------OPTIONS-----------------\n${optionsStr}`

                        const nvdaLogPath: string = `${process.env.TMP ?? ''}/nvda.log`
                        if (blitzkrieg.FsUtil.doesFileExist(nvdaLogPath)) {
                            data += `\n\n----------------NVDA LOG----------------\n${await fs.promises.readFile(nvdaLogPath)}`
                        }
                        const form = new FormData()
                        form.append('file', new File([data], 'crosscode.log'))

                        const res = await fetch('http://0.vern.cc', {
                            method: 'POST',
                            body: form,
                        })
                        const link = (await res.text()).trim()
                        console.log(link)
                        navigator.clipboard.writeText(link)
                        speakIC(Lang.logupload.copied)
                    }
                }
            })()
        )
    }

    async poststart() {
        CrossedEyes.initPoststarters.forEach(p => p.initPoststart())
        this.addLogCopyKeybinding()

        localStorage.getItem('crossedeyesDev') && this.startTestMap()
    }

    addVimAliases() {
        if (window.vim) {
            /* optional dependency https://github.com/krypciak/cc-vim */
        }
    }
}
