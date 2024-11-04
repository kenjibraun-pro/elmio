# Elmio

Elmio is a lightweight, proof-of-concept web framework inspired by The Elm Architecture. It's built using the Rust programming language and compiles to WebAssembly.

## Overview

Elmio provides a structured approach to building interactive web applications. It has two main components:

1. **elmio-rs**: The Rust core of the framework.
2. **elmio-js**: The JavaScript runtime that integrates with the Rust core.

The framework exposes a set of functions to the JavaScript runtime, allowing it to handle the application's state management, event handling, and DOM updates.

## Key Concepts

### `init`

This function returns the initial state of your application as a JSON object.

### `view`

The `view` function generates the HTML representation of your application's UI as a string, which the JavaScript runtime uses to update the DOM.

### `update`

When an event is triggered, the `update` function is called with the current state. It returns the new state and a list of effects (e.g., focus an element) as JSON.

### `subscriptions`

This function defines the event listeners, intervals, and other asynchronous tasks your application needs. It returns a declarative list of subscriptions as JSON.

<!-- ## Usage

To use Elmio in your project, you'll need to integrate the `elmio-rs` and `elmio-js` components. Refer to the individual package READMEs for detailed installation and usage instructions. -->

## Contributing

Elmio is an open-source project, and contributions are welcome! If you encounter any issues or have ideas for improvements, please feel free to submit them via the project's issue tracker or open a pull request.

## License

Elmio is licensed under the [Apache 2.0 License](LICENSE).
