import type { History } from "../browser/history";
import type { Location } from "../browser/location";
import { Domain, type Logger } from "../logger";
import type { NavigationEffect } from "../rust/types";

export class NavigationEffectHandler {
    constructor(
        private readonly history: History,
        private readonly location: Location,
        private readonly logger: Logger,
    ) {}

    public async handle(effect: NavigationEffect) {
        switch (effect.type) {
            case "pushUrl":
                return this.pushUrl(effect.config);

            case "replaceUrl":
                return this.replaceUrl(effect.config);

            case "setLocation":
                return this.setLocation(effect.config);

            default:
                this.logger.warn({
                    domain: Domain.Navigation,
                    message: `Unknown navigation effect type: ${effect.type}`,
                    context: { type: effect.type },
                });
        }
    }

    private pushUrl(url: string): void {
        this.history.pushUrl(url);
    }

    private replaceUrl(url: string): void {
        this.history.replaceUrl(url);
    }

    private setLocation(url: string): void {
        this.location.assign(url);
    }
}
