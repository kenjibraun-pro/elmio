export interface Date {
    now(): number;
}

export class BrowserDate implements Date {
    public now(): number {
        return Date.now();
    }
}
