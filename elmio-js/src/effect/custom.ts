import { Domain, Logger, Verbosity } from "../logger";

interface State<T> {
    handler: ((effect: T) => T) | null;
    effectBacklog: T[];
}

export interface Config {
    useBacklog: boolean;
}

export class CustomEffectHandler<T> {
    private readonly state: State<T> = {
        handler: null,
        effectBacklog: [],
    };

    constructor(
        private readonly config: Config,
        private readonly logger: Logger,
    ) {}

    public handle(effect: T): Promise<T> {
        if (this.state.handler) {
            const result = this.safeHandle(this.state.handler, effect) ?? effect;
            return Promise.resolve(result);
        } else {
            if (this.config.useBacklog) {
                this.addToBacklog(effect);
            }
        }

        return Promise.resolve(effect);
    }

    public setHandler(handler: (effect: T) => T): void {
        this.state.handler = handler;

        if (this.state.effectBacklog.length > 0) {
            this.handleBacklog(handler);
        }
    }

    private addToBacklog(effect: T): void {
        if (this.state.effectBacklog.length < 100) {
            this.state.effectBacklog.push(effect);

            this.logger.debug({
                domain: Domain.CustomEffect,
                verbosity: Verbosity.Normal,
                message: "Added effect to backlog",
                context: {
                    effect,
                },
            });
        } else {
            this.logger.warn({
                domain: Domain.CustomEffect,
                message: "The custom effect backlog is full, ignoring effect",
                context: { effect },
            });
        }
    }

    private handleBacklog(handler: (effect: T) => T): void {
        this.logger.debug({
            domain: Domain.CustomEffect,
            verbosity: Verbosity.Normal,
            message: "Handling backlog",
            context: {
                count: this.state.effectBacklog.length,
            },
        });

        const effects = [...this.state.effectBacklog];
        this.state.effectBacklog = [];

        effects.forEach((effect) => {
            this.safeHandle(handler, effect);
        });
    }

    private safeHandle(handler: (effect: T) => T, effect: T): T | undefined {
        try {
            return handler(effect);
        } catch (error) {
            this.logger.error({
                domain: Domain.CustomEffect,
                message: "Error while handling app effect",
                context: {
                    error,
                    exception: error,
                },
            });
        }
    }
}

export function defaultCustomEffectConfig(): Config {
    return {
        useBacklog: true,
    };
}
