import { Domain, Logger } from "../logger";

export default class JsonHelper {
    constructor(private readonly logger: Logger) {}

    public parse<T>(json: string): T {
        try {
            return JSON.parse(json);
        } catch (e) {
            this.logger.error({
                domain: Domain.Core,
                message: "Failed to parse json",
                context: { string: json, exception: e },
            });

            throw e;
        }
    }

    public stringify<T>(data: T): string {
        try {
            return JSON.stringify(data);
        } catch (e) {
            this.logger.error({
                domain: Domain.Core,
                message: "Failed to stringify data into json",
                context: { data, exception: e },
            });

            throw e;
        }
    }
}
