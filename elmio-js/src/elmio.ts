import morphdom from "morphdom";
import { type Browser, RealBrowser } from "./browser";
import { BrowserClipboard, type Clipboard } from "./browser/clipboard";
import { BrowserConsole, type Console } from "./browser/console";
import { BrowserDate, type IDate } from "./browser/date";
import { BrowserHistory, type History } from "./browser/history";
import { BrowserLocalStorage, type LocalStorage } from "./browser/local_storage";
import { BrowserLocation, type Location } from "./browser/location";
import { BrowserSessionStorage, type SessionStorage } from "./browser/session_storage";
import { BrowserWindow, type Window } from "./browser/window";
import { EffectHandler } from "./effect";
import { type Config as CustomEffectConfig, defaultCustomEffectConfig } from "./effect/custom";
import {
    BrowserLogger,
    Domain,
    type Logger,
    type Config as LoggerConfig,
    Verbosity,
    defaultLoggerConfig,
} from "./logger";
import type { Effect, JsMsg, Model, Msg, Page } from "./rust/types";
import { SubscriptionManager } from "./subscription";
import { isObject } from "./utils/helper";
import JsonHelper from "./utils/json";
import replacePlaceholder from "./utils/msg";

export interface Config {
    loggerConfig?: LoggerConfig;
    customEffectConfig?: CustomEffectConfig;
}

interface State {
    model: Model;
}

export class Elmio {
    private readonly appElem: HTMLElement;
    private readonly browser: Browser;
    private readonly console: Console;
    private readonly clipboard: Clipboard;
    private readonly window: Window;
    private readonly date: IDate;
    private readonly localStorage: LocalStorage;
    private readonly sessionStorage: SessionStorage;
    private readonly logger: Logger;
    private readonly jsonHelper: JsonHelper;
    private readonly history: History;
    private readonly location: Location;
    private readonly subscriptionManager: SubscriptionManager;
    private readonly effectHandler: EffectHandler;

    private readonly state: State = {
        model: null,
    };

    constructor(
        private readonly page: Page,
        private readonly config?: Config,
    ) {
        this.browser = new RealBrowser();
        this.console = new BrowserConsole();
        this.clipboard = new BrowserClipboard();

        const appId = page.id();
        const appElem = this.browser.getElementById(appId);
        if (!appElem) {
            throw new Error(`Could not find element with id '${appId}'`);
        }

        this.appElem = appElem;
        this.window = new BrowserWindow();
        this.date = new BrowserDate();
        this.localStorage = new BrowserLocalStorage();
        this.sessionStorage = new BrowserSessionStorage();
        this.logger = new BrowserLogger(config?.loggerConfig ?? defaultLoggerConfig());
        this.jsonHelper = new JsonHelper(this.logger);
        this.history = new BrowserHistory();
        this.location = new BrowserLocation();
        this.subscriptionManager = new SubscriptionManager(
            this.browser,
            this.logger,
            (msg: Msg) => {
                this.update(msg);
            },
        );
        this.effectHandler = new EffectHandler(
            this.config?.customEffectConfig ?? defaultCustomEffectConfig(),
            this.browser,
            this.console,
            this.clipboard,
            this.window,
            this.date,
            this.history,
            this.location,
            this.localStorage,
            this.sessionStorage,
            this.jsonHelper,
            this.logger,
            (msg: Msg) => {
                this.update(msg);
            },
        );
    }

    public init() {
        const { model, effects } = this.page.init();
        this.handleModelAndEffects(model, effects);
    }

    public sendMessage(type: string, data: any) {
        this.updateFromJs({ type, data });
    }

    public onCustomEffect(handler: (effect: any) => void) {
        this.effectHandler.setCustomEffectHandler(handler);
    }

    private updateDom(markup: string) {
        morphdom(this.appElem, markup, {
            onBeforeElUpdated(fromElem, _toElem) {
                // Skip elements which has the unmanaged attribute
                const isUnmanaged = fromElem.hasAttribute("unmanaged");
                if (isUnmanaged) {
                    return false;
                }

                return true;
            },
        });

        this.logger.debug({
            domain: Domain.Core,
            verbosity: Verbosity.Verbose,
            message: "Updated DOM with new markup",
            context: {
                markup: markup,
            },
        });
    }

    private async prepareMsg(msg: Msg): Promise<any> {
        if (!("effect" in msg)) {
            return msg.msg;
        }

        const effectValue = await this.effectHandler.run(msg.effect, msg.sourceEvent);

        if (!isObject(msg.msg)) {
            return msg.msg;
        }

        return replacePlaceholder(msg.msg, effectValue);
    }

    private async update(msg: Msg) {
        const realMsg = await this.prepareMsg(msg);

        this.logger.debug({
            domain: Domain.Core,
            verbosity: Verbosity.Normal,
            message: "Sending msg to rust",
            context: {
                msg: realMsg,
            },
        });

        const { model, effects } = this.page.update(realMsg, this.state.model);
        this.handleModelAndEffects(model, effects);
    }

    private updateFromJs(msg: JsMsg) {
        this.logger.debug({
            domain: Domain.Core,
            verbosity: Verbosity.Normal,
            message: "Sending js msg to rust",
            context: {
                msg,
            },
        });

        const { model, effects } = this.page.updateFromJs(msg, this.state.model);
        this.handleModelAndEffects(model, effects);
    }

    private handleModelAndEffects(model: Model, effects: Effect[]) {
        this.logger.debug({
            domain: Domain.Core,
            verbosity: Verbosity.Normal,
            message: "Updating model",
            context: { model },
        });

        this.state.model = model;
        const markup = this.page.viewBody(this.state.model);
        this.updateDom(markup);

        const newSubscriptions = this.page.getSubscriptions(this.state.model);
        this.subscriptionManager.handle(newSubscriptions);
        this.effectHandler.handle(effects);
    }
}
