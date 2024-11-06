export interface IHistory {
    pushUrl(url: string): void;
    replaceUrl(url: string): void;
}

export class BrowserHistory implements IHistory {
    public pushUrl(url: string): void {
        history.pushState({}, "", url);
    }

    public replaceUrl(url: string): void {
        history.replaceState({}, "", url);
    }
}
