import type { AbortFn, Browser } from "../browser";
import { Domain, type Logger, Verbosity } from "../logger";
import type { RustInterval, SubscriptionMsg } from "../rust/types";

export interface ActiveInterval {
    abort: AbortFn;
    interval: RustInterval;
}

interface State {
    intervals: ActiveInterval[];
}

export class IntervalManager {
    private readonly state: State = {
        intervals: [],
    };

    constructor(
        private readonly browser: Browser,
        private readonly logger: Logger,
        private readonly onMsg: (msg: SubscriptionMsg) => void,
    ) {}

    public setIntervals(newIntervals: RustInterval[]) {
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

    private startInterval(interval: RustInterval): ActiveInterval {
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

    private stopIntervals(intervals: ActiveInterval[]) {
        for (const interval of intervals) {
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
        }
    }
}

interface IntervalsDelta {
    intervalsToRemove: ActiveInterval[];
    intervalsToKeep: ActiveInterval[];
    intervalsToAdd: RustInterval[];
}

function prepareIntervalsDelta(
    oldListeners: ActiveInterval[],
    newListeners: RustInterval[],
): IntervalsDelta {
    const newIds = newListeners.map((interval) => interval.id);
    const oldIds = oldListeners.map((interval) => interval.interval.id);

    const intervalsToRemove: ActiveInterval[] = [];
    const intervalsToKeep: ActiveInterval[] = [];
    const intervalsToAdd: RustInterval[] = [];

    for (const interval of oldListeners) {
        if (newIds.includes(interval.interval.id)) {
            intervalsToKeep.push(interval);
        } else {
            intervalsToRemove.push(interval);
        }
    }

    for (const interval of newListeners) {
        if (!oldIds.includes(interval.id)) {
            intervalsToAdd.push(interval);
        }
    }

    return {
        intervalsToRemove,
        intervalsToKeep,
        intervalsToAdd,
    };
}
