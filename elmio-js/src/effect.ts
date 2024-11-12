import type { Browser } from "./browser";
import type { Clipboard } from "./browser/clipboard";
import type { Console } from "./browser/console";
import type { IDate } from "./browser/date";
import type { History } from "./browser/history";
import type { LocalStorage } from "./browser/local_storage";
import type { Location } from "./browser/location";
import type { SessionStorage } from "./browser/session_storage";
import type { Window } from "./browser/window";
import { BrowserEffectHandler } from "./effect/browser";
import { ClipboardEffectHandler } from "./effect/clipboard";
import { ConsoleEffectHandler } from "./effect/console";
import { CustomEffectHandler } from "./effect/custom";
import type { Config as CustomEffectConfig } from "./effect/custom";
import { DomEffectHandler } from "./effect/dom";
import { LocalStorageEffectHandler } from "./effect/local_storage";
import { NavigationEffectHandler } from "./effect/navigation";
import { SessionStorageEffectHandler } from "./effect/session_storage";
import { TimeEffectHandler } from "./effect/time";
import { Domain, type Logger, Verbosity } from "./logger";
import type {
    BrowserEffect,
    ClipboardEffect,
    ConsoleEffect,
    DomEffect,
    Effect,
    EffectfulMsg,
    LocalStorageEffect,
    Msg,
    NavigationEffect,
    SessionStorageEffect,
    TimeEffect,
} from "./rust/types";
import type JsonHelper from "./utils/json";

export class EffectHandler {
    private readonly domHandler: DomEffectHandler;
    private readonly consoleHandler: ConsoleEffectHandler;
    private readonly clipboardHandler: ClipboardEffectHandler;
    private readonly browserHandler: BrowserEffectHandler;
    private readonly timeHandler: TimeEffectHandler;
    private readonly navigationHandler: NavigationEffectHandler;
    private readonly localStorageHandler: LocalStorageEffectHandler;
    private readonly sessionStorageHandler: SessionStorageEffectHandler;
    private readonly customEffectHandler: CustomEffectHandler;

    constructor(
        private readonly customEffectConfig: CustomEffectConfig,
        private readonly browser: Browser,
        private readonly console: Console,
        private readonly clipboard: Clipboard,
        private readonly window: Window,
        private readonly date: IDate,
        private readonly history: History,
        private readonly location: Location,
        private readonly localStorage: LocalStorage,
        private readonly sessionStorage: SessionStorage,
        private readonly jsonHelper: JsonHelper,
        private readonly logger: Logger,
        private readonly onMsg: (msg: Msg) => void,
    ) {
        this.domHandler = new DomEffectHandler(
            this.browser,
            this.window,
            this.jsonHelper,
            this.logger,
        );

        this.consoleHandler = new ConsoleEffectHandler(this.console, this.logger);

        this.clipboardHandler = new ClipboardEffectHandler(this.clipboard, this.logger);

        this.browserHandler = new BrowserEffectHandler(this.browser, this.logger);

        this.timeHandler = new TimeEffectHandler(this.date, this.logger);

        this.navigationHandler = new NavigationEffectHandler(
            this.history,
            this.location,
            this.logger,
        );

        this.localStorageHandler = new LocalStorageEffectHandler(
            this.localStorage,
            this.jsonHelper,
            this.logger,
        );

        this.sessionStorageHandler = new SessionStorageEffectHandler(
            this.sessionStorage,
            this.jsonHelper,
            this.logger,
        );

        this.customEffectHandler = new CustomEffectHandler(this.customEffectConfig, this.logger);
    }

    public handle(effects: Effect[]) {
        const groupedEffects = groupEffects(effects, this.logger);

        this.logger.debug({
            domain: Domain.Effects,
            verbosity: Verbosity.Normal,
            message: "Handling effects",
            context: groupedEffects,
        });

        for (const effectfulMsg of groupedEffects.effectfulMsgEffects) {
            this.handleEffectfulMsg(effectfulMsg);
        }

        for (const domEffect of groupedEffects.domEffects) {
            this.domHandler.handle(domEffect, null);
        }

        for (const consoleEffect of groupedEffects.consoleEffects) {
            this.consoleHandler.handle(consoleEffect);
        }

        for (const clipboardEffect of groupedEffects.clipboardEffects) {
            this.clipboardHandler.handle(clipboardEffect);
        }

        for (const navigationEffect of groupedEffects.navigationEffects) {
            this.navigationHandler.handle(navigationEffect);
        }

        for (const localStorageEffect of groupedEffects.localStorageEffects) {
            this.localStorageHandler.handle(localStorageEffect);
        }

        for (const sessionStorageEffect of groupedEffects.sessionStorageEffects) {
            this.sessionStorageHandler.handle(sessionStorageEffect);
        }

        for (const customEffect of groupedEffects.customEffects) {
            this.customEffectHandler.handle(customEffect);
        }
    }

    public run(effect: Effect, sourceEvent: Event | null): Promise<any> {
        switch (effect.type) {
            case "none":
                throw new Error("Cannot run 'none' effect");

            case "effectfulMsg":
                throw new Error("Cannot run 'effectful message' effect");

            case "navigation":
                return this.navigationHandler.handle(effect.config as NavigationEffect);

            case "localStorage":
                return this.localStorageHandler.handle(effect.config as LocalStorageEffect);

            case "sessionStorage":
                return this.sessionStorageHandler.handle(effect.config as SessionStorageEffect);

            case "dom":
                return this.domHandler.handle(effect.config as DomEffect, sourceEvent);

            case "console":
                return this.consoleHandler.handle(effect.config as ConsoleEffect);

            case "clipboard":
                return this.clipboardHandler.handle(effect.config as ClipboardEffect);

            case "browser":
                return this.browserHandler.handle(effect.config as BrowserEffect);

            case "time":
                return this.timeHandler.handle(effect.config as TimeEffect);

            case "custom":
                return this.customEffectHandler.handle(effect.config);

            default:
                this.logger.error({
                    domain: Domain.Effects,
                    message: "Unknown effect type",
                    context: { type: effect.type },
                });
        }

        throw new Error(`Unknown effect type: ${effect.type}`);
    }

    public setCustomEffectHandler(handler: (effect: any) => void) {
        this.customEffectHandler.setHandler(handler);
    }

    private handleEffectfulMsg({ msg, effect }: EffectfulMsg): void {
        this.onMsg({ msg, effect });
    }
}

interface GroupedEffects {
    effectfulMsgEffects: EffectfulMsg[];
    domEffects: DomEffect[];
    consoleEffects: ConsoleEffect[];
    clipboardEffects: ClipboardEffect[];
    navigationEffects: NavigationEffect[];
    localStorageEffects: LocalStorageEffect[];
    sessionStorageEffects: SessionStorageEffect[];
    customEffects: any[];
}

function groupEffects(effects: Effect[], logger: Logger): GroupedEffects {
    const groupedEffects: GroupedEffects = {
        effectfulMsgEffects: [],
        domEffects: [],
        consoleEffects: [],
        clipboardEffects: [],
        navigationEffects: [],
        localStorageEffects: [],
        sessionStorageEffects: [],
        customEffects: [],
    };

    for (const effect of effects) {
        switch (effect.type) {
            case "effectfulMsg":
                groupedEffects.effectfulMsgEffects.push(effect.config as unknown as EffectfulMsg);
                break;

            case "dom":
                groupedEffects.domEffects.push(effect.config as DomEffect);
                break;

            case "console":
                groupedEffects.consoleEffects.push(effect.config as ConsoleEffect);
                break;

            case "clipboard":
                groupedEffects.clipboardEffects.push(effect.config as ClipboardEffect);
                break;

            case "navigation":
                groupedEffects.navigationEffects.push(effect.config as NavigationEffect);
                break;

            case "localStorage":
                groupedEffects.localStorageEffects.push(effect.config as LocalStorageEffect);
                break;

            case "sessionStorage":
                groupedEffects.sessionStorageEffects.push(effect.config as SessionStorageEffect);
                break;

            case "custom":
                groupedEffects.customEffects.push(effect.config);
                break;

            case "none":
                break;

            default:
                logger.warn({
                    domain: Domain.Effects,
                    message: `Unknown effect type: ${effect.type}`,
                    context: { type: effect.type },
                });
        }
    }

    return groupedEffects;
}
