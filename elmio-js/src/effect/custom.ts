import { Domain, type Logger, Verbosity } from "../logger";

interface State {
    handler: ((effect: any) => any) | null;
    effectBacklog: any[];
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

    public async handle(effect: any): Promise<any> {
        if (this.state.handler) {
            return this.safeHandle(this.state.handler, effect) ?? effect;
        }

        if (this.config.useBacklog) {
            this.addToBacklog(effect);
        }
    }

    public setHandler(handler: (effect: any) => any): void {
        this.state.handler = handler;

        if (this.state.effectBacklog.length > 0) {
            this.handleBacklog(handler);
        }
    }

    private addToBacklog(effect: any): void {
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

    private handleBacklog(handler: (effect: any) => any): void {
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

    private safeHandle(handler: (effect: any) => any, effect: any): any | undefined {
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
