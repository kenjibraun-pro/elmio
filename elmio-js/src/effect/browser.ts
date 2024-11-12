import type { Browser } from "../browser";
import { Domain, type Logger } from "../logger";
import type { BrowserEffect, SetTimeoutConfig } from "../rust/types";

export class BrowserEffectHandler {
    constructor(
        private readonly browser: Browser,
        private readonly logger: Logger,
    ) {}

    public async handle(effect: BrowserEffect): Promise<void> {
        switch (effect.type) {
            case "setTimeout": {
                await this.setTimeout(effect.config as SetTimeoutConfig);
                break;
            }

            default:
                this.logger.warn({
                    domain: Domain.Browser,
                    message: `Unknown browser effect type: ${effect.type}`,
                    context: { type: effect.type },
                });
        }
    }

    private setTimeout(config: SetTimeoutConfig): Promise<void> {
        return new Promise((resolve) => {
            this.browser.setTimeout(() => {
                resolve();
            }, config.duration);
        });
    }
}
