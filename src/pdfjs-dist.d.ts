declare module 'pdfjs-dist' {
  export const GlobalWorkerOptions: { workerSrc: string }
  export function getDocument(
    options: { url: string; httpHeaders?: Record<string, string> }
  ): { promise: Promise<PDFDocumentProxy> }
  export interface PDFDocumentProxy {
    numPages: number
    getPage(pageNum: number): Promise<PDFPageProxy>
  }
  export interface PDFPageProxy {
    getTextContent(): Promise<{ items: Array<{ str?: string; transform?: number[] }> }>
  }
}

declare module 'pdfjs-dist/build/pdf.worker.min.mjs?url' {
  const src: string
  export default src
}
