import { Clipboard } from "../browser/clipboard";
import { Domain, Logger } from "../logger";
import { ClipboardEffect, WriteText, WriteTextResult } from "../rust/types";

export class ClipboardEffectHandler {
    constructor(
        private readonly clipboard: Clipboard,
        private readonly logger: Logger,
    ) {}

    public async handle(effect: ClipboardEffect): Promise<WriteTextResult> {
        switch (effect.type) {
            case "writeText":
                return this.handleWriteText(effect.config as WriteText);
            default:
                this.logger.warn({
                    domain: Domain.Clipboard,
                    message: `Unknown clipboard effect type: ${effect.type}`,
                    context: effect,
                });
                return { success: false, error: `Unknown effect type: ${effect.type}` };
        }
    }

    private async handleWriteText(config: WriteText): Promise<WriteTextResult> {
        try {
            this.clipboard.writeText(config.text);
            return { success: true, error: null };
        } catch (error) {
            this.logger.error({
                domain: Domain.Clipboard,
                message: "Failed to write text to clipboard",
                context: error as Error,
            });
            return { success: false, error: (error as Error).message };
        }
    }
}
