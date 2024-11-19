use std::{
    collections::BTreeMap,
    fs,
    io::{BufRead, BufReader, Write},
    net::{TcpListener, TcpStream},
    path::{Path, PathBuf},
    str::FromStr,
};

use base64::{prelude::BASE64_STANDARD, Engine};
use http::{request, HeaderMap, HeaderName, HeaderValue, Request, Response};
use mime_guess::Mime;

use crate::commands::exec;

const HTTP1_1: &[u8] = b"HTTP/1.1 200 OK";
const CRNL: &[u8] = b"\r\n";

pub struct Config {
    pub static_base_path: PathBuf,
    pub routes: Vec<Route>,
    pub response_headers: Vec<String>,
}

#[derive(Debug, Clone)]
pub struct Route {
    pub path: String,
    pub cmd: String,
}

pub fn read_routes(path: &PathBuf) -> Vec<Route> {
    let content = fs::read_to_string(path).unwrap_or_default();

    content
        .lines()
        .filter_map(|line| {
            let parts: Vec<&str> = line.split("=>").collect();

            if let [path, cmd] = parts[..] {
                Some(Route {
                    path: path.trim().to_string(),
                    cmd: cmd.trim().to_string(),
                })
            } else {
                None
            }
        })
        .collect()
}

#[derive(Debug)]
pub enum Error {
    Bind(std::io::Error),
}

pub fn start(config: &Config) -> Result<(), Error> {
    let port = listen_port_from_str(&config.static_base_path.to_string_lossy());
    let addr = format!("127.0.0.1:{}", port);

    println!("Listening on {}", addr);
    let listener = TcpListener::bind(&addr).map_err(Error::Bind)?;

    for stream in listener.incoming() {
        let stream = stream.unwrap();

        match handle_connection(config, stream) {
            Ok(_) => {}
            Err(err) => eprintln!("Error: {}", err),
        };
    }

    Ok(())
}

fn handle_connection(config: &Config, mut stream: TcpStream) -> Result<(), String> {
    let req = read_request(&mut stream)?;
    log_request(&req);
    let headers = prepare_headers(config);
    let res = prepare_response(config, &req, &headers)?;
    write_response(stream, res)?;
    Ok(())
}

fn prepare_headers(config: &Config) -> HeaderMap<HeaderValue> {
    let headers: BTreeMap<&str, &str> = config
        .response_headers
        .iter()
        .filter_map(|s| {
            let parts: Vec<&str> = s.split(":").collect();

            if let [name, value] = parts[..] {
                Some((name.trim(), value.trim()))
            } else {
                None
            }
        })
        .collect();

    headers
        .iter()
        .fold(HeaderMap::new(), |mut headers, (name, value)| {
            if let Some((hdr_name, hdr_value)) = header_from_str(name, value) {
                headers.insert(hdr_name, hdr_value);
            }

            headers
        })
}

fn header_from_str(key: &str, value: &str) -> Option<(HeaderName, HeaderValue)> {
    let name = HeaderName::from_str(key).ok()?;
    let value = value.parse().ok()?;
    Some((name, value))
}

fn log_request(req: &Request<()>) {
    println!("[{}] {}", req.method(), req.uri().path());
}

fn write_response(mut stream: TcpStream, res: Response<Vec<u8>>) -> Result<(), String> {
    write(&mut stream, HTTP1_1)?;
    write(&mut stream, CRNL)?;

    for (name, value) in res.headers() {
        write(&mut stream, format!("{}: ", name).as_bytes())?;
        write(&mut stream, value.as_bytes())?;
        write(&mut stream, CRNL)?;
    }

    write(&mut stream, CRNL)?;

    stream
        .write_all(res.body())
        .map_err(|err| format!("Failed to write body: {}", err))?;

    Ok(())
}

fn write(stream: &mut TcpStream, data: &[u8]) -> Result<(), String> {
    stream
        .write_all(data)
        .map_err(|err| format!("Failed to write response: {}", err))
}

fn prepare_response(
    config: &Config,
    req: &Request<()>,
    extra_headers: &HeaderMap<HeaderValue>,
) -> Result<Response<Vec<u8>>, String> {
    let body = prepare_response_body(config, req)?;

    let res_builder = Response::builder()
        .status(200)
        .header("Content-Type", body.content_type.to_string())
        .header("Content-Length", body.content.len());

    let res_builder2 = extra_headers
        .iter()
        .fold(res_builder, |builder, (name, value)| {
            builder.header(name, value)
        });

    let response = res_builder2.body(body.content).unwrap();

    Ok(response)
}

fn read_request(stream: &mut TcpStream) -> Result<Request<()>, String> {
    let mut req_reader = BufReader::new(stream);
    let mut buffer = Vec::new();

    // Read until start of body
    loop {
        req_reader
            .read_until(b'\n', &mut buffer)
            .map_err(|err| format!("Failed to read request: {:?}", err))?;
        if buffer.ends_with(&vec![b'\r', b'\n', b'\r', b'\n']) {
            break;
        }
    }

    let mut headers = [httparse::EMPTY_HEADER; 64];
    let mut req = httparse::Request::new(&mut headers);
    req.parse(&mut buffer).unwrap();

    let req = request::Builder::new()
        .method(req.method.unwrap_or_else(|| "GET"))
        .uri(req.path.unwrap_or_else(|| "/"))
        .body(())
        .unwrap();

    Ok(req)
}

pub struct Body {
    content: Vec<u8>,
    content_type: Mime,
}

fn match_route(config: &Config, req: &Request<()>) -> Option<Route> {
    let req_parts = path_to_parts(req.uri().path());

    config
        .routes
        .iter()
        .filter(|route| {
            let route_parts = path_to_parts(&route.path);
            compare_path_paths(&req_parts, &route_parts)
        })
        .next()
        .cloned()
}

fn compare_path_paths(req_parts: &Vec<String>, route_parts: &Vec<String>) -> bool {
    if req_parts.len() == route_parts.len() {
        req_parts
            .iter()
            .zip(route_parts.iter())
            .all(|(req_part, route_part)| req_part == route_part || route_part == "*")
    } else {
        false
    }
}

fn path_to_parts(s: &str) -> Vec<String> {
    s.trim_start_matches("/")
        .trim_end_matches("/")
        .split("/")
        .map(|s| s.to_string())
        .collect()
}

fn prepare_response_body(config: &Config, req: &Request<()>) -> Result<Body, String> {
    let file_path = file_path_from_req(config, req)?;

    if let Some(route) = match_route(config, req) {
        println!("Matched route: {}", route.path);
        body_from_route(req, &route)
    } else if file_path.exists() {
        let content =
            fs::read(&file_path).map_err(|err| format!("Failed to read file: {}", err))?;
        let content_type = mime_guess::from_path(&file_path)
            .first()
            .unwrap_or_else(|| mime_guess::mime::APPLICATION_OCTET_STREAM);
        Ok(Body {
            content,
            content_type,
        })
    } else if file_path.ends_with("favicon.ico") {
        let content_type = mime_guess::from_ext("ico")
            .first()
            .unwrap_or_else(|| mime_guess::mime::APPLICATION_OCTET_STREAM);

        Ok(Body {
            content: favicon(),
            content_type,
        })
    } else {
        Err(format!("Path not found: {}", file_path.to_string_lossy()))
    }
}

fn body_from_route(req: &Request<()>, route: &Route) -> Result<Body, String> {
    let (cmd, mut args) = exec::cmd_from_str(&route.cmd).ok_or("Invalid cmd")?;
    args.push(req.uri().path().to_string());

    let output = exec::run(&exec::Config {
        work_dir: ".".into(),
        cmd,
        args,
    })
    .map_err(|err| format!("Failed to run cmd: {}", err))?;

    Ok(Body {
        content: output.into_bytes(),
        content_type: mime_guess::mime::TEXT_HTML_UTF_8,
    })
}

fn file_path_from_req(config: &Config, req: &Request<()>) -> Result<PathBuf, String> {
    let req_path = req.uri().path().trim_start_matches("/");
    let abs_path = config.static_base_path.join(&req_path);

    if Path::new(&abs_path).is_dir() {
        Ok(Path::new(&abs_path).join("index.html"))
    } else {
        Ok(abs_path)
    }
}

fn listen_port_from_str(s: &str) -> u32 {
    let n = s
        .chars()
        .filter(char::is_ascii_alphanumeric)
        .fold(0, |sum, c| sum + c.to_digit(36).unwrap_or_default());

    8000 + (n % 1000)
}

fn favicon() -> Vec<u8> {
    let encoded = "AAABAAEAEBAQAAEABAAoAQAAFgAAACgAAAAQAAAAIAAAAAEABAAAAAAAgAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA";
    BASE64_STANDARD.decode(&encoded).unwrap()
}
