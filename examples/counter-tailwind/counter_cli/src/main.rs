use std::{env, process};

use counter_core::home_page;
use elmio_core::page::Page;
use url::Url;

fn main() {
    let args: Vec<String> = env::args().collect();

    if args.len() < 2 {
        eprintln!("Usage: counter_cli <command>");
        process::exit(1);
    }

    match args[1].as_str() {
        "home_page" => {
            let page = home_page::HomePage {
                current_url: Url::parse("http://localhost/").unwrap(),
            };
            print_html(page);
        }
        _ => {
            eprintln!("Invalid command: {:?}", args);
            process::exit(1);
        }
    }
}

fn print_html<Model, Msg, Markup>(page: impl Page<Model, Msg, Markup>) {
    let (model, _effects) = page.init().expect("Failed to init page");
    let markup = page.view(&model);
    println!("{}", page.render_page(markup));
}
