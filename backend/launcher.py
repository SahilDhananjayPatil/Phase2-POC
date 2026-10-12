import socket
import uvicorn

from main import app


def main():
    # Bind to an available local port and keep the socket open.
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    sock.bind(("127.0.0.1", 0))
    sock.listen()
    sock.setblocking(False)

    port = sock.getsockname()[1]
    print(f"BACKEND_PORT={port}", flush=True)

    # Pass the already-bound socket to Uvicorn.
    config = uvicorn.Config(
        app,
        host="127.0.0.1",
        port=port,
        log_level="info",
    )
    server = uvicorn.Server(config)

    try:
        server.run(sockets=[sock])
    finally:
        sock.close()


if __name__ == "__main__":
    main()
