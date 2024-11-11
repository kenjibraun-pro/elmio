import { SessionStorage } from "../browser/session_storage";
import { Domain, Logger, Verbosity } from "../logger";
import { SessionStorageEffect, StorageGetItem, StorageSetItem } from "../rust/types";
import JsonHelper from "../utils/json";

type HandleReturnType =
    | { type: "getItem"; result: string | null }
    | { type: "setItem"; result: boolean }
    | void;

export class SessionStorageEffectHandler {
    constructor(
        private readonly sessionStorage: SessionStorage,
        private readonly jsonHelper: JsonHelper,
        private readonly logger: Logger,
    ) {}

    public handle(effect: SessionStorageEffect): Promise<HandleReturnType> {
        switch (effect.type) {
            case "getItem":
                const getItemResult = this.handleGetItem(effect.config as StorageGetItem);
                return Promise.resolve({
                    type: "getItem",
                    result: getItemResult,
                });

            case "setItem":
                const setItemResult = this.handleSetItem(effect.config as StorageSetItem);
                return Promise.resolve({
                    type: "setItem",
                    result: setItemResult,
                });

            default:
                this.logger.warn({
                    domain: Domain.SessionStorage,
                    message: `Unknown session storage effect type: ${effect.type}`,
                    context: { type: effect.type },
                });
        }

        return Promise.resolve();
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
