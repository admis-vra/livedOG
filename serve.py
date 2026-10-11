#!/usr/bin/env python3
"""
High-performance local development server with:
- Multi-threading (ThreadingHTTPServer)
- HTTP 1.1 with Byte-Range request support (HTTP 206 Partial Content)
  essential for smooth video streaming and instant seeking without buffering/lag.
- Instant FastStart streaming
"""

import os
import sys
import re
import mimetypes
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

# Ensure common web MIME types are recognized
mimetypes.add_type("video/mp4", ".mp4")
mimetypes.add_type("video/webm", ".webm")
mimetypes.add_type("audio/mpeg", ".mp3")
mimetypes.add_type("image/webp", ".webp")
mimetypes.add_type("text/javascript", ".js")
mimetypes.add_type("text/css", ".css")


class StreamingRequestHandler(SimpleHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Enable byte-range support for browsers and media players
        self.send_header("Accept-Ranges", "bytes")
        # Prevent aggressive caching issues during active development
        self.send_header("Cache-Control", "no-cache, must-revalidate")
        super().end_headers()

    def do_GET(self):
        """Serve a GET request with full HTTP Byte Range support and local nanolog API."""
        if self.path.startswith('/api/mynanolife'):
            self.handle_local_nanolife_api()
            return

        f, start, length = self.send_head_range()
        if f:
            try:
                if length is None:
                    # Directory request (index.html / listing) served by the base handler
                    self.copyfile(f, self.wfile)
                else:
                    self.copy_range(f, start, length)
            finally:
                f.close()

    def handle_local_nanolife_api(self):
        """Return all local markdown files in MyNanoLife directory as JSON."""
        import json
        nano_dir = os.path.join(DIRECTORY, "MyNanoLife")
        posts = []
        if os.path.exists(nano_dir) and os.path.isdir(nano_dir):
            for name in sorted(os.listdir(nano_dir), reverse=True):
                if name.endswith((".md", ".markdown")):
                    file_path = os.path.join(nano_dir, name)
                    try:
                        with open(file_path, "r", encoding="utf-8") as f:
                            content = f.read()
                        mtime = os.path.getmtime(file_path)
                        posts.append({
                            "name": name,
                            "content": content,
                            "mtime": mtime
                        })
                    except Exception as e:
                        pass
        data = json.dumps({"source": "local", "posts": posts}).encode("utf-8")
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        self.wfile.write(data)


    def do_HEAD(self):
        """Serve a HEAD request."""
        f, _, _ = self.send_head_range()
        if f:
            f.close()

    def send_head_range(self):
        path = self.translate_path(self.path)
        if os.path.isdir(path):
            parts = sys.version_info
            # Use default directory index handling
            return super().send_head(), 0, None

        if not os.path.exists(path):
            self.send_error(HTTPStatus.NOT_FOUND, "File not found")
            return None, 0, None

        ctype = self.guess_type(path)
        try:
            f = open(path, "rb")
        except OSError:
            self.send_error(HTTPStatus.NOT_FOUND, "File not found")
            return None, 0, None

        try:
            fs = os.fstat(f.fileno())
            total_length = fs.st_size
        except Exception:
            f.close()
            raise

        range_header = self.headers.get("Range")

        if range_header:
            range_match = re.match(r"^bytes=(\d*)-(\d*)$", range_header.strip())
            if range_match:
                first_byte_str, last_byte_str = range_match.groups()

                if first_byte_str and last_byte_str:
                    start = int(first_byte_str)
                    end = int(last_byte_str)
                elif first_byte_str:
                    start = int(first_byte_str)
                    end = total_length - 1
                elif last_byte_str:
                    # Suffix range: -N means last N bytes
                    suffix_len = int(last_byte_str)
                    start = max(0, total_length - suffix_len)
                    end = total_length - 1
                else:
                    start = 0
                    end = total_length - 1

                if start < total_length and end >= start:
                    end = min(end, total_length - 1)
                    content_length = end - start + 1

                    self.send_response(HTTPStatus.PARTIAL_CONTENT)
                    self.send_header("Content-Type", ctype)
                    self.send_header("Content-Range", f"bytes {start}-{end}/{total_length}")
                    self.send_header("Content-Length", str(content_length))
                    self.send_header("Last-Modified", self.date_time_string(fs.st_mtime))
                    self.end_headers()

                    return f, start, content_length

        # No Range header or invalid range: standard 200 OK
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(total_length))
        self.send_header("Last-Modified", self.date_time_string(fs.st_mtime))
        self.end_headers()

        return f, 0, total_length

    def copy_range(self, source, start, length):
        """Efficiently copy a byte range to the client socket."""
        try:
            source.seek(start)
            remaining = length
            buffer_size = 64 * 1024  # 64KB chunks

            while remaining > 0:
                chunk_size = min(buffer_size, remaining)
                chunk = source.read(chunk_size)
                if not chunk:
                    break
                self.wfile.write(chunk)
                remaining -= len(chunk)
        except (BrokenPipeError, ConnectionResetError):
            # Normal behavior when user seeks or closes tab
            pass

    def log_message(self, format, *args):
        # Concise logging
        sys.stderr.write("%s - - [%s] %s\n" %
                         (self.client_address[0],
                          self.log_date_time_string(),
                          format % args))


def run():
    server_address = ("127.0.0.1", PORT)
    httpd = ThreadingHTTPServer(server_address, StreamingRequestHandler)
    print(f"Streaming server running at http://127.0.0.1:{PORT}/")
    print("Supports HTTP Range requests (206 Partial Content) & multi-threading.")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server.")
        httpd.server_close()


if __name__ == "__main__":
    run()
