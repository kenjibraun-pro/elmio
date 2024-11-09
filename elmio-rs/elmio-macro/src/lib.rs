use proc_macro::TokenStream;
use quote::quote;
use syn::DeriveInput;
use syn::{parse_macro_input, Ident};

#[proc_macro_derive(DomId)]
pub fn dom_id_derive(input: TokenStream) -> TokenStream {
    let ast = parse_macro_input!(input as DeriveInput);
    let name = &ast.ident;

    TokenStream::from(quote! {
        impl DomId for #name {}
    })
}

#[proc_macro]
pub fn impl_wasm_page(args: TokenStream) -> TokenStream {
    let name_ident = parse_macro_input!(args as Ident);

    TokenStream::from(quote!(
        #[wasm_bindgen]
        impl #name_ident {
            #[wasm_bindgen(js_name = "id")]
            pub fn id(&self) -> Result<String, JsValue> {
                Ok(self.0.id().to_string())
            }

            #[wasm_bindgen(js_name = "init")]
            pub fn initial_model(&self) -> Result<JsValue, JsValue> {
                wasm::init(&self.0)
            }

            #[wasm_bindgen(js_name = "view")]
            pub fn view(&self, js_model: &JsValue) -> Result<String, JsValue> {
                wasm::view(&self.0, js_model)
            }

            #[wasm_bindgen(js_name = "viewBody")]
            pub fn view_body(&self, js_model: &JsValue) -> Result<String, JsValue> {
                wasm::view_body(&self.0, js_model)
            }

            #[wasm_bindgen(js_name = "getSubscriptions")]
            pub fn get_subscriptions(&self, js_model: &JsValue) -> Result<JsValue, JsValue> {
                wasm::get_subscriptions(&self.0, js_model)
            }

            #[wasm_bindgen(js_name = "update")]
            pub fn update(&self, js_msg: &JsValue, js_model: &JsValue) -> Result<JsValue, JsValue> {
                wasm::update(&self.0, js_msg, js_model)
            }

            #[wasm_bindgen(js_name = "updateFromJs")]
            pub fn update_from_js(&self, js_msg: &JsValue, js_model: &JsValue) -> Result<JsValue, JsValue> {
                wasm::update_from_js(&self.0, js_msg, js_model)
            }
        }
    ))
}
