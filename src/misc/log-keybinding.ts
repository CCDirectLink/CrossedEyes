import { Lang } from '../lang-manager'
import { speakIC } from '../tts/gather/api'

/* in poststart */
declare global {
    namespace ig.Input {
        interface KnownActions {
            copylog: true
        }
    }
}

ig.input.bind(ig.KEY.F4, 'copylog')
let lastLogSent: number = 0
ig.game.addons.preUpdate.push(
    new (class {
        async onPreUpdate() {
            if (ig.input.pressed('copylog')) {
                if (lastLogSent + 2000 > Date.now()) return
                lastLogSent = Date.now()

                speakIC(Lang.logupload.uploading)
                let data = (await blitzkrieg.FsUtil.readFileExternal('biglog.txt')).toString()
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
                if (await blitzkrieg.FsUtil.exists(nvdaLogPath)) {
                    data += `\n\n----------------NVDA LOG----------------\n${await blitzkrieg.FsUtil.readFileExternal(nvdaLogPath)}`
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
