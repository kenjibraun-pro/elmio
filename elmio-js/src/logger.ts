interface Logger<T> {
    warn(entry: LogEntry<T>): void;
    error(entry: LogEntry<T>): void;
    debug(entry: DebugEntry<T>): void;
}

const PREFIX = "Elmio";

interface Config {
    debugDomains: Domain[];
    debugLogger: DebugLogger;
    debugVerbosity: Verbosity;
}

interface LogEntry<T> {
    domain: Domain;
    message: string;
    context: T;
}

interface DebugEntry<T> extends LogEntry<T> {
    verbosity: Verbosity;
}

class BrowserLogger<T> implements Logger<T> {
    constructor(private readonly config: Config) {}

    public warn({ domain, message, context }: LogEntry<T>): void {
        console.warn(`[${PREFIX}:${Domain[domain]}]`, message, context);
    }

    public error({ domain, message, context }: LogEntry<T>): void {
        console.error(`[${PREFIX}:${Domain[domain]}]`, message, context);
    }

    public debug({ domain, verbosity, message, context }: DebugEntry<T>): void {
        if (
            (this.validDomain(domain) && this.validVerbosity(verbosity)) ||
            this.hasGlobalOverride()
        ) {
            const logger = this.getDebugLogger<string | T>();
            logger(`[${PREFIX}:${Domain[domain]}]`, message, context);
        }
    }

    private getDebugLogger<T>(): (...data: T[]) => void {
        switch (this.config.debugLogger) {
            case DebugLogger.Log:
                return console.log;

            case DebugLogger.Trace:
                return console.trace;
        }
    }

    private validDomain(domain: Domain): boolean {
        if (this.config.debugDomains.length === 0) {
            return false;
        }

        return (
            this.config.debugDomains.includes(domain) ||
            this.config.debugDomains.includes(Domain.All)
        );
    }

    private validVerbosity(verbosity: Verbosity): boolean {
        switch (this.config.debugVerbosity) {
            case Verbosity.Normal:
                return verbosity === Verbosity.Normal;

            case Verbosity.Verbose:
                return true;
        }
    }

    private hasGlobalOverride(): boolean {
        return window && "elmioDebug" in window && (window.elmioDebug as boolean);
    }
}

enum Domain {
    All,
    Core,
    Subscriptions,
    EventListener,
    Interval,
    Effects,
    Dom,
    Time,
    LocalStorage,
    SessionStorage,
    Navigation,
    Console,
    Clipboard,
    Browser,
    CustomEffect,
}

enum DebugLogger {
    Log,
    Trace,
}

enum Verbosity {
    Normal,
    Verbose,
}

function defaultLoggerConfig(): Config {
    return {
        debugDomains: [],
        debugLogger: DebugLogger.Log,
        debugVerbosity: Verbosity.Normal,
    };
}

function defaultDebugConfig(): Config {
    return {
        debugDomains: [Domain.All],
        debugLogger: DebugLogger.Log,
        debugVerbosity: Verbosity.Normal,
    };
}

function verboseDebugConfig(): Config {
    return {
        debugDomains: [Domain.All],
        debugLogger: DebugLogger.Log,
        debugVerbosity: Verbosity.Verbose,
    };
}

function traceDebugConfig(): Config {
    return {
        debugDomains: [Domain.All],
        debugLogger: DebugLogger.Trace,
        debugVerbosity: Verbosity.Verbose,
    };
}

export {
    Logger,
    BrowserLogger,
    Domain,
    DebugLogger,
    Config,
    Verbosity,
    defaultLoggerConfig,
    defaultDebugConfig,
    verboseDebugConfig,
    traceDebugConfig,
};
