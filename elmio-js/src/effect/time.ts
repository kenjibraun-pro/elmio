import type { IDate } from "../browser/date";
import { Domain, type Logger } from "../logger";
import type { TimeEffect } from "../rust/types";
import { type Posix, posixFromMilliseconds } from "../utils/time";

export class TimeEffectHandler {
    constructor(
        private readonly date: IDate,
        private readonly logger: Logger,
    ) {}

    public async handle(effect: TimeEffect): Promise<Posix | void> {
        switch (effect.type) {
            case "currentTime": {
                const result = this.currentTime();
                return Promise.resolve(result);
            }

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
