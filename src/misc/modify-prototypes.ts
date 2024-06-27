import { ValidTextLike } from '../tts/gather/api'

/* in preload */
declare global {
    interface String {
        supplant(vars: ValidTextLike[] | Record<string, ValidTextLike>): string
    }
}

export const ObjectKeysT: <K extends string | number | symbol, V>(object: Record<K, V>) => K[] = Object.keys as any
export const ObjectEntriesT: <K extends string | number | symbol, V>(object: { [key in K]?: V }) => [K, V][] = Object.entries as any
export const StringToLowerCaseT: <T extends string>(string: T) => Lowercase<T> = (str) => str.toLowerCase() as any

String.prototype.supplant = function (this: string, o: any) {
    return this.replace(/{([^{}]*)}/g, function (a: any, b: any) {
        var r = o[b]
        return typeof r === 'string' || typeof r === 'number' ? r : a
    })
}
