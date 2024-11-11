import { LocalStorage } from "../browser/local_storage";
import { Domain, Logger, Verbosity } from "../logger";
import { StorageEffect, StorageGetItem, StorageSetItem } from "../rust/types";
import JsonHelper from "../utils/json";

type HandleReturnType =
    | { type: "getItem"; result: string | null }
    | { type: "setItem"; result: boolean }
    | void;

export default class LocalStorageEffectHandler {
    constructor(
        private readonly localStorage: LocalStorage,
        private readonly jsonHelper: JsonHelper,
        private readonly logger: Logger,
    ) {}

    public handle(effect: StorageEffect): Promise<HandleReturnType> {
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
                    domain: Domain.LocalStorage,
                    message: "Unknown localStorage effect",
                    context: { type: effect.type },
                });
        }

        return Promise.resolve();
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
