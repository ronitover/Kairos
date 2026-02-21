import '@testing-library/jest-dom'

// Mock localStorage
const storage: Record<string, string> = {}
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (key: string) => storage[key] ?? null,
    setItem: (key: string, value: string) => {
      storage[key] = value
    },
    removeItem: (key: string) => {
      delete storage[key]
    },
    clear: () => {
      for (const key of Object.keys(storage)) delete storage[key]
    },
    get length() {
      return Object.keys(storage).length
    },
    key: (i: number) => Object.keys(storage)[i] ?? null,
  },
  writable: true,
})
