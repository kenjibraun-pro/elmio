import type { LocalStorage } from "../browser/local_storage";
import { Domain, type Logger, Verbosity } from "../logger";
import type { LocalStorageEffect, StorageGetItem, StorageSetItem } from "../rust/types";
import type JsonHelper from "../utils/json";

export class LocalStorageEffectHandler {
    constructor(
        private readonly localStorage: LocalStorage,
        private readonly jsonHelper: JsonHelper,
        private readonly logger: Logger,
    ) {}

    public async handle(effect: LocalStorageEffect) {
        switch (effect.type) {
            case "getItem": {
                return this.handleGetItem(effect.config as StorageGetItem);
            }

            case "setItem": {
                return this.handleSetItem(effect.config as StorageSetItem);
            }

            default:
                this.logger.warn({
                    domain: Domain.LocalStorage,
                    message: `Unknown local storage effect type: ${effect.type}`,
                    context: { type: effect.type },
                });
        }
    }

    private handleGetItem({ key }: StorageGetItem): string | null {
        const value = this.localStorage.getItem(key);
        if (value == null) {
            return null;
        }

        const jsonValue = this.jsonHelper.parse<string>(value);

        this.logger.debug({
            domain: Domain.LocalStorage,
            verbosity: Verbosity.Normal,
            message: "Read value from localStorage",
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
            this.localStorage.setItem(key, jsonValue);
        } catch (e) {
            this.logger.warn({
                domain: Domain.LocalStorage,
                message: "Failed to save value to localStorage",
                context: {
                    key,
                    value: jsonValue,
                    exception: e,
                },
            });

            return false;
        }

        this.logger.debug({
            domain: Domain.LocalStorage,
            verbosity: Verbosity.Normal,
            message: "Saved value to localStorage",
            context: {
                key,
                value: value,
            },
        });

        return true;
    }
}
