// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { BrowserWindow, Elmio, type Page, RealBrowser, rustEnum } from "../src";

class TestPage implements Page {
    count = 0;
    id() {
        return "test-app";
    }
    init() {
        return { model: { count: this.count }, effects: [] };
    }
    update(msg: any, model: any) {
        switch (msg.type) {
            case "INCREMENT":
                return {
                    model: { count: model.count + 1 },
                    effects: [],
                };
            case "DECREMENT":
                return { model: { count: model.count - 1 }, effects: [] };

            default:
                return { model, effects: [] };
        }
    }
    updateFromJs(msg: any, model: any) {
        return this.update(msg, model);
    }
    getSubscriptions() {
        return [];
    }
    viewBody(model: any) {
        return `<div id="test-app"><span>${model.count}</span></div>`;
    }
}

describe("Elmio Runtime", () => {
    let elmio: Elmio;
    let mockElement: HTMLElement;

    beforeEach(() => {
        mockElement = document.createElement("div");
        mockElement.id = "test-app";
        vi.spyOn(document, "getElementById").mockReturnValue(mockElement);

        elmio = new Elmio(new TestPage(), {
            loggerConfig: undefined,
            customEffectConfig: undefined,
        });
    });

    it("initializes with correct initial state", () => {
        elmio.init();
        expect(document.getElementById).toHaveBeenCalledWith("test-app");
        expect(mockElement.innerHTML).toContain("<span>0</span>");
    });

    it("handles increment and decrement messages", () => {
        elmio.init();
        elmio.sendMessage("INCREMENT", null);
        expect(mockElement.innerHTML).toContain("<span>1</span>");

        elmio.sendMessage("DECREMENT", null);
        expect(mockElement.innerHTML).toContain("<span>0</span>");
    });

    it("processes custom effects via handler", () => {
        const effectHandler = vi.fn();
        elmio.onCustomEffect(effectHandler);

        elmio.init();

        // TODO: Add custom effect test
    });
});

describe("Browser API Integration", () => {
    beforeEach(() => {
        globalThis.window.addEventListener = vi.fn();
        globalThis.window.setTimeout = vi.fn();
        globalThis.window.clearTimeout = vi.fn();
        globalThis.window.setInterval = vi.fn();
        globalThis.window.clearInterval = vi.fn();
    });

    it("gets window size correctly", () => {
        const window = new BrowserWindow();
        const size = window.getSize();

        expect(size).toEqual({
            width: 1024,
            height: 768,
        });
    });

    it("handles DOM events correctly", () => {
        const browser = new RealBrowser();
        const abortFn = browser.addEventListener(0, "resize", () => {}, {
            capture: false,
            passive: true,
        });

        expect(globalThis.window.addEventListener).toHaveBeenCalled();
        expect(typeof abortFn.abort).toBe("function");
    });

    it("handles timeouts correctly", () => {
        const browser = new RealBrowser();
        const handler = vi.fn();

        const abortFn = browser.setTimeout(handler, 1000);
        expect(globalThis.window.setTimeout).toHaveBeenCalledWith(handler, 1000);

        abortFn.abort();
        expect(globalThis.window.clearTimeout).toHaveBeenCalled();
    });

    it("handles intervals correctly", () => {
        const browser = new RealBrowser();
        const handler = vi.fn();

        const abortFn = browser.setInterval(handler, 1000);
        expect(globalThis.window.setInterval).toHaveBeenCalledWith(handler, 1000);

        abortFn.abort();
        expect(globalThis.window.clearInterval).toHaveBeenCalled();
    });
});

describe("Rust Enum Integration", () => {
    it("creates simple enums", () => {
        const simpleEnum = rustEnum.withoutValue("Simple");
        expect(simpleEnum).toBe("Simple");
    });

    it("creates tuple enums", () => {
        const tupleEnum = rustEnum.tuple("Tuple", ["value1", "value2"]);
        expect(tupleEnum).toEqual({ Tuple: ["value1", "value2"] });
    });

    it("creates object enums", () => {
        const objectEnum = rustEnum.object("Object", { field: "value" });
        expect(objectEnum).toEqual({ Object: { field: "value" } });
    });
});
