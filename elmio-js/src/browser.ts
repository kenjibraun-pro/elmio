import type { EventTarget, EventTargetElement } from "./rust/types";

export interface Browser {
    getElementById(id: string): HTMLElement | null;
    getActiveElement(): Element | null;
    addEventListener(
        target: ListenTarget,
        type: string,
        listener: EventListenerOrEventListenerObject,
        config: ListenConfig,
    ): AbortFn;
    setInterval(handler: TimerHandler, timeout?: number): AbortFn;
    setTimeout(handler: TimerHandler, timeout?: number): AbortFn;
    dispatchEvent(eventTarget: EventTarget, event: Event): void;
}

export class RealBrowser implements Browser {
    public getElementById(id: string): HTMLElement | null {
        return document.getElementById(id);
    }

    public getActiveElement(): Element | null {
        return document.activeElement;
    }

    public addEventListener(
        target: ListenTarget,
        type: string,
        listener: EventListenerOrEventListenerObject,
        config: ListenConfig,
    ): AbortFn {
        const controller = new AbortController();
        const listenTarget = getListenTarget(target);

        listenTarget.addEventListener(type, listener, {
            signal: controller.signal,
            capture: config.capture,
            passive: config.passive,
        });

        return {
            abort() {
                controller.abort();
            },
        };
    }

    public setInterval(handler: TimerHandler, timeout?: number): AbortFn {
        const id = window.setInterval(handler, timeout);

        return {
            abort() {
                window.clearInterval(id);
            },
        };
    }

    public setTimeout(handler: TimerHandler, timeout?: number): AbortFn {
        const id = window.setTimeout(handler, timeout);

        return {
            abort() {
                window.clearTimeout(id);
            },
        };
    }

    public dispatchEvent(eventTarget: EventTarget, event: Event): void {
        switch (eventTarget.type) {
            case "window":
                window.dispatchEvent(event);
                break;

            case "document":
                document.dispatchEvent(event);
                break;

            case "element": {
                const config = eventTarget.config as EventTargetElement;
                const element = document.getElementById(config.elementId);
                element?.dispatchEvent(event);
                break;
            }
        }
    }
}

enum ListenTarget {
    Window = 0,
    Document = 1,
}

export function listenTargetFromString(str: string): ListenTarget {
    switch (str) {
        case "window":
            return ListenTarget.Window;

        case "document":
            return ListenTarget.Document;
    }

    throw new Error(`Unknown listen target: ${str}`);
}

function getListenTarget(target: ListenTarget): Window | Document {
    switch (target) {
        case ListenTarget.Window:
            return window;
        case ListenTarget.Document:
            return document;
    }
}

interface ListenConfig {
    capture: boolean;
    passive: boolean;
}

export interface AbortFn {
    abort: () => void;
}
