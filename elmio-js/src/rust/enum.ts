export const rustEnum = {
    withoutValue(name: string) {
        return name;
    },

    tupleWithoutValue(name: string) {
        return { [name]: [] };
    },

    tuple(name: string, values: string[]) {
        if (values.length === 0) {
            this.tupleWithoutValue(name);
        }

        if (values.length === 1) {
            return { [name]: values[0] };
        }

        return { [name]: values };
    },

    object(name: string, value: object) {
        if (typeof value !== "object") {
            throw new Error("Value must be an object");
        }

        return { [name]: value };
    },
};
