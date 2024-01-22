import { MenuOptions } from './options-manager'
import CrossedEyes from './plugin'
import { TextGather } from './tts/gather-text'
import { TTS } from './tts/tts'
import { AddonInstaller } from './tts/tts-nvda'

export class AutoUpdater {
    async checkAndInstall() {
        if (!MenuOptions.autoUpdate) return
        console.log('checking autoupdate')
        if (CrossedEyes.mod.isCCModPacked) {
            console.log('is ccmod packed')
            let anyUpdated = false
            const fs: typeof import('fs') = (0, eval)("require('fs')")
            const mainDir = (0, eval)("require('path')").dirname(process.execPath)

            const cvLatest = await this.getLatestVersion('CCDirectLink/CrossedEyes')
            const cvPkg = CrossedEyes.mod.version?.toString()
            if (cvLatest != cvPkg) {
                console.log('crossedeyes outdated')
                const fn = `crossedeyes-${cvLatest}.ccmod`
                const url = `https://github.com/CCDirectLink/CrossedEyes/releases/download/v${cvLatest}/${fn}`
                await AddonInstaller.downloadFile(url, `assets/mods/${fn}`)
                const delPath = `${mainDir}/assets/mods/crossedeyes-${cvPkg}.ccmod`
                fs.unlink(delPath, err => {
                    err && console.log(err)
                })
                anyUpdated = true
            }

            const bvReq = (await this.getUrlJson('https://raw.githubusercontent.com/CCDirectLink/CrossedEyes/master/ccmod.json')).match(
                /"cc-blitzkrieg": ">=(\d+\.\d+\.\d+)"/
            )![1]
            // @ts-expect-error
            const bvHas: string = window.activeMods.find(e => e.name == 'cc-blitzkrieg').version
            if (bvReq != bvHas) {
                console.log('cc-blitzkrieg outdated')
                const fn = `cc-blitzkrieg-${bvReq}.ccmod`
                const url = `https://github.com/krypciak/cc-blitzkrieg/releases/download/v${bvReq}/${fn}`
                await AddonInstaller.downloadFile(url, `assets/mods/${fn}`)
                const delPath = `${mainDir}/assets/mods/cc-blitzkrieg-${bvHas}.ccmod`
                fs.unlink(delPath, err => {
                    err && console.log(err)
                })
                anyUpdated = true
            }
            if (anyUpdated) {
                if (MenuOptions.ttsEnabled) {
                    setTimeout(() => {
                        TextGather.g.speakI('Mod updated. Restarting...')
                        setTimeout(() => {
                            window.location.reload()
                        }, 3000)
                    }, 3000)
                } else {
                    window.location.reload()
                }
            } else {
                TTS.g.onReadyListeners.push(() => {
                    console.log(CrossedEyes.mod.version)
                    MenuOptions.ttsEnabled && TextGather.g.speakI(`CrossedEyes version: ${CrossedEyes.mod.version!.toString().replace(/\./g, ': ')}: up to date`)
                })
            }
        }
    }

    private async getLatestVersion(repo: string): Promise<string> {
        return (await this.getUrlJson(`https://api.github.com/repos/${repo}/releases/latest`)).name.substring(1)
    }

    private getUrlJson(url: string): Promise<any> {
        return new Promise<any>(resolve => {
            $.ajax({
                url,
                success: data => {
                    resolve(data)
                },
            })
        })
    }
}
