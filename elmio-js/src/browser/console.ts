export interface Console {
    log(...args: string[]): void;
}

export class BrowserConsole implements Console {
    public log(...args: string[]): void {
        console.log(...args);
    }
}
