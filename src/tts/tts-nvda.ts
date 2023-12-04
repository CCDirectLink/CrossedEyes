import { WebSocket, WebSocketServer } from 'ws'
import { TTS, TTSInterface, TTSTypes } from './tts'
import CrossedEyes from '../plugin'

import AdmZip from 'adm-zip'
import { MenuOptions } from '../options'

const fs: typeof import('fs') = (0, eval)('require("fs")')

export class TTSNvda implements TTSInterface {
    onReady!: () => void
    queue!: TTS['speakQueue']
    increaseQueueId!: () => number

    server!: WebSocketServer
    sockets: WebSocket[] = []

    async init(queue: TTS['speakQueue'], increaseQueueId: () => number, onReady: () => void) {
        this.onReady = onReady
        this.queue = queue
        this.increaseQueueId = increaseQueueId

        window.addEventListener('beforeunload', () => {
            this.server.close()
        })
        this.startServer()
    }

    startServer() {
        const host = 'localhost'
        const port = 16390

        this.server = new WebSocketServer({ host, port })
        this.sockets = []

        this.server.on('connection', (socket: WebSocket) => {
            this.onReady()
            this.speak('NVDA connected')
            socket.on('close', () => {
                this.sockets.splice(this.sockets.indexOf(socket))
            })
            this.sockets.forEach(s => s.close())
            this.sockets = []
            this.sockets.push(socket)
        })
    }

    sendCommand(command: string) {
        for (const socket of this.sockets) {
            socket.send(command)
        }
    }

    isReady(): boolean {
        return this.sockets && this.sockets.length > 0
    }

    speak(text: string): void {
        this.sendCommand(`speak ${text}`)
    }

    interrupt(): void {
        this.sendCommand('interrupt')
    }

}

export class AddonInstaller {
    static async askForAddonInstall() {
        if (process.platform == 'win32' && !this.isAddonInstalled() && await AddonInstaller.isNvdaRunning()) {
            const run = async () => {
                const resopnse = await blitzkrieg.syncDialog('NVDA running detected. Do you want to install the neccesery addon?', ['yes', 'no'] as const)
                if (resopnse == 'yes') { this.installAddon() }
            }
            if (MenuOptions.ttsType == TTSTypes['Built-in']) {
                run()
            } else {
                MenuOptions.ttsType = TTSTypes['Built-in']
                TTS.g.addReadyCallback(() => run())
            }
        }
    }

    private static async isNvdaRunning(): Promise<boolean> {
        function isProcessRunning(name: string): Promise<boolean> {
            return new Promise((resolve) => {
                require('child_process').exec(`qprocess "${name}"`, (_: string, __: string, stderr: string) => {
                    resolve(!stderr.trim())
                })
            })
        }
        return isProcessRunning('nvda.exe')
    }

    private static isAddonInstalled(): boolean {
        return blitzkrieg.FsUtil.doesFileExist(`${process.env.APPDATA ?? ''}/nvda/addons/crosscode/manifest.ini`)
    }

    private static async installAddon() {
        const path: typeof import('path') = (0, eval)('require("path")')

        const version = '1.6.4'
        const addonsDir = `${process.env.APPDATA ?? ''}/nvda/addons`
        const zipFilePath = `${process.env.TEMP}/websocket-client.zip`
        const downloadPromise: Promise<void> = AddonInstaller.downloadFile(
            `https://codeload.github.com/websocket-client/websocket-client/zip/refs/tags/v${version}`, zipFilePath)

        function cp(name: string) {
            const from = `${CrossedEyes.dir}/nvdaplugin/${name}`
            const to = `${addonsDir}/${name}`
            blitzkrieg.FsUtil.mkdirs(path.dirname(to))
            blitzkrieg.FsUtil.copyFile(from, to)
        }
        cp('crosscode/manifest.ini')
        cp('crosscode/appModules/crosscode.py')

        await downloadPromise

        const websocketClientParentPath = `${addonsDir}/crosscode/`
        blitzkrieg.FsUtil.mkdirs(websocketClientParentPath)
        AddonInstaller.unzipFile(zipFilePath, websocketClientParentPath)

        MenuOptions.ttsType = TTSTypes.NVDA
        MenuOptions.save()
        require('child_process').exec('"C:\\Program Files (x86)\\NVDA\\nvda.exe"') /* restart NVDA */
    }

    private static downloadFile(url: string, outPath: string): Promise<void> {
        const https: typeof import('https') = (0, eval)('require("https")')

        const file = fs.createWriteStream(outPath)

        return new Promise((resolve) => {
            https.get(url, function(response) {
                response.pipe(file)
                file.on('finish', function() {
                    file.close(() => {
                        resolve()
                    })
                })
            }).on('error', function(err) {
                fs.unlink(outPath, () => { })
                console.error(`Error downloading file: ${err.message}`)
            })
        })
    }

    private static unzipFile(path: string, outPath: string) {
        const zip = new AdmZip(path)

        try {
            zip.extractAllTo(outPath, true)
        } catch (error) {
            console.error('Error extracting zip file:', error)
        }
    }
}
