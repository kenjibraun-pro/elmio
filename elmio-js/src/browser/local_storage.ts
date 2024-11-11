export interface LocalStorage {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
}

export class BrowserLocalStorage implements LocalStorage {
    public getItem(key: string): string | null {
        return localStorage.getItem(key);
    }

    public setItem(key: string, value: string): void {
        localStorage.setItem(key, value);
    }
}
