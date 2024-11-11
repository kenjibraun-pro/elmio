import { Date } from "../browser/date";
import { Domain, Logger } from "../logger";
import { TimeEffect } from "../rust/types";
import { Posix, posixFromMilliseconds } from "../utils/time";

export class TimeEffectHandler {
    constructor(
        private readonly date: Date,
        private readonly logger: Logger,
    ) {}

    public handle(effect: TimeEffect<unknown>): Promise<Posix | void> {
        switch (effect.type) {
            case "currentTime":
                const result = this.currentTime();
                return Promise.resolve(result);

            default:
                this.logger.warn({
                    domain: Domain.Time,
                    message: `Unknown time effect type: ${effect.type}`,
                    context: { type: effect.type },
                });
        }

        return Promise.resolve();
    }

    private currentTime(): Posix {
        const now = this.date.now();
        return posixFromMilliseconds(now);
    }
}
