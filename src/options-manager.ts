import { Lang } from './lang-manager'
import CrossedEyes from './plugin'

type Enum = Record<string, number>
type Option = {
    restart?: boolean
    hasLocal?: boolean
    changeEvent?: () => void
    saveToLocalStorage?: boolean
} & (
    | (Omit<sc.OptionDefinition.BUTTON_GROUP, 'data'> & { enum: Enum; group?: string[] })
    | sc.OptionDefinition.ARRAY_SLIDER
    | (Omit<sc.OptionDefinition.OBJECT_SLIDER, 'data'> & { min: number; max: number; step: number })
    | sc.OptionDefinition.CHECKBOX
    | sc.OptionDefinition.CONTROLS
    | sc.OptionDefinition.LANGUAGE
    | sc.OptionDefinition.INFO
)

export type Options = {
    [key in sc.OPTION_CATEGORY]?: Record<string, Record<string, Option>>
}

// prettier-ignore
type FlattenOptions<T extends Record<string, Record<string, Record<string, unknown>>>> =
    T extends Record<string, infer U>
    ? (U extends Record<infer K1 extends string, infer V extends Record<string, Record<string, unknown>>> 
           ? { -readonly [K in keyof V]: K extends string ? (V[K] & { id: `${K1}-${K}` /* this isnt perfect */})
                                                          : never }
           : never)
    : never

// prettier-ignore
type UnionToIntersection<U> = (U extends any 
    ? (k: U) => void
    : never) extends ((k: infer I) => void)
    ? I
    : never

type FlattenUnion<T> = {
    [K in keyof UnionToIntersection<T>]: UnionToIntersection<T>[K]
}

type FlatOpts<T extends Options> = FlattenUnion<FlattenOptions<T>>

// prettier-ignore
export type OptsType<E extends Options> = 
    E extends Options ? (
    { [T in keyof FlatOpts<E>]: 
        // @ts-expect-error
      FlatOpts<E>[T]['type'] extends 'CHECKBOX' ? boolean
        // @ts-expect-error
    : FlatOpts<E>[T]['type'] extends 'BUTTON_GROUP' ?
        // @ts-expect-error
        FlatOpts<E>[T]['enum'][keyof FlatOpts<E>[T]['enum']]
    : number
} & { flatOpts: FlatOpts<E> }

) : never

export class MenuOptionsManager<T extends Options> {
    private headerNames: string[]
    private Opts: OptsType<T> = {} as any

    public getOpts() {
        return this.Opts
    }

    constructor(public options: T) {
        CrossedEyes.initPoststart.push(() => this.initPoststart())
        this.Opts.flatOpts = {} as any
        this.headerNames = []

        const changeEventOptions: Record<string, Option> = {}
        const localStorageOptions: Set<string> = new Set()

        Object.entriesT(this.options).forEach(([catKey, headers]) => {
            Object.entriesT(headers).forEach(([headerKey, optionEntries]) => {
                this.headerNames.push(headerKey)
                ;(Object.entriesT(optionEntries) as [keyof FlatOpts<T>, Option][]).forEach(([optKey, option], optKeyI) => {
                    const id = `${headerKey}-${optKey as string}`
                    // @ts-expect-error
                    this.Opts.flatOpts[optKey] = Object.assign(option, { id })

                    const final: Option & sc.OptionDefinition = option as any
                    final.cat = catKey
                    final.init = option.init
                    final.header = headerKey
                    final.hasDivider = optKeyI == 0

                    if (final.type == 'OBJECT_SLIDER') {
                        const data: Record<number, number> = {}
                        for (let i = final.min, h = 0; i.round(2) <= final.max; i += final.step, h++) {
                            data[h] = i.round(2)
                        }
                        final.data = data
                    } else if (final.type == 'BUTTON_GROUP') {
                        final.data = final.enum
                        final.group = Object.keys(final.data)
                    }
                    sc.OPTIONS_DEFINITION[id] = final

                    if (option.changeEvent) changeEventOptions[id] = option

                    if (option.saveToLocalStorage) {
                        if (localStorage.getItem(id) === null) localStorage.setItem(id, option.init!.toString())
                        localStorageOptions.add(id)
                    }

                    Object.defineProperty(this.Opts, optKey, {
                        get: option.saveToLocalStorage
                            ? function () {
                                  let v = localStorage.getItem(id)!
                                  if (option.type == 'CHECKBOX') return v == 'true'
                                  return parseInt(v)
                              }
                            : function () {
                                  return sc.options?.get(id)
                              },
                        set: option.saveToLocalStorage
                            ? function (v: any) {
                                  sc.options?.set(id, v)
                                  localStorage.setItem(id, v)
                                  const func = option.changeEvent
                                  func && func()
                              }
                            : function (v: any) {
                                  sc.options?.set(id, v)
                              },
                    })
                })
            })
        })

        sc.OptionModel.inject({
            set(option: string, value: any) {
                this.parent(option, value)
                localStorageOptions.has(option) && localStorage.setItem(option, value.toString())
                const func = changeEventOptions[option]?.changeEvent
                func && func()
            },
        })
    }

    initPoststart() {
        this.headerNames.forEach(h => (ig.lang.labels.sc.gui.options.headers[h] = h))

        Object.entries(this.Opts.flatOpts).forEach(([_option, _config]) => {
            const option = _option as keyof typeof Lang.opts
            const config = _config as Option & { id: number }
            const obj = { ...Lang.opts[option] }
            Object.assign(obj, config)
            ig.lang.labels.sc.gui.options[config.id] = obj
        })
    }
}
