import { WebSocket, WebSocketServer } from 'ws'
import { CharacterSpeakData, TTS, TTSInterface, TTSTypes } from './tts'
import CrossedEyes from '../plugin'

import AdmZip from 'adm-zip'
import { MenuOptions } from '../options'

const fs: typeof import('fs') = (0, eval)('require("fs")')

export class TTSNvda implements TTSInterface {
    supportedPlatforms = new Set<('win32' | 'linux' | 'darwin')>(['win32'])
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
            this.speak('NVDA connected')
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
            console.log('reviced: speechEnd')
        }
    }

    sendCommand(command: string) {
        for (const socket of this.sockets) {
            socket.send(command)
        }
        console.log('sending:', command)
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
        console.log('nvda addon install attempt!')
        console.log(process.platform)
        if (process.platform == 'win32' && await AddonInstaller.isNvdaRunning()) {
            console.log('nvda running')
            if (this.isAddonInstalled()) {
                console.log('addon installed')
                const inst = AddonInstaller.getInstalledAddonVersion()
                const pkg = await AddonInstaller.getPackageAddonVersion()
                console.log('version diffs: inst:', inst, 'pkg:', pkg)
                if (pkg != inst) {
                    this.installAddon()
                }
            } else {
                console.log('addon not installed')
                this.installAddon()
            }
        }
    }

    private static async isNvdaRunning(): Promise<boolean> {
        function isProcessRunning(name: string): Promise<boolean> {
            return new Promise((resolve) => {
                require('child_process').exec(`tasklist /FI "IMAGENAME eq ${name}"`, (_: string, stdout: string, __: string) => {
                    stdout = stdout.trim()
                    resolve(stdout.length > 140) /* if the output string is long enough, it means that the process is running */
                })
            })
        }
        return isProcessRunning('nvda.exe')
    }

    private static isAddonInstalled(): boolean {
        console.log('isAddonInstalled check start')
        try { console.log(blitzkrieg.FsUtil.listFiles(`${process.env.APPDATA ?? ''}/nvda/addons/`)) } catch (e) { console.log(e) }
        try { console.log(blitzkrieg.FsUtil.listFiles(`${process.env.APPDATA ?? ''}/nvda/addons/crosscode/`)) } catch (e) { console.log(e) }
        try { console.log(blitzkrieg.FsUtil.listFiles(`${process.env.APPDATA ?? ''}/nvda/addons/crosscode/appModules`)) } catch (e) { console.log(e) }
        console.log('isAddonInstalled check end')
        return blitzkrieg.FsUtil.doesFileExist(`${process.env.APPDATA ?? ''}/nvda/addons/crosscode/manifest.ini`)
    }

    private static getInstalledAddonVersion(): string {
        return (fs.readFileSync(`${process.env.APPDATA ?? ''}/nvda/addons/crosscode/manifest.ini`).toString()
            .match(/version = "(\d+\.\d+\.\d+)/) ?? ['', '00.00.00'])[1]
    }
    private static async getPackageAddonVersion(): Promise<string> {
        return ((await blitzkrieg.FsUtil.readFile(`${CrossedEyes.dir}/nvdaplugin/crosscode/manifest.ini`))
            .match(/version = "(\d+\.\d+\.\d+)/) ?? ['', '00.00.00'])[1]
    }

    private static async installAddon() {
        console.log('installing addon')
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
        console.log('install succesfull')
        require('child_process').exec('"C:\\Program Files (x86)\\NVDA\\nvda.exe"') /* restart NVDA */
        console.log('restarted NVDA')

        console.log('mainfest:')
        console.log(fs.readFileSync(`${process.env.APPDATA ?? ''}/nvda/addons/crosscode/manifest.ini`))
        console.log('crosscode.py:')
        console.log(fs.readFileSync(`${process.env.APPDATA ?? ''}/nvda/addons/crosscode/appModules/crosscode.py`))
        console.log('---------installation end-------------')
    }

    private static async blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
        if ('arrayBuffer' in blob) { return await blob.arrayBuffer() }

        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as ArrayBuffer)
            reader.onerror = () => reject()
            reader.readAsArrayBuffer(blob)
        })
    }

    static async downloadFile(url: string, outPath: string): Promise<void> {
        const blob = await (await fetch(url, { mode: 'cors' })).blob()
        console.log('blob:', blob)
        const arrayBuffer = await AddonInstaller.blobToArrayBuffer(blob)
        console.log('arrayBuffer:', arrayBuffer)
        return fs.promises.writeFile(outPath, Buffer.from(arrayBuffer))
    }

    private static unzipFile(path: string, outPath: string) {
        const zip = new AdmZip(path)

        try {
            zip.extractAllTo(outPath, true)
            console.log('unzipped', outPath)
        } catch (error) {
            console.error('Error extracting zip file:', error)
        }
    }
}
