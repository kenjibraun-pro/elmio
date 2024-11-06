export interface IDate {
    now(): number;
}

export class BrowserDate implements IDate {
    public now(): number {
        return Date.now();
    }
}
