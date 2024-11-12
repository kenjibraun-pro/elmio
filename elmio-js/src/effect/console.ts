import type { Console } from "../browser/console";
import { Domain, type Logger } from "../logger";
import type { ConsoleEffect, Log } from "../rust/types";

export class ConsoleEffectHandler {
    constructor(
        private readonly console: Console,
        private readonly logger: Logger,
    ) {}

    public async handle(effect: ConsoleEffect): Promise<void> {
        switch (effect.type) {
            case "log":
                this.log(effect.config);
                break;
            default:
                this.logger.warn({
                    domain: Domain.Console,
                    message: `Unknown effect type: ${effect.type}`,
                    context: { type: effect.type },
                });
        }
    }

    private log(config: Log): void {
        this.console.log(config.message);
    }
}
