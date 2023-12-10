import { Mod1 } from 'cc-blitzkrieg/src/types'
import { SpacialAudio } from './spacial-audio'
import type * as _ from 'cc-vim'
import { MenuOptions } from './options'
import { PuzzleBeeper } from './environment/puzzle'
import { LoudWalls } from './environment/loudwalls'
import { SoundManager } from './sound-manager'
import { TTS } from './tts/tts'
import { SpecialAction } from './special-action'
import { EntityBeeper } from './environment/entity-beeper'
import { AddonInstaller } from './tts/tts-nvda'
import { AimAnalyzer } from './hint-system/aim-analyze'
import { HintSystem } from './hint-system/hint-system'
import { LoudJump } from './environment/loudjump'
import { tweakFootsteps } from './environment/footstep'
import { InteratableHandler } from './environment/interactables'

export interface PauseListener {
    pause?(): void
    resume?(): void
}

export interface InitPoststart {
    initPoststart(): void
}

export default class CrossedEyes {
    static dir: string
    mod: Mod1

    puzzleBeeper!: PuzzleBeeper

    static pauseables: PauseListener[] = []
    static initPoststarters: InitPoststart[] = []

    constructor(mod: Mod1) {
        CrossedEyes.dir = mod.baseDirectory
        this.mod = mod
        this.mod.isCCL3 = mod.findAllAssets ? true : false
        this.mod.isCCModPacked = mod.baseDirectory.endsWith('.ccmod/')
    }

    private pauseAll() {
        CrossedEyes.pauseables.forEach(p => p.pause && p.pause())
    }
    private resumeAll() {
        CrossedEyes.pauseables.forEach(p => p.resume && p.resume())
    }

    async prestart() {
        this.addVimAliases()
        new MenuOptions()
        SoundManager.preloadSounds()
        new SpacialAudio().initSpacialAudio()
        tweakFootsteps()
        new LoudWalls()
        new HintSystem()
        new AimAnalyzer()
        new LoudJump()
        new InteratableHandler()
        new SpecialAction()
        new TTS()
        this.puzzleBeeper = new PuzzleBeeper()
        new EntityBeeper()

        const self = this
        sc.TitleScreenButtonGui.inject({
            show() {
                this.parent()
                TTS.g.addReadyCallback(() => AddonInstaller.askForAddonInstall())
            },
        })
        ig.Game.inject({
            setPaused(paused: boolean) {
                this.parent(paused)
                if (paused) {
                    self.pauseAll()
                } else {
                    self.resumeAll()
                }
            },
        })

        this.addTestMapTitleScreenButton()
    }

    addTestMapTitleScreenButton() {
        function godlikeStats() {
            for (const k of Object.keys(sc.model.player.core) as unknown as sc.PLAYER_CORE[]) { sc.model.player.core[k] = true }

            sc.model.player.setSpLevel(4)
            sc.model.player.setLevel(99)
            sc.model.player.equip = { head: 657, leftArm: 577, rightArm: 607, torso: 583, feet: 596 }
            for (let i = 0; i < sc.model.player.skillPoints.length; i++) { sc.model.player.skillPoints[i] = 200 }
            for (let i = 0; i < 400; i++) { sc.model.player.learnSkill(i) }
            for (let i = 0; i < sc.model.player.skillPoints.length; i++) { sc.model.player.skillPoints[i] = 0 }
            sc.model.player.updateStats()
        }

        let startWithTestMap: boolean = false
        function startTestMap(titleGuiInstance?: sc.TitleScreenButtonGui) {
            startWithTestMap = true
            ig.bgm.clear('MEDIUM_OUT')
            if (titleGuiInstance) {
                ig.interact.removeEntry(titleGuiInstance.buttonInteract)
            } else {
                ig.interact.entries.forEach((e) => ig.interact.removeEntry(e))
            }
            ig.game.start(sc.START_MODE.STORY, 0)
            ig.game.setPaused(false)
            godlikeStats()
        }
        sc.TitleScreenButtonGui.inject({
            init() {
                this.parent()
                ig.lang.labels.sc.gui['title-screen']['CrossedEyesTestMap'] = 'CrossedEyes test map'
                const self1 = this
                this._createButton(
                    'CrossedEyesTestMap',
                    this.buttons.last().hook.pos.y + 39,
                    100 - this.buttons.length,
                    () => { startTestMap(self1) },
                )
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
            }
        })

    }

    async poststart() {
        CrossedEyes.initPoststarters.forEach(p => p.initPoststart())
    }

    addVimAliases() {
        if (window.vim) { /* optional dependency https://github.com/krypciak/cc-vim */
            vim.addAlias('crossedeyes', 'reset-puzzle', 'Reset puzzle step index', (ingame: boolean) => ingame && blitzkrieg.currSel.name == 'puzzle', () => {
                this.puzzleBeeper.stepI = 0
            })
        }
    }
}
