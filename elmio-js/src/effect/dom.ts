import type { Browser } from "../browser";
import type { Window, WindowSize } from "../browser/window";
import { Domain, type Logger, Verbosity } from "../logger";
import type {
    DispatchEvent,
    DomEffect,
    FileInfo,
    FocusElement,
    GetElementValue,
    GetFiles,
    GetRadioGroupValue,
    GetTargetDataValue,
    SelectInputText,
} from "../rust/types";
import type JsonHelper from "../utils/json";

export class DomEffectHandler {
    constructor(
        private readonly browser: Browser,
        private readonly window: Window,
        private readonly jsonHelper: JsonHelper,
        private readonly logger: Logger,
    ) {}

    public async handle(effect: DomEffect, sourceEvent: Event | null) {
        switch (effect.type) {
            case "dispatchEvent": {
                return this.dispatchEvent(effect.config as DispatchEvent);
            }

            case "focusElement": {
                return this.focusElement(effect.config as FocusElement);
            }

            case "selectInputText": {
                return this.selectInputText(effect.config as SelectInputText);
            }

            case "getWindowSize": {
                return this.getWindowSize();
            }

            case "getElementValue": {
                return this.getElementValue(effect.config as GetElementValue);
            }

            case "getRadioGroupValue": {
                return this.getRadioGroupValue(effect.config as GetRadioGroupValue);
            }

            case "getFiles": {
                return this.getFiles(effect.config as GetFiles);
            }

            case "getTargetDataValue": {
                return this.getTargetDataValue(effect.config as GetTargetDataValue, sourceEvent);
            }

            default:
                this.logger.warn({
                    domain: Domain.Dom,
                    message: `Unknown effect type: ${effect.type}`,
                    context: { type: effect.type },
                });
        }
    }

    private dispatchEvent(config: DispatchEvent): void {
        const event = new Event(config.eventType, {
            bubbles: config.bubbles,
            cancelable: config.cancelable,
        });

        this.browser.dispatchEvent(config.eventTarget, event);
    }

    private focusElement({ elementId }: FocusElement): void {
        this.browser.getElementById(elementId)?.focus();
    }

    private selectInputText({ elementId }: SelectInputText): void {
        const elem = this.browser.getElementById(elementId);
        if (elem instanceof HTMLInputElement) {
            elem.focus();
            elem.select();
        }
    }

    private getWindowSize(): WindowSize {
        return this.window.getSize();
    }

    private getElementValue({ elementId, parseAsJson }: GetElementValue): string | null {
        const elem = this.browser.getElementById(elementId) as HTMLInputElement;
        const stringValue = elem?.value;

        if (isString(stringValue)) {
            const value = parseAsJson ? this.jsonHelper.parse<string>(stringValue) : stringValue;

            this.logger.debug({
                domain: Domain.Dom,
                verbosity: Verbosity.Normal,
                message: "Got value from element",
                context: {
                    elementId,
                    value,
                },
            });

            return value;
        }

        this.logger.error({
            domain: Domain.Dom,
            message: "Failed to get value from element",
            context: {
                elementId,
            },
        });

        return null;
    }

    private getRadioGroupValue({ selector, parseAsJson }: GetRadioGroupValue): string | null {
        const nodeList = document.querySelectorAll<HTMLInputElement>(selector);
        const checkedElems = Array.from(nodeList).filter((elem) => elem.checked);

        if (checkedElems.length === 0) {
            return null;
        }

        const stringValue = checkedElems[0].value;

        if (isString(stringValue)) {
            const value = parseAsJson ? this.jsonHelper.parse<string>(stringValue) : stringValue;

            this.logger.debug({
                domain: Domain.Dom,
                verbosity: Verbosity.Normal,
                message: "Got value from radio group",
                context: {
                    selector,
                    value,
                },
            });

            return value;
        }

        this.logger.error({
            domain: Domain.Dom,
            message: "Failed to get value from radio group",
            context: {
                selector,
            },
        });

        return null;
    }

    private getFiles({ elementId }: GetFiles): FileInfo[] {
        const elem = this.browser.getElementById(elementId) as HTMLInputElement;
        if (!elem.files) {
            return [];
        }

        const files = Array.from(elem.files).map((file) => {
            return {
                name: file.name,
                mime: file.type,
                size: file.size,
                lastModified: file.lastModified,
            };
        });

        this.logger.debug({
            domain: Domain.Dom,
            verbosity: Verbosity.Normal,
            message: "Got files from element",
            context: {
                elementId,
                files,
            },
        });

        return files;
    }

    private getTargetDataValue(
        { name, parseAsJson }: GetTargetDataValue,
        sourceEvent: Event | null,
    ): string | null {
        const target = closestTargetFromEvent(sourceEvent, `[data-${name}]`);
        if (!target) {
            return null;
        }

        const stringValue = target.getAttribute(`data-${name}`);

        if (stringValue != null && isString(stringValue)) {
            const value = parseAsJson ? this.jsonHelper.parse<string>(stringValue) : stringValue;

            this.logger.debug({
                domain: Domain.Dom,
                verbosity: Verbosity.Normal,
                message: "Got value from data attribute",
                context: {
                    attribute: `data-${name}`,
                    value,
                },
            });

            return value;
        }

        this.logger.error({
            domain: Domain.Dom,
            message: "Failed to get value from data attribute",
            context: {
                attribute: `data-${name}`,
            },
        });

        return null;
    }
}

function closestTargetFromEvent(event: Event | null, selector: string): HTMLElement | null {
    const eventTarget = event?.target;
    if (!eventTarget || !(eventTarget instanceof Element)) {
        return null;
    }

    const target = eventTarget.closest(selector);
    if (!target || !(target instanceof HTMLElement)) {
        return null;
    }

    return target;
}

function isString<T>(value: T): boolean {
    return typeof value === "string";
}
