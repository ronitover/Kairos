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
        txt2speech: {
          (
            text: string,
            options?: {
              provider?: string
              model?: string
              voice?: string
            },
          ): Promise<string | HTMLAudioElement>
          (
            args: {
              input: string
              model?: string
              voice?: string
              provider?: string
            },
          ): Promise<string | HTMLAudioElement>
        }
      }
    }
  }
}

export {}
