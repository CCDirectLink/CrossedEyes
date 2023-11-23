import { Mod1 } from 'cc-blitzkrieg/src/types'
import { SpacialAudio } from './spacial-audio'
import type * as _ from 'cc-vim'
import { MenuOptions } from './options'
import { PuzzleBeeper } from './puzzle'
import { LoudWalls } from './loudwalls'
import { SoundManager } from './sound-manager'
import { TTS } from './tts/tts'
import { SpecialAction } from './special-action'
import { EntityBeeper } from './entity-beeper'
import { PuzzleElementsAnalysis } from './puzzle-analyze/puzzle-analyze'
import { AimAnalyzer } from './puzzle-analyze/aim-analyze'
import { AddonInstaller } from './tts/tts-nvda'

export interface Pauseable {
    pause(): void
    resume(): void
}
export default class CrossedEyes {
    static dir: string
    mod: Mod1

    puzzleBeeper!: PuzzleBeeper
    specialAction!: SpecialAction

    pauseables: Pauseable[] = []

    constructor(mod: Mod1) {
        CrossedEyes.dir = mod.baseDirectory
        this.mod = mod
        this.mod.isCCL3 = mod.findAllAssets ? true : false
        this.mod.isCCModPacked = mod.baseDirectory.endsWith('.ccmod/')
    }

    private pauseAll() {
        this.pauseables.forEach(p => p.pause())
    }

    async prestart() {
        this.addVimAliases()
        MenuOptions.initPrestart()
        SoundManager.preloadSounds()
        new SpacialAudio().initSpacialAudio()
        this.pauseables.push(
            new LoudWalls(),
        )
        const puzzleElementAnalysis = new PuzzleElementsAnalysis()
        new AimAnalyzer(puzzleElementAnalysis)
        this.specialAction = new SpecialAction()
        this.puzzleBeeper = new PuzzleBeeper()
        new TTS()
        new EntityBeeper()

        const self = this
        ig.EventManager.inject({
            clear() {
                this.parent()
                self.pauseAll()
            },
            _endEventCall(event) {
                this.parent(event)
                if (!this.blockingEventCall) {
                    self.pauseAll()
                }
            }
        })

        sc.TitleScreenButtonGui.inject({
            show() {
                this.parent()
                TTS.g.addReadyCallback(() => AddonInstaller.askForAddonInstall())
            },
        })
    }

    async poststart() {
        MenuOptions.initPoststart()
        TTS.g.initPoststart()
        this.specialAction.initPoststart()
    }

    addVimAliases() {
        if (window.vim) { /* optional dependency https://github.com/krypciak/cc-vim */
            vim.addAlias('crossedeyes', 'reset-puzzle', 'Reset puzzle step index', (ingame: boolean) => ingame && blitzkrieg.currSel.name == 'puzzle', () => {
                this.puzzleBeeper.stepI = 0
            })
        }
    }
}
