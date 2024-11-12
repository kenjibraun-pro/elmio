import type { SessionStorage } from "../browser/session_storage";
import { Domain, type Logger, Verbosity } from "../logger";
import type { SessionStorageEffect, StorageGetItem, StorageSetItem } from "../rust/types";
import type JsonHelper from "../utils/json";

export class SessionStorageEffectHandler {
    constructor(
        private readonly sessionStorage: SessionStorage,
        private readonly jsonHelper: JsonHelper,
        private readonly logger: Logger,
    ) {}

    public async handle(effect: SessionStorageEffect) {
        switch (effect.type) {
            case "getItem": {
                return this.handleGetItem(effect.config as StorageGetItem);
            }

            case "setItem": {
                return this.handleSetItem(effect.config as StorageSetItem);
            }

            default:
                this.logger.warn({
                    domain: Domain.SessionStorage,
                    message: `Unknown session storage effect type: ${effect.type}`,
                    context: { type: effect.type },
                });
        }
    }

    private handleGetItem({ key }: StorageGetItem): string | null {
        const value = this.sessionStorage.getItem(key);
        if (value == null) {
            return null;
        }

        const jsonValue = this.jsonHelper.parse<string>(value);

        this.logger.debug({
            domain: Domain.SessionStorage,
            verbosity: Verbosity.Normal,
            message: "Read value from sessionStorage",
            context: {
                key,
                value: jsonValue,
            },
        });

        return jsonValue;
    }

    private handleSetItem({ key, value }: StorageSetItem): boolean {
        const jsonValue = this.jsonHelper.stringify(value);

        try {
            this.sessionStorage.setItem(key, jsonValue);
        } catch (e) {
            this.logger.warn({
                domain: Domain.SessionStorage,
                message: "Failed to save value to sessionStorage",
                context: {
                    key,
                    value: jsonValue,
                    exception: e,
                },
            });

            return false;
        }

        this.logger.debug({
            domain: Domain.SessionStorage,
            verbosity: Verbosity.Normal,
            message: "Saved value to sessionStorage",
            context: {
                key,
                value: value,
            },
        });

        return true;
    }
}
