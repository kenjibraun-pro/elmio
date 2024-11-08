use proc_macro::TokenStream;
use proc_macro2::Span;
use quote::{quote, ToTokens};
use syn::{parse_macro_input, DeriveInput, Error as SynError, Ident};

/// Error type for WASM page implementation
#[derive(Debug)]
struct WasmPageError {
    message: String,
    span: Span,
}

impl WasmPageError {
    fn new(message: impl Into<String>, span: Span) -> Self {
        Self {
            message: message.into(),
            span,
        }
    }

    fn to_compile_error(&self) -> TokenStream {
        SynError::new(self.span, &self.message)
            .to_compile_error()
            .into()
    }
}

/// Derives the DomId trait for a type.
///
/// # Example
/// ```rust
/// #[derive(DomId)]
/// struct MyComponent;
/// ```
#[proc_macro_derive(DomId)]
pub fn dom_id_derive(input: TokenStream) -> TokenStream {
    let ast = match parse_macro_input!(input as DeriveInput) {
        Ok(ast) => ast,
        Err(err) => return err.to_compile_error().into(),
    };

    let name = &ast.ident;

    // Validate the type definition
    if !ast.generics.params.is_empty() {
        return WasmPageError::new(
            "DomId cannot be derived for types with generic parameters",
            name.span(),
        )
        .to_compile_error();
    }

    TokenStream::from(quote! {
        #[automatically_derived]
        impl DomId for #name {
            fn id(&self) -> &str {
                std::any::type_name::<Self>()
            }
        }
    })
}

/// Configuration for WASM page implementation
#[derive(Default)]
struct WasmPageConfig {
    enable_debugging: bool,
    strict_mode: bool,
}

/// Implements WASM bindings for a page/component.
///
/// # Example
/// ```rust
/// impl_wasm_page!(MyPage, config = {
///     enable_debugging: true,
///     strict_mode: true
/// });
/// ```
#[proc_macro]
pub fn impl_wasm_page(args: TokenStream) -> TokenStream {
    let input = parse_macro_input!(args as WasmPageInput);

    let name = &input.ident;
    let config = input.config.unwrap_or_default();

    // Generate debug assertions if debugging is enabled
    let debug_assertions = if config.enable_debugging {
        quote! {
            debug_assert!(wasm_bindgen::describe(js_model), "Invalid model state");
        }
    } else {
        quote! {}
    };

    // Generate strict mode checks
    let strict_checks = if config.strict_mode {
        quote! {
            fn validate_model(model: &JsValue) -> Result<(), JsError> {
                if !model.is_object() {
                    return Err(JsError::new("Model must be an object"));
                }
                Ok(())
            }
        }
    } else {
        quote! {}
    };

    TokenStream::from(quote! {
        #[wasm_bindgen]
        impl #name {
            /// Returns the unique identifier for this component
            #[wasm_bindgen(js_name = "id")]
            pub fn id(&self) -> Result<String, JsError> {
                Ok(self.0.id().to_string())
            }

            /// Initializes the component's model
            #[wasm_bindgen(js_name = "init")]
            pub fn initial_model(&self) -> Result<JsValue, JsError> {
                #debug_assertions
                wasm::init(&self.0)
            }

            /// Renders the complete view
            #[wasm_bindgen(js_name = "view")]
            pub fn view(&self, js_model: &JsValue) -> Result<String, JsError> {
                #debug_assertions
                if let Err(e) = Self::validate_model(js_model) {
                    return Err(e);
                }
                wasm::view(&self.0, js_model)
            }

            /// Renders just the body portion of the view
            #[wasm_bindgen(js_name = "viewBody")]
            pub fn view_body(&self, js_model: &JsValue) -> Result<String, JsError> {
                #debug_assertions
                if let Err(e) = Self::validate_model(js_model) {
                    return Err(e);
                }
                wasm::view_body(&self.0, js_model)
            }

            /// Retrieves active subscriptions
            #[wasm_bindgen(js_name = "getSubscriptions")]
            pub fn get_subscriptions(&self, js_model: &JsValue) -> Result<JsValue, JsError> {
                #debug_assertions
                if let Err(e) = Self::validate_model(js_model) {
                    return Err(e);
                }
                wasm::get_subscriptions(&self.0, js_model)
            }

            /// Handles update messages from Rust
            #[wasm_bindgen(js_name = "update")]
            pub fn update(&self, js_msg: &JsValue, js_model: &JsValue) -> Result<JsValue, JsError> {
                #debug_assertions
                if let Err(e) = Self::validate_model(js_model) {
                    return Err(e);
                }
                wasm::update(&self.0, js_msg, js_model)
            }

            /// Handles update messages from JavaScript
            #[wasm_bindgen(js_name = "updateFromJs")]
            pub fn update_from_js(&self, js_msg: &JsValue, js_model: &JsValue) -> Result<JsValue, JsError> {
                #debug_assertions
                if let Err(e) = Self::validate_model(js_model) {
                    return Err(e);
                }
                wasm::update_from_js(&self.0, js_msg, js_model)
            }

            #strict_checks
        }
    })
}

// Custom parser for macro input with configuration
mod parsing {
    use syn::parse::{Parse, ParseStream};
    use syn::{braced, Ident, Token};

    pub struct WasmPageInput {
        pub ident: Ident,
        pub config: Option<WasmPageConfig>,
    }

    impl Parse for WasmPageInput {
        fn parse(input: ParseStream) -> syn::Result<Self> {
            let ident = input.parse()?;

            let config = if input.peek(Token![,]) {
                input.parse::<Token![,]>()?;
                input.parse::<Token![config]>()?;
                input.parse::<Token![=]>()?;
                let content;
                braced!(content in input);
                Some(content.parse()?)
            } else {
                None
            };

            Ok(WasmPageInput { ident, config })
        }
    }
}

// Public exports
pub use parsing::WasmPageInput;
