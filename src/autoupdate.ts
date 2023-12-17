import CrossedEyes from './plugin'
import { AddonInstaller } from './tts/tts-nvda'

export class AutoUpdater {
    async checkAndInstall() {
        if (CrossedEyes.mod.isCCModPacked) {
            let anyUpdated = false
            const fs: typeof import('fs') = (0, eval)("require('fs')")
            const mainDir = (0, eval)("require('path')").dirname(process.execPath)

            const cvLatest = await this.getLatestVersion('CCDirectLink/CrossedEyes')
            const cvPkg = CrossedEyes.mod.version?.toString()
            if (cvLatest != cvPkg) {
                const fn = `crossedeyes-${cvLatest}.ccmod`
                const url = `https://github.com/CCDirectLink/CrossedEyes/releases/download/v${cvLatest}/${fn}`
                await AddonInstaller.downloadFile(url, `assets/mods/${fn}`)
                const delPath = `${mainDir}/assets/mods/crossedeyes-${cvPkg}.ccmod`
                fs.unlink(delPath, (err) => { err && console.log(err) })
                anyUpdated = true
            }


            const bvReq = (await this.getUrlJson('https://raw.githubusercontent.com/CCDirectLink/CrossedEyes/master/ccmod.json'))
                .match(/"cc-blitzkrieg": ">=(\d+\.\d+\.\d+)"/)![1]
            // @ts-expect-error
            const bvHas: string = window.activeMods.find(e => e.name == 'cc-blitzkrieg').version
            if (bvReq != bvHas) {
                const fn = `cc-blitzkrieg-${bvReq}.ccmod`
                const url = `https://github.com/krypciak/cc-blitzkrieg/releases/download/v${bvReq}/${fn}`
                await AddonInstaller.downloadFile(url, `assets/mods/${fn}`)
                const delPath = `${mainDir}/assets/mods/cc-blitzkrieg-${bvHas}.ccmod`
                fs.unlink(delPath, (err) => { err && console.log(err) })
                anyUpdated = true
            }
            if (anyUpdated) { window.location.reload() }
        }
    }

    private async getLatestVersion(repo: string): Promise<string> {
        return (await this.getUrlJson(`https://api.github.com/repos/${repo}/releases/latest`)).name.substring(1)
    }

    private getUrlJson(url: string): Promise<any> {
        return new Promise<any>((resolve) => {
            $.ajax({
                url,
                success: (data) => {
                    resolve(data)
                },
            })
        })
    }
}
