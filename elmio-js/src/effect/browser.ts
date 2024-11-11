import { Browser } from "../browser";
import { Domain, Logger } from "../logger";
import { BrowserEffect, SetTimeoutConfig } from "../rust/types";

export class BrowserEffectHandler {
    constructor(
        private readonly browser: Browser,
        private readonly logger: Logger,
    ) {}

    public handle(effect: BrowserEffect): Promise<void> {
        switch (effect.type) {
            case "setTimeout":
                return this.setTimeout(effect.config as SetTimeoutConfig);

            default:
                this.logger.warn({
                    domain: Domain.Browser,
                    message: `Unknown browser effect type: ${effect.type}`,
                    context: { type: effect.type },
                });
        }

        return Promise.resolve();
    }

    private setTimeout(config: SetTimeoutConfig): Promise<void> {
        return new Promise((resolve) => {
            this.browser.setTimeout(() => {
                resolve();
            }, config.duration);
        });
    }
}
