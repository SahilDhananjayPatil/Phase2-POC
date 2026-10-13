
import os
import secrets
import socket

import uvicorn

from main import app


def main():
    # Generate a fresh secret for this backend launch.
    # local_secret = os.environ.get("LOCAL_APP_SECRET") or secrets.token_urlsafe(32)
    # local_secret = secrets.token_urlsafe(32)

    local_secret = os.environ.get("LOCAL_APP_SECRET")
    if not local_secret:
        raise RuntimeError("LOCAL_APP_SECRET was not provided by Tauri")

    # Pass the secret through the backend process environment.
    os.environ["LOCAL_APP_SECRET"] = local_secret

    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    sock.bind(("127.0.0.1", 0))
    sock.listen()
    sock.setblocking(False)

    port = sock.getsockname()[1]
    print(f"BACKEND_PORT={port}", flush=True)

    config = uvicorn.Config(
        app,
        host="127.0.0.1",
        port=port,
        workers=1,
        reload=False,
        log_level="info",
    )
    server = uvicorn.Server(config)

    try:
        server.run(sockets=[sock])
    finally:
        sock.close()
        os.environ.pop("LOCAL_APP_SECRET", None)


if __name__ == "__main__":
    main()
