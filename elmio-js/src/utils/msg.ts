import { isArray, isObject, isString } from "./helper";

const PLACEHOLDER_VALUE = "$CAPTURE_VALUE";

export default function replacePlaceholder(obj: object, newValue: any): object {
    return replaceObject(obj, newValue);
}

function replaceObject(obj: object, newValue: any): object {
    const entries = Object.entries(obj).map(([key, oldValue]) => {
        return [key, replaceValue(oldValue, newValue)];
    });

    return Object.fromEntries(entries);
}

function replaceValue(oldValue: any, newValue: any): any {
    if (isString(oldValue)) {
        return replaceString(oldValue, newValue);
    }
    if (isObject(oldValue)) {
        return replaceObject(oldValue, newValue);
    }
    if (isArray(oldValue)) {
        return replaceArray(oldValue, newValue);
    }

    return oldValue;
}

function replaceArray(arr: any[], newValue: any): any[] {
    return arr.map((oldValue) => {
        return replaceValue(oldValue, newValue);
    });
}

function replaceString(oldValue: string, newValue: any): string {
    if (oldValue === PLACEHOLDER_VALUE) {
        return newValue;
    }

    return oldValue;
}
