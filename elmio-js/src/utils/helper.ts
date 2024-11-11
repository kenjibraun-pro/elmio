export function isObject<T>(value: T): boolean {
    return value === Object(value);
}

export function isArray<T>(value: T): boolean {
    return Array.isArray(value);
}

export function isString<T>(value: T): boolean {
    return typeof value === "string";
}
