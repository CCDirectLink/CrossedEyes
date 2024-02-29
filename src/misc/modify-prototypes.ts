/* in preload */
if (!Object.fromEntries) {
    Object.fromEntries = function <T, K extends string | number | symbol>(entries: [K, T][]): Record<K, T> {
        return entries.reduce(
            (acc: Record<K, T>, e: [K, T]) => {
                acc[e[0]] = e[1]
                return acc
            },
            {} as Record<K, T>
        )
    }
}

Object.keysT = function<K extends string | number | symbol, V>(object: Record<K, V>): K[] {
    return Object.keys(object) as K[]
}
Object.entriesT = function<K extends string | number | symbol, V>(object: Record<K, V>): [K, V][] {
    return Object.entries(object) as [K, V][]
}

if (!Array.prototype.flat) {
    Array.prototype.flat = function <T>(this: T[][]): T[] {
        return this.reduce((acc, val) => acc.concat(val), [])
    }
}

String.prototype.supplant = function (this: string, o: any) {
    return this.replace(/{([^{}]*)}/g, function (a: any, b: any) {
        var r = o[b]
        return typeof r === 'string' || typeof r === 'number' ? r : a
    })
}
