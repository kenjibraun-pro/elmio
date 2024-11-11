import { Domain, type Logger, Verbosity } from "../logger";

interface State {
    handler: ((effect: unknown) => unknown) | null;
    effectBacklog: unknown[];
}

export interface Config {
    useBacklog: boolean;
}

export class CustomEffectHandler {
    private readonly state: State = {
        handler: null,
        effectBacklog: [],
    };

    constructor(
        private readonly config: Config,
        private readonly logger: Logger,
    ) {}

    public handle(effect: unknown): Promise<unknown> {
        if (this.state.handler) {
            const result = this.safeHandle(this.state.handler, effect) ?? effect;
            return Promise.resolve(result);
        }

        if (this.config.useBacklog) {
            this.addToBacklog(effect);
        }

        return Promise.resolve(effect);
    }

    public setHandler(handler: (effect: unknown) => unknown): void {
        this.state.handler = handler;

        if (this.state.effectBacklog.length > 0) {
            this.handleBacklog(handler);
        }
    }

    private addToBacklog(effect: unknown): void {
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

    private handleBacklog(handler: (effect: unknown) => unknown): void {
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

        for (const effect of effects) {
            this.safeHandle(handler, effect);
        }
    }

    private safeHandle(
        handler: (effect: unknown) => unknown,
        effect: unknown,
    ): unknown | undefined {
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
