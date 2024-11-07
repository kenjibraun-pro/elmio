import { EventTarget, EventTargetElement } from "./rust/types";

interface Browser {
    getElementById(id: string): HTMLElement | null;
    getActiveElement(): Element | null;
    addEventListener(
        target: EventListenTarget,
        type: string,
        listener: EventListenerOrEventListenerObject,
        config: EventListenConfig,
    ): AbortFunction;
    setInterval(handler: TimerHandler, timeout: number): AbortFunction;
    setTimeout(handler: TimerHandler, timeout: number): AbortFunction;
    dispatchEvent(eventTarget: EventTarget, event: Event): void;
}

class RealBrowser implements Browser {
    public getElementById(id: string): HTMLElement | null {
        return document.getElementById(id);
    }

    public getActiveElement(): Element | null {
        return document.activeElement;
    }

    public addEventListener(
        target: EventListenTarget,
        type: string,
        listener: EventListenerOrEventListenerObject,
        config: EventListenConfig,
    ): AbortFunction {
        const controller = new AbortController();
        const listenTarget = this.getListenTarget(target);

        listenTarget.addEventListener(type, listener, {
            capture: config.capture,
            passive: config.passive,
            signal: controller.signal,
        });

        return {
            abort: () => {
                controller.abort();
            },
        };
    }

    public setInterval(handler: TimerHandler, timeout?: number): AbortFunction {
        const id = window.setInterval(handler, timeout);
        return {
            abort: () => {
                window.clearInterval(id);
            },
        };
    }

    public setTimeout(handler: TimerHandler, timeout?: number): AbortFunction {
        const id = window.setTimeout(handler, timeout);
        return {
            abort: () => {
                window.clearTimeout(id);
            },
        };
    }

    public dispatchEvent(eventTarget: EventTarget, event: Event): void {
        const { type, config } = eventTarget;
        switch (type) {
            case "window":
                window.dispatchEvent(event);
                break;
            case "document":
                document.dispatchEvent(event);
                break;
            case "element":
                const _config = config as EventTargetElement;
                const element = document.getElementById(_config.elementId);
                element?.dispatchEvent(event);
                break;
        }
    }

    private getListenTarget(target: EventListenTarget): Window | Document {
        switch (target) {
            case EventListenTarget.Window:
                return window;
            case EventListenTarget.Document:
                return document;
        }
    }
}

function getEventListenTarget(str: string): EventListenTarget {
    switch (str) {
        case "window":
            return EventListenTarget.Window;
        case "document":
            return EventListenTarget.Document;
        default:
            throw new TypeError(`Unknown event listen target: ${str}`);
    }
}

interface EventListenConfig {
    capture: boolean;
    passive: boolean;
}

enum EventListenTarget {
    Window,
    Document,
}

interface AbortFunction {
    abort: () => void;
}

type TimerHandler = () => void;

export { Browser, RealBrowser, AbortFunction, getEventListenTarget };
