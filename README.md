<div align="center">

<img src="./docs/elmio.svg" width="140px" />

# Elmio

A lightweight, proof-of-concept web framework loosely inspired by [The Elm Architecture](https://guide.elm-lang.org/architecture/).
It's built using the Rust programming language and compiles to WebAssembly.

</div>

## What is Elmio?

A simple web framework that helps you build websites with Rust.

Elmio is like building with LEGO® blocks. You have different pieces that fit together to make a website:

- A place to store information (like a toy box)
- A way to handle actions (like pressing buttons)
- A way to show things on screen (like arranging LEGO® pieces)
- A way to make changes (like following LEGO® instructions)

## Getting Started

1. Install Prerequisites:

```bash
cargo install elmio-cli wasm-pack
```

2. Create your first project:

```bash
elmio new my-website
cd my-website
```

3. Start your website:

```bash
elmio serve
```

## How Elmio Works

Every Elmio website has four main parts:

1. **State** - Information your website remembers

   ```rust
   struct Model {
       count: isize,  // Remembers a number
   }
   ```

2. **Messages** - Things that can happen

   ```rust
   enum Msg {
       Increment,  // Add one
       Decrement,  // Subtract one
   }
   ```

3. **View** - What people see

   ```rust
   fn view(model: &Model) -> Markup {
       html! {
           button { "−" }
           span { (model.count) }
           button { "+" }
       }
   }
   ```

4. **Update** - How things change
   ```rust
   fn update(msg: &Msg, model: &mut Model) {
       match msg {
           Msg::Increment => model.count += 1,
           Msg::Decrement => model.count -= 1,
       }
   }
   ```

## Helpful Commands

```bash
elmio new my-website     # Make a new website
elmio serve             # Start your website
elmio watch            # Auto-update while you work
elmio build            # Make your website ready for the internet
```

## Want to Learn More?

1. Look at the examples in the [examples](./examples/) folder
2. Each example shows you how to build something cool
3. Try changing small parts to see what happens

## Need Ideas? Check These Examples:

The [examples](./examples/) folder has complete projects you can learn from:

- A counting button with tailwindcss
- And more coming soon!

## Want to Help Make Elmio Better?

1. Fork the repository
2. Make your changes
3. Share your improvements with elmio!

## Remember

Just like with LEGO®, start simple:

1. Decide what information to remember (State)
2. Plan what can happen (Messages)
3. Design what people see (View)
4. Choose how things change (Update)

## License

This is open source software - you can use it, share it, and learn from it freely under the [Apache 2.0](./LICENSE) License!
