interface LocationInterface {
    assign(url: string): void;
}

class BrowserLocation implements LocationInterface {
    public assign(url: string): void {
        location.assign(url);
    }
}

export { LocationInterface, BrowserLocation };
