import { Elmio, defaultDebugConfig } from "elmio-js";

import init, { homePage } from "../wasm/counter.js";
(async () => {
    await init("/wasm/counter_bg.wasm");

    const elmio = new Elmio(homePage(location.href), {
        loggerConfig: defaultDebugConfig(),
    });

    elmio.init();
})();
