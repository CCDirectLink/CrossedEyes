import { Mod1 } from 'cc-blitzkrieg/src/types'
import { SpacialAudio } from './spacialaudio'
import type * as _ from 'cc-vim'
import { MenuOptions } from './options'
import { PuzzleBeeper } from './puzzle'

function addVimBindings() {
    if (window.vim) { /* optional dependency https://github.com/krypciak/cc-vim */
    }
}

export default class CrossedEyes {
    dir: string
    mod: Mod1

    constructor(mod: Mod1) {
        this.dir = mod.baseDirectory
        this.mod = mod
        this.mod.isCCL3 = mod.findAllAssets ? true : false
        this.mod.isCCModPacked = mod.baseDirectory.endsWith('.ccmod/')
    }

    async prestart() {
        addVimBindings()
        MenuOptions.initPrestart()
        const spacialAudio: SpacialAudio = new SpacialAudio()
        spacialAudio.initSpacialAudio()
        spacialAudio.initLoudWalls()

        const puzzleBeeper: PuzzleBeeper = new PuzzleBeeper()
        puzzleBeeper.initPrestart()
    }

    async poststart() {
        MenuOptions.initPoststart()
    }
}
