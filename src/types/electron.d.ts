export interface ElectronWindow {
  electron: {
    invoke(channel: string, ...args: unknown[]): Promise<unknown>
    sendSync(channel: string, ...args: unknown[]): unknown
    on(channel: string, listener: (event: unknown, ...args: unknown[]) => void): () => void
  }
}

declare global {
  interface Window extends ElectronWindow {}
}
