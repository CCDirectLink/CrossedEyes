import { WebSocket, WebSocketServer } from 'ws'
import { CharacterSpeakData, TTS, TTSInterface, TTS_TYPES } from './tts'
import CrossedEyes from '../plugin'
import { Opts } from '../plugin'

import { Lang } from '../lang-manager'

export class TTSNvda implements TTSInterface {
    calibrateSpeed = true
    supportedPlatforms = new Set<'win32' | 'linux' | 'darwin'>(['win32'])
    queue: string[] = []

    server!: WebSocketServer
    sockets: WebSocket[] = []

    async init() {
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

        console.log('starting nvda server')
        this.server.on('connection', (socket: WebSocket) => {
            this.speak(Lang.tts.nvdaConnected)
            socket.on('close', () => {
                this.sockets.splice(this.sockets.indexOf(socket))
            })
            socket.on('message', (buff: Buffer) => {
                const msg = buff.toString()
                this.handleCommand(msg)
            })
            this.sockets.forEach(s => s.close())
            this.sockets = []
            this.sockets.push(socket)
            console.log(this.sockets)
        })
    }

    handleCommand(cmd: string) {
        if (cmd == 'speechEnd') {
            TTS.g.onSpeechEndListeners.forEach(i => i.onSpeechEnd())
            this.queue.shift()
        }
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
    characterSpeak(text: string, _: CharacterSpeakData): void {
        this.speak(text)
    }

    clearQueue(): void {
        this.sendCommand('clearQueue')
    }
}

export class AddonInstaller {
    static async checkInstall() {
        if (process.platform == 'win32' && (await AddonInstaller.isNvdaRunning())) {
            console.log('nvda running')
            if (await this.isAddonInstalled()) {
                console.log('addon installed')
                const [inst, pkg] = await Promise.all([AddonInstaller.getInstalledAddonVersion(), AddonInstaller.getPackageAddonVersion()])
                if (!pkg) throw new Error('Package version of the nvda plugin not found!')
                console.log('version diffs: inst:', inst, 'pkg:', pkg)
                if (pkg != inst) {
                    this.installAddon()
                } else {
                    if (Opts.ttsType != TTS_TYPES.NVDA) Opts.ttsType = TTS_TYPES.NVDA
                }
            } else {
                console.log('addon not installed')
                this.installAddon()
            }
        }
    }

    private static async isNvdaRunning(): Promise<boolean> {
        function isProcessRunning(name: string): Promise<boolean> {
            return new Promise(resolve => {
                require('child_process').exec(`tasklist /FI "IMAGENAME eq ${name}"`, (_: string, stdout: string, __: string) => {
                    stdout = stdout.trim()
                    resolve(stdout.length > 140) /* if the output string is long enough, it means that the process is running */
                })
            })
        }
        return isProcessRunning('nvda.exe')
    }

    private static async isAddonInstalled(): Promise<boolean> {
        return blitzkrieg.FsUtil.doesFileExist(`${process.env.APPDATA ?? ''}/nvda/addons/crosscode/manifest.ini`)
    }

    private static async getIniVersion(path: string, internal: boolean): Promise<string | undefined> {
        const text = (await blitzkrieg.FsUtil[internal ? 'readFileInternal' : 'readFileExternal'](path)).toString()
        return (text.match(/version = "(\d+\.\d+\.\d+)/) ?? [undefined, undefined])[1]
    }

    private static async getInstalledAddonVersion(): Promise<string | undefined> {
        return this.getIniVersion(`${process.env.APPDATA ?? ''}/nvda/addons/crosscode/manifest.ini`, false)
    }

    private static async getPackageAddonVersion(): Promise<string | undefined> {
        return this.getIniVersion(`${CrossedEyes.dir}/nvdaplugin/crosscode/manifest.ini`, true)
    }

    private static async installAddon() {
        console.log('installing addon')
        const path: typeof import('path') = (0, eval)('require("path")')

        const pythonWebsocketClientVersion = '1.6.4'
        const addonsDir = `${process.env.APPDATA ?? ''}/nvda/addons`
        const zipFilePath = `${process.env.TEMP}/websocket-client.zip`
        const downloadPromise: Promise<void> = blitzkrieg.FsUtil.downloadFile(
            `https://codeload.github.com/websocket-client/websocket-client/zip/refs/tags/v${pythonWebsocketClientVersion}`,
            zipFilePath
        )

        async function cp(name: string) {
            const from = `${CrossedEyes.dir}/nvdaplugin/${name}`
            const to = `${addonsDir}/${name}`
            await blitzkrieg.FsUtil.mkdirs(path.dirname(to))
            return blitzkrieg.FsUtil.copyFileInternal(from, to)
        }
        const websocketClientParentPath = `${addonsDir}/crosscode/`

        // prettier-ignore
        await Promise.all([
            cp('crosscode/manifest.ini'),
            cp('crosscode/appModules/crosscode.py'),
            blitzkrieg.FsUtil.mkdirs(websocketClientParentPath),
            downloadPromise
        ])

        await blitzkrieg.FsUtil.unzipFile(zipFilePath, websocketClientParentPath)

        Opts.ttsType = TTS_TYPES.NVDA
        console.log('install succesfull')
        require('child_process').exec('"C:\\Program Files (x86)\\NVDA\\nvda.exe"') /* restart NVDA */
        console.log('restarted NVDA')
        console.log('---------installation end-------------')
    }
}
