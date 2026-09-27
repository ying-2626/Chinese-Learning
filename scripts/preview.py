"""Serve the original UI and forward its API calls to a local backend."""
import argparse
import functools
import http.client
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit


class PreviewHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_GET(self):
        if self.path.startswith(("/api/", "/user/", "/chat/", "/scoreAction/", "/audios/")):
            return self.proxy()
        if self.path == "/":
            self.path = "/entry.html"
        return super().do_GET()

    def proxy(self):
        backend = urlsplit(self.server.backend)
        connection = http.client.HTTPConnection(backend.hostname, backend.port or 8088, timeout=60)
        headers = {k: v for k, v in self.headers.items()
                   if k.lower() not in {"host", "connection", "accept-encoding"}}
        body = self.rfile.read(int(self.headers.get("Content-Length", "0")))
        try:
            connection.request(self.command, self.path, body=body or None, headers=headers)
            response = connection.getresponse()
            data = response.read()
            self.send_response(response.status)
            for key, value in response.getheaders():
                if key.lower() not in {"connection", "transfer-encoding", "content-length"}:
                    self.send_header(key, value)
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
        except (OSError, http.client.HTTPException):
            self.send_error(502, "Local backend is not available")
        finally:
            connection.close()

    do_POST = proxy
    do_PUT = proxy
    do_DELETE = proxy
    do_OPTIONS = proxy


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=4193)
    parser.add_argument("--backend", default="http://127.0.0.1:8088")
    args = parser.parse_args()
    if urlsplit(args.backend).hostname not in {"127.0.0.1", "localhost", "::1"}:
        parser.error("The preview backend must be local")
    root = Path(__file__).resolve().parents[1] / "webdemo1-1"
    handler = functools.partial(PreviewHandler, directory=str(root))
    server = ThreadingHTTPServer(("127.0.0.1", args.port), handler)
    server.backend = args.backend
    print(f"Preview: http://127.0.0.1:{args.port}/entry.html", flush=True)
    server.serve_forever()
