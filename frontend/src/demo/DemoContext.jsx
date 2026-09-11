import { createContext, useContext } from 'react'

const DemoContext = createContext({ exitDemo: () => {} })

export function DemoProvider({ exitDemo, children }) {
    return <DemoContext.Provider value={{ exitDemo }}>{children}</DemoContext.Provider>
}

export const useDemo = () => useContext(DemoContext)
