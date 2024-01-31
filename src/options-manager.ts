import { Lang } from './lang-manager'
import { getOptions } from './options'
import CrossedEyes, { InitPoststart } from './plugin'

type Enum = Record<string, number | string> & { [k: number]: string }
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

type OptionsObj = ReturnType<typeof getOptions>
type FlatOpts = FlattenUnion<FlattenOptions<OptionsObj>>

{
    /* check if options.ts and the language .json file contain the same entries */
    // prettier-ignore
    type IfEquals<T, U, Y=unknown, N=never> =
        (<G>() => G extends T ? 1 : 2) extends
        (<G>() => G extends U ? 1 : 2) ? Y : N;
    type Diff<T, U> = T extends U ? never : T

    type OptLangEntryMissing = Diff<keyof FlatOpts, keyof (typeof Lang)['opts']>
    const optLangEntryMissingError = `ERROR: Option language entry missing: -->`
    const _optLangEntryMissingCheck: IfEquals<OptLangEntryMissing, never, typeof optLangEntryMissingError, ` ${OptLangEntryMissing}`> = optLangEntryMissingError
    typeof _optLangEntryMissingCheck /* supress unused info */

    type OptConfigEntryMissing = Diff<keyof (typeof Lang)['opts'], keyof FlatOpts>
    const optConfigEntryMissingError = `ERROR: Option config entry missing: -->`
    const _optConfigEntryMissing: IfEquals<OptConfigEntryMissing, never, typeof optConfigEntryMissingError, ` ${OptConfigEntryMissing}`> = optConfigEntryMissingError
    typeof _optConfigEntryMissing /* supress unused info */
}

// prettier-ignore
export const Opts: { [T in keyof FlatOpts]: 
      FlatOpts[T]['type'] extends 'CHECKBOX' ? boolean
    : FlatOpts[T]['type'] extends 'BUTTON_GROUP' ?
        // @ts-expect-error duno why this throws an error, but it works in practice
        FlatOpts[T]['enum'][keyof FlatOpts[T]['enum']]
    : number
} & { flatOpts: FlatOpts } = {} as any

export class MenuOptionsManager implements InitPoststart {
    private options = getOptions()
    private headerNames: string[]

    constructor() {
        CrossedEyes.initPoststarters.push(this)
        Opts.flatOpts = {} as any
        this.headerNames = []

        const changeEventOptions: Record<string, Option> = {}
        const localStorageOptions: Set<string> = new Set()

        for (const _catKey in this.options) {
            const catKey = _catKey as unknown as keyof typeof this.options
            const headers = this.options[catKey]
            for (const headerKey in headers) {
                this.headerNames.push(headerKey)
                const optKeys = Object.entries((headers as any)[headerKey]) as [keyof FlatOpts, Option][]
                for (let optKeyI = 0; optKeyI < optKeys.length; optKeyI++) {
                    const optKey: keyof FlatOpts = optKeys[optKeyI][0]
                    const option: Option = optKeys[optKeyI][1]

                    const id = `${headerKey}-${optKey}`
                    Opts.flatOpts[optKey] = Object.assign(option, { id }) as any

                    const final = (sc.OPTIONS_DEFINITION[id] = Object.assign(
                        {
                            cat: catKey as sc.OPTION_CATEGORY,
                            init: option.init as boolean,
                            header: headerKey,
                            hasDivider: optKeyI == 0,
                        },
                        option
                    ))
                    if (option.type == 'OBJECT_SLIDER') {
                        const data: Record<number, number> = {}
                        for (let i = option.min, h = 0; i.round(2) <= option.max; i += option.step, h++) {
                            data[h] = i.round(2)
                        }
                        final.data = data as any
                    } else if (option.type == 'BUTTON_GROUP') {
                        const data = Object.entries(option.enum)
                            .splice(Object.keys(option.enum).length / 2)
                            .reduce(
                                (acc, [k, _], i) => {
                                    if (typeof k === 'string') acc[k] = i
                                    return acc
                                },
                                {} as Record<string, number>
                            )
                        final.data = data as any
                        option.group = Object.keys(data)
                    }

                    if (option.changeEvent) changeEventOptions[id] = option

                    if (option.saveToLocalStorage) {
                        if (localStorage.getItem(id) === null) localStorage.setItem(id, option.init!.toString())
                        localStorageOptions.add(id)
                    }

                    Object.defineProperty(Opts, optKey, {
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
                }
            }
        }

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
        Object.entries(Opts.flatOpts).forEach(e => {
            ig.lang.labels.sc.gui.options[e[1].id] = Lang.opts[e[0] as keyof (typeof Lang)['opts']]
        })
    }
}
