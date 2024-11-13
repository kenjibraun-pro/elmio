# `elmio-js`

The JavaScript runtime component of the Elmio framework. Uses [morphdom](https://github.com/patrick-steele-idem/morphdom) to partially update the DOM.

## Overview

`elmio-js` is the JavaScript counterpart to the [elmio-rs](../elmio-rs/) Rust core. It provides the runtime layer that integrates with the functions exposed by the Rust component, handling tasks such as:

- Calling the Rust `init`, `view`, `update`, and `subscriptions` functions
- Updating the DOM based on the view output
- Setting up event listeners and handling messages
- Managing the application's effects

## Contributing

Contributions to `elmio-js` are welcome. If you find any issues or have ideas for improvements, please feel free to submit them via the project's issue tracker or open a pull request.

## License

`elmio-js` is licensed under the [Apache 2.0 License](LICENSE).
