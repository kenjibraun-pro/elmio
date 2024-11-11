import { AbortFn, Browser, listenTargetFromString } from "../browser";
import { Domain, Logger, Verbosity } from "../logger";
import { deepEqual } from "fast-equals";

import {
    ClosestSelectorMatcher,
    EventMatcher,
    ExactSelectorMatcher,
    KeyboardKeyMatcher,
    RustEventListener,
    SubscriptionMsg,
    MouseButtonMatcher,
} from "../rust/types";

export interface ActiveEventListener<T> {
    abort: AbortFn;
    listener: RustEventListener<T>;
}

interface State<T> {
    eventListeners: ActiveEventListener<T>[];
}

export class EventListenerManager<T> {
    private readonly state: State<T> = {
        eventListeners: [],
    };

    constructor(
        private readonly browser: Browser,
        private readonly logger: Logger,
        private readonly onMsg: (msg: SubscriptionMsg<T>, event: Event) => void,
    ) {}

    public setEventListeners(newListeners: RustEventListener<T>[]) {
        const oldListeners = [...this.state.eventListeners];

        const { listenersToRemove, listenersToKeep, listenersToAdd } = prepareEventListenersDelta(
            oldListeners,
            newListeners,
        );

        this.logger.debug({
            domain: Domain.EventListener,
            verbosity: Verbosity.Normal,
            message: "Updating event listeners",
            context: {
                removing: listenersToRemove,
                keeping: listenersToKeep,
                adding: listenersToAdd,
            },
        });

        this.stopEventListeners(listenersToRemove);

        const addedListeners = listenersToAdd.map((listener) => this.startEventListener(listener));

        this.state.eventListeners = [...listenersToKeep, ...addedListeners];
    }

    private startEventListener(listener: RustEventListener<T>): ActiveEventListener<T> {
        const listenTarget = listenTargetFromString(listener.listenTarget);

        const abort = this.browser.addEventListener(
            listenTarget,
            listener.eventType,
            (event) => {
                this.handleEvent(event, listener);
            },
            {
                capture: true,
                passive: !listener.propagation.preventDefault,
            },
        );

        this.logger.debug({
            domain: Domain.EventListener,
            verbosity: Verbosity.Verbose,
            message: "Started event listener",
            context: {
                id: listener.id,
                eventType: listener.eventType,
                target: listener.listenTarget,
            },
        });

        return {
            abort,
            listener,
        };
    }

    private stopEventListeners(listeners: ActiveEventListener<T>[]) {
        listeners.forEach((listener) => {
            listener.abort.abort();

            this.logger.debug({
                domain: Domain.EventListener,
                verbosity: Verbosity.Verbose,
                message: "Stopped event listener",
                context: {
                    id: listener.listener.id,
                    eventType: listener.listener.eventType,
                    target: listener.listener.listenTarget,
                },
            });
        });
    }

    private handleEvent(event: Event, listener: RustEventListener<T>): void {
        const matchesEvent = listener.matchers.every((matcher) => {
            return this.matchEvent(matcher, event);
        });

        if (!matchesEvent) {
            this.logger.debug({
                domain: Domain.EventListener,
                verbosity: Verbosity.Verbose,
                message: "Event did not match",
                context: {
                    id: listener.id,
                    type: listener.eventType,
                    listenTarget: listener.listenTarget,
                    event,
                    matchers: listener.matchers,
                },
            });

            return;
        }

        if (listener.propagation.preventDefault) {
            event.preventDefault();
        }

        if (listener.propagation.stopPropagation) {
            event.stopPropagation();
        }

        this.logger.debug({
            domain: Domain.EventListener,
            verbosity: Verbosity.Normal,
            message: "Event matched",
            context: {
                id: listener.id,
                type: listener.eventType,
                target: listener.listenTarget,
                matchers: listener.matchers,
                event,
                msg: listener.msg,
            },
        });

        this.onMsg(listener.msg, event);
    }

    private matchEvent(matcher: EventMatcher, event: Event): boolean {
        switch (matcher.type) {
            case "exactSelector":
                return this.matchExactSelector(matcher.config as ExactSelectorMatcher, event);

            case "closestSelector":
                return this.matchClosestSelector(matcher.config as ClosestSelectorMatcher, event);

            case "mouseButton":
                return this.matchMouseButton(matcher.config as MouseButtonMatcher, event);

            case "keyboardKey":
                return this.matchKeyboardKey(matcher.config as KeyboardKeyMatcher, event);

            default:
                this.logger.warn({
                    domain: Domain.EventListener,
                    message: "Unknown event matcher",
                    context: { type: matcher.type },
                });
        }

        return false;
    }

    private matchExactSelector(matcher: ExactSelectorMatcher, event: Event): boolean {
        const elem = event.target as Element;
        if (!elem || !("matches" in elem)) {
            return false;
        }

        return elem.matches(matcher.selector);
    }

    private matchClosestSelector(matcher: ClosestSelectorMatcher, event: Event): boolean {
        const elem = event.target as Element;
        if (!elem || !("closest" in elem)) {
            return false;
        }

        return elem.closest(matcher.selector) != null;
    }

    private matchMouseButton(matcher: MouseButtonMatcher, event: Event): boolean {
        const e = event as MouseEvent;
        if (!("button" in e)) {
            return false;
        }

        return matcher.button == mouseButtonToString(e.button);
    }

    private matchKeyboardKey(matcher: KeyboardKeyMatcher, event: Event): boolean {
        const e = event as KeyboardEvent;
        if (!("code" in e)) {
            return false;
        }

        if (matcher.requiresCtrl && !e.ctrlKey) {
            return false;
        }

        if (matcher.requiresMeta && !e.metaKey) {
            return false;
        }

        const key = matcher.key.toLowerCase();
        const code = e.code.toLowerCase();

        return code === key || key === "any";
    }
}

interface EventListenersDelta<T> {
    listenersToRemove: ActiveEventListener<T>[];
    listenersToKeep: ActiveEventListener<T>[];
    listenersToAdd: RustEventListener<T>[];
}

function prepareEventListenersDelta<T>(
    oldListeners: ActiveEventListener<T>[],
    newListeners: RustEventListener<T>[],
): EventListenersDelta<T> {
    const listenersToRemove: ActiveEventListener<T>[] = [];
    const listenersToKeep: ActiveEventListener<T>[] = [];
    const listenersToAdd: RustEventListener<T>[] = [];

    const newListenerById = new Map(newListeners.map((listener) => [listener.id, listener]));

    oldListeners.forEach((listener) => {
        let newListener = newListenerById.get(listener.listener.id);

        if (newListener && hasSameMsg(listener.listener, newListener)) {
            listenersToKeep.push(listener);
        } else {
            listenersToRemove.push(listener);
        }
    });

    const oldListenerById = new Map(listenersToKeep.map(({ listener }) => [listener.id, listener]));

    newListeners.forEach((listener) => {
        let oldListener = oldListenerById.get(listener.id);

        if (!oldListener) {
            listenersToAdd.push(listener);
        }
    });

    return {
        listenersToRemove,
        listenersToKeep,
        listenersToAdd,
    };
}

function hasSameMsg<T>(a: RustEventListener<T>, b: RustEventListener<T>): boolean {
    return deepEqual(a.msg.config, b.msg.config);
}

function mouseButtonToString(n: number): string | null {
    switch (n) {
        case 0:
            return "main";
        case 1:
            return "auxiliary";
        case 2:
            return "secondary";
        case 3:
            return "fourth";
        case 4:
            return "fifth";
    }

    return null;
}
