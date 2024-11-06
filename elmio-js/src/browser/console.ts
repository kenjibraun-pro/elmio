export interface IConsole<T> {
    log(...args: T[]): void;
}

export class BrowserConsole<T> implements IConsole<T> {
    public log(...args: T[]): void {
        console.log(...args);
    }
}
