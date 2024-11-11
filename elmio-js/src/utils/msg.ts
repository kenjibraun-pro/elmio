import { isArray, isObject, isString } from "./helper";

const PLACEHOLDER_VALUE = "$CAPTURE_VALUE";

/**
 * Replaces all instances of PLACEHOLDER_VALUE in an object or array structure with a new value.
 * @param obj The object to process.
 * @param newValue The value to replace PLACEHOLDER_VALUE with.
 * @returns A new object with placeholders replaced by newValue.
 */
export function replacePlaceholder<T extends ReplaceableValue>(obj: object, newValue: T): object {
    return replaceObject(obj, newValue);
}

function replaceObject<T extends ReplaceableValue>(obj: object, newValue: T): object {
    return Object.fromEntries(
        Object.entries(obj).map(([key, oldValue]) => [key, replaceValue(oldValue, newValue)]),
    );
}

type ReplaceableValue = string | object | unknown[];

/**
 * Determines how to replace the placeholder value based on the type of oldValue.
 * @param oldValue The original value which may contain the placeholder.
 * @param newValue The new value to replace the placeholder with.
 * @returns The updated value after replacement.
 */
function replaceValue(oldValue: ReplaceableValue, newValue: ReplaceableValue): unknown {
    if (isString(oldValue)) {
        return replaceString(oldValue as string, newValue as string);
    } else if (isObject(oldValue)) {
        return replaceObject(oldValue as object, newValue);
    } else if (isArray(oldValue)) {
        return replaceArray(oldValue as unknown[], newValue as unknown[]);
    }
    return oldValue;
}

/**
 * Recursively replaces placeholders within an array.
 * @param arr The array to process.
 * @param newValue The new value to replace placeholders with.
 * @returns A new array with placeholders replaced.
 */
function replaceArray<T>(arr: T[], newValue: T[]): unknown[] {
    return arr.map((item) => replaceValue(item as ReplaceableValue, newValue));
}

/**
 * Replaces the placeholder in a string if present.
 * @param oldValue The original string.
 * @param newValue The new string to replace the placeholder with.
 * @returns The updated string.
 */
function replaceString(oldValue: string, newValue: string): string {
    return oldValue === PLACEHOLDER_VALUE ? newValue : oldValue;
}
