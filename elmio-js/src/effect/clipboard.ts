import type { Clipboard } from "../browser/clipboard";
import { Domain, type Logger } from "../logger";
import type { ClipboardEffect, WriteText, WriteTextResult } from "../rust/types";

export class ClipboardEffectHandler {
    constructor(
        private readonly console: Clipboard,
        private readonly logger: Logger,
    ) {}

    public async handle(effect: ClipboardEffect): Promise<WriteTextResult | undefined> {
        switch (effect.type) {
            case "writeText":
                return this.writeText(effect.config as WriteText);

            default:
                this.logger.warn({
                    domain: Domain.Clipboard,
                    message: `Unknown effect type: ${effect.type}`,
                    context: { type: effect.type },
                });
        }
    }

    private writeText(config: WriteText): WriteTextResult {
        try {
            this.console.writeText(config.text);

            return {
                success: true,
                error: null,
            };
        } catch (e) {
            this.logger.error({
                domain: Domain.Clipboard,
                message: "Failed to write text to clipboard",
                context: { error: e },
            });

            return {
                success: false,
                error: (e as Error).message,
            };
        }
    }
}
