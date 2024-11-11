export interface SessionStorage {
    setItem(key: string, value: string): void;
    getItem(key: string): string | null;
}

export class BrowserSessionStorage implements SessionStorage {
    public setItem(key: string, value: string): void {
        sessionStorage.setItem(key, value);
    }

    public getItem(key: string): string | null {
        return sessionStorage.getItem(key);
    }
}
