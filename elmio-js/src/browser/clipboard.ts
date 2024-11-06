export interface IClipboard {
    writeText(text: string): void;
}

export class BrowserClipboard implements IClipboard {
    public writeText(text: string): void {
        navigator.clipboard.writeText(text);
    }
}
