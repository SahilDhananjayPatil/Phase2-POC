
use std::{
    io::{BufRead, BufReader},
    net::TcpStream,
    process::{Child, Command, Stdio},
    sync::{mpsc, Mutex},
    thread,
    time::{Duration, Instant},
};

use serde_json::Value;
use tauri::{Manager, RunEvent, State};

struct BackendState {
    child: Mutex<Option<Child>>,
    port: Mutex<Option<u16>>,
    secret: Mutex<Option<String>>,
}

#[tauri::command]
fn get_backend_port(state: State<'_, BackendState>) -> Result<u16, String> {
    let port = state
        .port
        .lock()
        .map_err(|_| "Backend port lock failed".to_string())?;

    port.ok_or_else(|| "Backend has not started yet".to_string())
}

fn start_backend() -> Result<(Child, u16, String), String> {
    let mut secret_bytes = [0u8; 32];
    rand::RngCore::fill_bytes(&mut rand::rng(), &mut secret_bytes);

    let local_secret = secret_bytes
        .iter()
        .map(|byte| format!("{byte:02x}"))
        .collect::<String>();

    let manifest_dir = std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR"));

    let project_root = manifest_dir
        .parent()
        .and_then(|path| path.parent())
        .ok_or_else(|| "Could not locate project root".to_string())?
        .to_path_buf();

    let python = project_root
        .join(".venv")
        .join("Scripts")
        .join("python.exe");

    let launcher = project_root.join("backend").join("launcher.py");

    if !python.exists() {
        return Err(format!("Python executable not found: {}", python.display()));
    }

    if !launcher.exists() {
        return Err(format!("Backend launcher not found: {}", launcher.display()));
    }

    let mut child = Command::new(python)
        .arg(launcher)
        .current_dir(&project_root)
        .env("LOCAL_APP_SECRET", &local_secret)
        .stdout(Stdio::piped())
        .stderr(Stdio::inherit())
        .spawn()
        .map_err(|error| format!("Could not start FastAPI: {error}"))?;

    let stdout = child
        .stdout
        .take()
        .ok_or_else(|| "Could not capture backend output".to_string())?;

    let (sender, receiver) = mpsc::channel::<u16>();

    thread::spawn(move || {
        for line in BufReader::new(stdout).lines() {
            let Ok(line) = line else {
                break;
            };

            if let Some(value) = line.strip_prefix("BACKEND_PORT=") {
                if let Ok(port) = value.parse::<u16>() {
                    let _ = sender.send(port);
                }
            }
        }
    });

    let deadline = Instant::now() + Duration::from_secs(15);

    let port = loop {
        if Instant::now() >= deadline {
            let _ = child.kill();
            let _ = child.wait();
            return Err("Timed out waiting for FastAPI to provide its port".to_string());
        }

        match receiver.recv_timeout(Duration::from_millis(200)) {
            Ok(port) => break port,
            Err(mpsc::RecvTimeoutError::Timeout) => {
                if let Some(status) = child
                    .try_wait()
                    .map_err(|error| format!("Could not check backend process: {error}"))?
                {
                    return Err(format!(
                        "FastAPI exited before startup completed: {status}"
                    ));
                }
            }
            Err(mpsc::RecvTimeoutError::Disconnected) => {
                return Err(
                    "FastAPI closed its output before providing a port".to_string()
                );
            }
        }
    };

    let health_deadline = Instant::now() + Duration::from_secs(15);

    loop {
        if TcpStream::connect(("127.0.0.1", port)).is_ok() {
            break;
        }

        if Instant::now() >= health_deadline {
            let _ = child.kill();
            let _ = child.wait();
            return Err("FastAPI did not become ready in time".to_string());
        }

        thread::sleep(Duration::from_millis(200));
    }

    Ok((child, port, local_secret))
}

async fn fetch_protected_json(
    state: &BackendState,
    endpoint: &str,
) -> Result<Value, String> {
    let (port, secret) = {
        let port = state
            .port
            .lock()
            .map_err(|_| "Backend port lock failed".to_string())?
            .ok_or_else(|| "Backend has not started yet".to_string())?;

        let secret = state
            .secret
            .lock()
            .map_err(|_| "Backend secret lock failed".to_string())?
            .clone()
            .ok_or_else(|| "Backend secret is unavailable".to_string())?;

        (port, secret)
    };

    let url = format!("http://127.0.0.1:{port}{endpoint}");

    let response = reqwest::Client::new()
        .get(url)
        .header("X-Local-Secret", secret)
        .send()
        .await
        .map_err(|error| format!("Could not contact local backend: {error}"))?;

    let status = response.status();

    if !status.is_success() {
        return Err(format!("Backend returned HTTP {status}"));
    }

    response
        .json::<Value>()
        .await
        .map_err(|error| format!("Could not read backend JSON: {error}"))
}

#[tauri::command]
async fn get_cultural_records(
    state: State<'_, BackendState>,
) -> Result<Value, String> {
    fetch_protected_json(&state, "/api/cultural-records").await
}

#[tauri::command]
async fn get_app_settings(
    state: State<'_, BackendState>,
) -> Result<Value, String> {
    fetch_protected_json(&state, "/api/settings").await
}

// chatGPT has told me to add this
#[tauri::command]
async fn get_ollama_status(
    state: State<'_, BackendState>,
) -> Result<Value, String> {
    fetch_protected_json(&state, "/api/ollama/status").await
}

fn stop_backend(state: &BackendState) {
    if let Ok(mut child_guard) = state.child.lock() {
        if let Some(mut child) = child_guard.take() {
            let _ = child.kill();
            let _ = child.wait();
        }
    }

    if let Ok(mut secret) = state.secret.lock() {
        *secret = None;
    }

    if let Ok(mut port) = state.port.lock() {
        *port = None;
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let state = BackendState {
        child: Mutex::new(None),
        port: Mutex::new(None),
        secret: Mutex::new(None),
    };

    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(state)
        .invoke_handler(tauri::generate_handler![
            get_backend_port,
            get_cultural_records,
            get_app_settings,
            get_ollama_status
        ])
        .setup(|app| {
            let (child, port, secret) =
                start_backend().map_err(std::io::Error::other)?;

            let state = app.state::<BackendState>();

            *state.child.lock().map_err(|_| {
                std::io::Error::other("Backend process lock failed")
            })? = Some(child);

            *state.port.lock().map_err(|_| {
                std::io::Error::other("Backend port lock failed")
            })? = Some(port);

            *state.secret.lock().map_err(|_| {
                std::io::Error::other("Backend secret lock failed")
            })? = Some(secret);

            println!("FastAPI is ready on 127.0.0.1:{port}");
            Ok(())
        });

    builder
        .build(tauri::generate_context!())
        .expect("error while building Tauri application")
        .run(|app_handle, event| {
            if matches!(event, RunEvent::Exit) {
                let state = app_handle.state::<BackendState>();
                stop_backend(&state);
            }
        });
}
