# `elmio-js`

The JavaScript runtime component of the Elmio framework. Uses [morphdom](https://github.com/patrick-steele-idem/morphdom) to partially update the DOM.

## Overview

`elmio-js` is the JavaScript counterpart to the [elmio-rs](../elmio-rs/) Rust core. It provides the runtime layer that integrates with the functions exposed by the Rust component, handling tasks such as:

- Calling the Rust `init`, `view`, `update`, and `subscriptions` functions
- Updating the DOM based on the view output
- Setting up event listeners and handling messages
- Managing the application's effects

<!-- ## Usage

To use `elmio-js` in your web application, install it using your preferred package manager:

```
pnpm install elmio-js
```

Then, import the necessary functions and use them to bootstrap your Elmio-based application:

```javascript
import { init, update, view, subscriptions } from 'elmio-js';

// Initialize the application
const app = init(initialState);

// Render the initial view
app.view().then(html => {
  document.getElementById('root').innerHTML = html;
});

// Set up event listeners and update the state
app.subscriptions().forEach(sub => {
  document.addEventListener(sub.event, (event) => {
    app.update(event);
  });
});
```

Refer to the `elmio-js` documentation for more detailed usage examples and instructions. -->

## Contributing

Contributions to `elmio-js` are welcome. If you find any issues or have ideas for improvements, please feel free to submit them via the project's issue tracker or open a pull request.

## License

`elmio-js` is licensed under the [Apache 2.0 License](LICENSE).
