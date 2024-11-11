import { AbortFn, Browser } from "../browser";
import { Domain, Logger, Verbosity } from "../logger";
import { RustInterval, SubscriptionMsg } from "../rust/types";

export interface ActiveInterval<T> {
    abort: AbortFn;
    interval: RustInterval<T>;
}

interface State<T> {
    intervals: ActiveInterval<T>[];
}

export class IntervalManager<T> {
    private readonly state: State<T> = {
        intervals: [],
    };

    constructor(
        private readonly browser: Browser,
        private readonly logger: Logger,
        private readonly onMsg: (msg: SubscriptionMsg<T>) => void,
    ) {}

    public setIntervals(newIntervals: RustInterval<T>[]) {
        const oldIntervals = [...this.state.intervals];

        const { intervalsToRemove, intervalsToKeep, intervalsToAdd } = prepareIntervalsDelta(
            oldIntervals,
            newIntervals,
        );

        this.logger.debug({
            domain: Domain.Interval,
            verbosity: Verbosity.Normal,
            message: "Updating intervals",
            context: {
                removing: intervalsToRemove,
                keeping: intervalsToKeep,
                adding: intervalsToAdd,
            },
        });

        this.stopIntervals(intervalsToRemove);

        const addedIntervals = intervalsToAdd.map((interval) => this.startInterval(interval));

        this.state.intervals = [...intervalsToKeep, ...addedIntervals];
    }

    private startInterval(interval: RustInterval<T>): ActiveInterval<T> {
        const abort = this.browser.setInterval(() => {
            this.onMsg(interval.msg);
        }, interval.duration);

        this.logger.debug({
            domain: Domain.Interval,
            verbosity: Verbosity.Verbose,
            message: "Started interval",
            context: {
                id: interval.id,
                duration: interval.duration,
            },
        });

        return {
            abort,
            interval,
        };
    }

    private stopIntervals(intervals: ActiveInterval<T>[]) {
        intervals.forEach((interval) => {
            interval.abort.abort();

            this.logger.debug({
                domain: Domain.Interval,
                verbosity: Verbosity.Verbose,
                message: "Stopped interval",
                context: {
                    id: interval.interval.id,
                    duration: interval.interval.duration,
                },
            });
        });
    }
}

interface IntervalsDelta<T> {
    intervalsToRemove: ActiveInterval<T>[];
    intervalsToKeep: ActiveInterval<T>[];
    intervalsToAdd: RustInterval<T>[];
}

function prepareIntervalsDelta<T>(
    oldListeners: ActiveInterval<T>[],
    newListeners: RustInterval<T>[],
): IntervalsDelta<T> {
    const newIds = newListeners.map((interval) => interval.id);
    const oldIds = oldListeners.map((interval) => interval.interval.id);

    const intervalsToRemove: ActiveInterval<T>[] = [];
    const intervalsToKeep: ActiveInterval<T>[] = [];
    const intervalsToAdd: RustInterval<T>[] = [];

    oldListeners.forEach((interval) => {
        if (newIds.includes(interval.interval.id)) {
            intervalsToKeep.push(interval);
        } else {
            intervalsToRemove.push(interval);
        }
    });

    newListeners.forEach((interval) => {
        if (!oldIds.includes(interval.id)) {
            intervalsToAdd.push(interval);
        }
    });

    return {
        intervalsToRemove,
        intervalsToKeep,
        intervalsToAdd,
    };
}
