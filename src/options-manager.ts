import { getOptions } from './options'
import CrossedEyes, { InitPoststart } from './plugin'

type Enum = Record<string, number | string> & { [k: number]: string }
type Option = {
    name: string
    description: string
    restart?: boolean
    hasLocal?: boolean
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
type Flatten<T> = T extends Record<string, infer U> ? (U extends Record<string, infer V> ? (V extends Record<string, unknown> ? keyof V : never) : never) : never

type OptionsObj = ReturnType<typeof getOptions>
type OptionUnion = Flatten<OptionsObj>
export const MenuOptions: Record<OptionUnion, number> & { flatOpts: Record<OptionUnion, Option & { id: string }> } = {} as any

export class MenuOptionsManager implements InitPoststart {
    private options = getOptions()
    private headerNames: string[]

    constructor() {
        CrossedEyes.initPoststarters.push(this)
        MenuOptions.flatOpts = {} as any
        this.headerNames = []

        for (const _catKey in this.options) {
            const catKey = _catKey as unknown as keyof typeof this.options
            const headers = this.options[catKey]
            for (const headerKey in headers) {
                this.headerNames.push(headerKey)
                const optKeys = Object.entries((headers as any)[headerKey]) as [OptionUnion, Option][]
                for (let optKeyI = 0; optKeyI < optKeys.length; optKeyI++) {
                    const optKey: OptionUnion = optKeys[optKeyI][0]
                    const option: Option = optKeys[optKeyI][1]

                    const id = `${headerKey}-${optKey}`
                    MenuOptions.flatOpts[optKey] = Object.assign(option, { id })

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
                                    if (typeof k === 'string') {
                                        acc[k] = i
                                    }
                                    return acc
                                },
                                {} as Record<string, number>
                            )
                        final.data = data as any
                        option.group = Object.keys(data)
                    }

                    Object.defineProperty(MenuOptions, optKey, {
                        get(): number {
                            return sc.options?.get(id) as number
                        },
                        set(v: any) {
                            sc.options?.set(id, v)
                        },
                    })
                }
            }
        }
    }

    initPoststart() {
        this.headerNames.forEach(h => (ig.lang.labels.sc.gui.options.headers[h] = h))
        Object.entries(MenuOptions.flatOpts).forEach(e => (ig.lang.labels.sc.gui.options[e[1].id] = e[1]))
    }
}
