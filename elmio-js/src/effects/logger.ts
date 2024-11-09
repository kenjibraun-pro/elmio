import { IConsole } from "../browser/console";
import { Domain, Logger } from "../logger";
import { ConsoleEffect, Log } from "../rust/types";

export class ConsoleEffectHandler {
    constructor(
        private readonly console: IConsole<unknown>,
        private readonly logger: Logger<ConsoleEffect>,
    ) {}

    public async handle(effect: ConsoleEffect): Promise<void> {
        switch (effect.type) {
            case "log":
                this.log(effect.config);
                break;
            default:
                this.logger.warn({
                    domain: Domain.Console,
                    message: `Unknown console effect type: ${effect.type}`,
                    context: effect,
                });
                break;
        }
    }

    private log(config: Log): void {
        this.console.log(config.message);
    }
}
