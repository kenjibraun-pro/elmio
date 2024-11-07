interface EnumValue<T> {
    [key: string]: T;
}

function createEnumWithoutValue<T extends string>(name: T): T {
    return name;
}

function createTupleEnumWithoutValue<T extends string>(name: T): EnumValue<T[]> {
    return { [name]: [] };
}

function createTupleEnum<T extends string, V>(name: T, values: V[]): EnumValue<V | V[]> {
    return { [name]: values.length === 1 ? values[0] : values };
}

function createObjectEnum<T extends string, V extends object>(name: T, value: V): EnumValue<V> {
    if (typeof value !== "object" || value === null) {
        throw new TypeError("Values must be an object");
    }

    return { [name]: value };
}

export default {
    withoutValue: createEnumWithoutValue,
    tupleWithoutValue: createTupleEnumWithoutValue,
    tuple: createTupleEnum,
    object: createObjectEnum,
};
