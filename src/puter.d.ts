declare global {
  interface Window {
    puter?: {
      ai: {
        chat: (
          messages: Array<{
            role: 'system' | 'user' | 'assistant'
            content: string
          }>,
          options?: {
            model?: string
          },
        ) => Promise<
          | string
          | {
              message?: {
                content?: string
              }
            }
        >
      }
    }
  }
}

export {}
