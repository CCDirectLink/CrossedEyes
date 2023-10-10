import { Mod1 } from 'cc-blitzkrieg/src/types'
import { SpacialAudio } from './spacialaudio'
import type * as _ from 'cc-vim'

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
        const spacialAudio: SpacialAudio = new SpacialAudio()
        spacialAudio.initPrestart()
    }

    async poststart() {

    }
}
