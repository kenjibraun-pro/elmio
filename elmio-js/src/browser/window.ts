export interface Window {
    getSize(): WindowSize;
}

export interface WindowSize {
    width: number;
    height: number;
}

export class BrowserWindow implements Window {
    public getSize(): WindowSize {
        return {
            width: window.innerWidth,
            height: window.innerHeight,
        };
    }
}
