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

String.prototype.supplant = function (this: string, o: any) {
    return this.replace(/{([^{}]*)}/g, function (a: any, b: any) {
        var r = o[b]
        return typeof r === 'string' || typeof r === 'number' ? r : a
    })
}
