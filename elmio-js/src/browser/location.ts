interface Location {
    assign(url: string): void;
}

class BrowserLocation implements Location {
    public assign(url: string): void {
        location.assign(url);
    }
}

export { type Location, BrowserLocation };
