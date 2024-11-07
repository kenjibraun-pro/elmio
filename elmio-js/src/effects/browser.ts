import { Browser } from "../browser";
import { Domain, Logger } from "../logger";
import { BrowserEffect, SetTimeoutConfig } from "../rust/types";

export class BrowserEffectHandler {
    constructor(
        private readonly browser: Browser,
        private readonly logger: Logger<BrowserEffect>,
    ) {}

    public async handle(effect: BrowserEffect): Promise<void> {
        switch (effect.type) {
            case "setTimeout":
                await this.handleSetTimeout(effect.config as SetTimeoutConfig);
                break;
            default:
                this.logger.warn({
                    domain: Domain.Browser,
                    message: `Unknown effect type: ${effect.type}`,
                    context: effect,
                });
                break;
        }
    }

    private handleSetTimeout(config: SetTimeoutConfig): Promise<void> {
        return new Promise((resolve) => {
            this.browser.setTimeout(() => {
                resolve();
            }, config.duration);
        });
    }
}
