export interface Posix {
    milliseconds: number;
}

export function posixFromMilliseconds(milliseconds: number): Posix {
    return {
        milliseconds,
    };
}
