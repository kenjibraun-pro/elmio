# `elmio-rs`

The Rust core of the Elmio framework.

## Overview

`elmio-rs` provides the core functionality of the Elmio framework, including:

- State management
- Event handling
- Effect management

It exposes a set of functions that the JavaScript runtime [elmio-js](../elmio-js) can call to integrate with the application.

<!-- ## API

### `init()`
Returns the initial state of your application as a JSON object.

### `view(state: &State) -> String`
Generates the HTML representation of your application's UI as a string, based on the current state.

### `update(state: &mut State, msg: &Msg) -> (State, Vec<Effect>)`
Updates the application state in response to a user event or other trigger. It takes the current state and a message, and returns the new state along with a list of effects to be handled by the runtime.

### `subscriptions(state: &State) -> Vec<Subscription>`
Defines the event listeners, intervals, and other asynchronous tasks your application needs. It returns a list of subscriptions as a JSON-serializable data structure.

## Usage

To use `elmio-rs` in your Rust project, add it as a dependency in your `Cargo.toml` file:

```toml
[dependencies]
elmio-rs = "0.1.0"
```

Then, you can import the necessary functions and use them to build your application's logic. -->

## Contributing

Contributions to `elmio-rs` are welcome. If you find any issues or have ideas for improvements, please feel free to submit them via the project's issue tracker or open a pull request.

## License

`elmio-rs` is licensed under the [Apache 2.0 License](LICENSE).
