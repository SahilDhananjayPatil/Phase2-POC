
import socket
import uvicorn


def main():
    # Ask Windows to assign an available local port.
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(("127.0.0.1", 0))
        port = sock.getsockname()[1]

    # Run FastAPI on the selected port.
    print(f"BACKEND_PORT={port}", flush=True)

    uvicorn.run(
        "main:app",
        app_dir="backend",
        host="127.0.0.1",
        port=port,
        log_level="info",
    )


if __name__ == "__main__":
    main()
