export interface Clipboard {
    writeText(text: string): void;
}

export class BrowserClipboard implements Clipboard {
    public writeText(text: string): void {
        navigator.clipboard.writeText(text);
    }
}
