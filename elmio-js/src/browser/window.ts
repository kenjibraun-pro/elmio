export interface IWindow {
    getSize(): IWindowSize;
}

export interface IWindowSize {
    width: number;
    height: number;
}

export class BrowserWindow implements IWindow {
    public getSize(): IWindowSize {
        return {
            width: window.innerWidth,
            height: window.innerHeight,
        };
    }
}
