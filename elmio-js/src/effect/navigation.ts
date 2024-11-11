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

    public handle(effect: NavigationEffect): Promise<void> {
        switch (effect.type) {
            case "pushUrl":
                this.pushUrl(effect.config);
                break;

            case "replaceUrl":
                this.replaceUrl(effect.config);
                break;

            case "setLocation":
                this.setLocation(effect.config);
                break;

            default:
                this.logger.warn({
                    domain: Domain.Navigation,
                    message: `Unknown navigation effect type: ${effect.type}`,
                    context: { type: effect.type },
                });
        }

        return Promise.resolve();
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
