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

export interface Pauseable {
    pause(): void
    resume(): void
}
export default class CrossedEyes {
    dir: string
    mod: Mod1

    puzzleBeeper!: PuzzleBeeper
    tts!: TTS
    specialAction!: SpecialAction

    pauseables: Pauseable[] = []

    constructor(mod: Mod1) {
        this.dir = mod.baseDirectory
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
        new PuzzleElementsAnalysis()
        this.specialAction = new SpecialAction()
        this.puzzleBeeper = new PuzzleBeeper()
        this.tts = new TTS()
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
    }

    async poststart() {
        MenuOptions.initPoststart()
        this.tts.initPoststart()
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
