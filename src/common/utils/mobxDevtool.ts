import { injectStores } from '@mobx-devtools/tools'

export const rootStates = {} as const

injectStores(rootStates)
