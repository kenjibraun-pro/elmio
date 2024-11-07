interface Logger<T> {
    warn(entry: LogEntry<T>): void;
    error(entry: LogEntry<T>): void;
    log(entry: LogEntryWithVerbosity<T>): void;
}

const PREFIX = "Elmio";

interface LoggerConfig {
    debugDomains: Domain[];
    loggerType: LoggerType;
    verbosity: Verbosity;
    globalDebugOverride?: boolean;
}

interface LogEntry<T> {
    domain: Domain;
    message: string;
    context: T;
}

interface LogEntryWithVerbosity<T> extends LogEntry<T> {
    verbosity: Verbosity;
}

class BrowserLogger<T> implements Logger<T> {
    constructor(private readonly config: LoggerConfig) {}

    public warn({ domain, message, context }: LogEntry<T>): void {
        this.log({ domain, verbosity: Verbosity.Warning, message, context });
    }

    public error({ domain, message, context }: LogEntry<T>): void {
        this.log({ domain, verbosity: Verbosity.Error, message, context });
    }

    public log({ domain, verbosity, message, context }: LogEntryWithVerbosity<T>): void {
        if (this.shouldLog(domain, verbosity)) {
            const logger = this.getLogger();
            logger(`[${PREFIX}:${Domain[domain]}]`, message, context);
        }
    }

    private getLogger(): (...data: unknown[]) => void {
        switch (this.config.loggerType) {
            case LoggerType.Log:
                return console.log;
            case LoggerType.Trace:
                return console.trace;
        }
    }

    private shouldLog(domain: Domain, verbosity: Verbosity): boolean {
        return (
            this.validDomain(domain) &&
            this.validVerbosity(verbosity) &&
            (this.config.globalDebugOverride ?? false)
        );
    }

    private validDomain(domain: Domain): boolean {
        return (
            this.config.debugDomains.length === 0 ||
            this.config.debugDomains.includes(domain) ||
            this.config.debugDomains.includes(Domain.All)
        );
    }

    private validVerbosity(verbosity: Verbosity): boolean {
        return this.config.verbosity >= verbosity;
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

enum LoggerType {
    Log,
    Trace,
}

enum Verbosity {
    Debug = 0,
    Normal = 1,
    Warning = 2,
    Error = 3,
}

function defaultLoggerConfig(): LoggerConfig {
    return {
        debugDomains: [],
        loggerType: LoggerType.Log,
        verbosity: Verbosity.Normal,
    };
}

function debugLoggerConfig(): LoggerConfig {
    return {
        debugDomains: [Domain.All],
        loggerType: LoggerType.Log,
        verbosity: Verbosity.Debug,
        globalDebugOverride: true,
    };
}

function verboseDebugConfig(): LoggerConfig {
    return {
        debugDomains: [Domain.All],
        loggerType: LoggerType.Log,
        verbosity: Verbosity.Debug,
        globalDebugOverride: true,
    };
}

function traceDebugConfig(): LoggerConfig {
    return {
        debugDomains: [Domain.All],
        loggerType: LoggerType.Trace,
        verbosity: Verbosity.Debug,
        globalDebugOverride: true,
    };
}

export {
    Logger,
    BrowserLogger,
    Domain,
    LoggerType,
    LoggerConfig,
    Verbosity,
    defaultLoggerConfig,
    debugLoggerConfig,
    verboseDebugConfig,
    traceDebugConfig,
};
