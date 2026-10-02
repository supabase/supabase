#!/usr/bin/env python3
"""
Simple HTTP mock server for testing pg_http extension offline.
Mimics basic endpoints similar to httpbingo/postman-echo services.
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import urllib.parse
import time


class MockHTTPHandler(BaseHTTPRequestHandler):
    def _send_json_response(self, status_code=200, data=None):
        """Send a JSON response"""
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers()
        response_data = data or {}
        self.wfile.write(json.dumps(response_data).encode("utf-8"))

    def _send_text_response(
        self, status_code=200, content="", content_type="text/plain"
    ):
        """Send a text response"""
        self.send_response(status_code)
        self.send_header("Content-Type", content_type)
        self.end_headers()
        self.wfile.write(content.encode("utf-8"))

    def _get_request_info(self):
        """Get request information"""
        parsed_path = urllib.parse.urlparse(self.path)
        query_params = urllib.parse.parse_qs(parsed_path.query)

        # Read body if present
        content_length = int(self.headers.get("Content-Length", 0))
        body = (
            self.rfile.read(content_length).decode("utf-8")
            if content_length > 0
            else ""
        )

        return {
            "method": self.command,
            "url": self.path,
            "path": parsed_path.path,
            "query": query_params,
            "headers": dict(self.headers),
            "body": body,
        }

    def do_GET(self):
        """Handle GET requests"""
        request_info = self._get_request_info()
        path = request_info["path"]

        if path == "/get":
            response = {
                "args": request_info["query"],
                "headers": request_info["headers"],
                "url": f"http://{self.headers.get('Host', 'localhost:8080')}{self.path}",
            }
            self._send_json_response(200, response)

        elif path == "/headers":
            response = {"headers": request_info["headers"]}
            self._send_json_response(200, response)

        elif path == "/response-headers":
            # Check if Content-Type is specified in query params
            query_params = request_info["query"]
            if "Content-Type" in query_params:
                content_type = query_params["Content-Type"][0]
                self._send_text_response(
                    200, "Response with custom content type", content_type
                )
            else:
                self._send_json_response(200, {"message": "response-headers endpoint"})

        elif path.startswith("/delay/"):
            # Extract delay time from path
            try:
                delay = int(path.split("/delay/")[1])
                time.sleep(min(delay, 5))  # Cap at 5 seconds
                self._send_json_response(200, {"delay": delay})
            except (ValueError, IndexError):
                self._send_json_response(400, {"error": "Invalid delay value"})

        elif path == "/anything" or path.startswith("/anything"):
            response = {
                "method": "GET",
                "args": request_info["query"],
                "headers": request_info["headers"],
                "url": f"http://{self.headers.get('Host', 'localhost:8080')}{self.path}",
                "data": "",
                "json": None,
            }
            self._send_json_response(200, response)

        else:
            self._send_json_response(404, {"error": "Not found"})

    def do_POST(self):
        """Handle POST requests"""
        request_info = self._get_request_info()
        path = request_info["path"]

        if path == "/post":
            response = {
                "args": request_info["query"],
                "data": request_info["body"],
                "headers": request_info["headers"],
                "json": None,
                "url": f"http://{self.headers.get('Host', 'localhost:8080')}{self.path}",
            }

            # Try to parse JSON if content-type is json
            if "application/json" in request_info["headers"].get("Content-Type", ""):
                try:
                    response["json"] = json.loads(request_info["body"])
                except json.JSONDecodeError:
                    pass

            self._send_json_response(200, response)
        else:
            self._send_json_response(404, {"error": "Not found"})

    def do_PUT(self):
        """Handle PUT requests"""
        request_info = self._get_request_info()
        path = request_info["path"]

        if path == "/put":
            response = {
                "args": request_info["query"],
                "data": request_info["body"],
                "headers": request_info["headers"],
                "json": None,
                "url": f"http://{self.headers.get('Host', 'localhost:8080')}{self.path}",
            }

            # Try to parse JSON if content-type is json
            if "application/json" in request_info["headers"].get("Content-Type", ""):
                try:
                    response["json"] = json.loads(request_info["body"])
                except json.JSONDecodeError:
                    pass

            self._send_json_response(200, response)
        else:
            self._send_json_response(404, {"error": "Not found"})

    def do_DELETE(self):
        """Handle DELETE requests"""
        request_info = self._get_request_info()
        path = request_info["path"]

        if path == "/delete":
            response = {
                "args": request_info["query"],
                "headers": request_info["headers"],
                "url": f"http://{self.headers.get('Host', 'localhost:8080')}{self.path}",
            }
            self._send_json_response(200, response)
        else:
            self._send_json_response(404, {"error": "Not found"})

    def do_PATCH(self):
        """Handle PATCH requests"""
        request_info = self._get_request_info()
        path = request_info["path"]

        if path == "/patch":
            response = {
                "args": request_info["query"],
                "data": request_info["body"],
                "headers": request_info["headers"],
                "json": None,
                "url": f"http://{self.headers.get('Host', 'localhost:8080')}{self.path}",
            }

            # Try to parse JSON if content-type is json
            if "application/json" in request_info["headers"].get("Content-Type", ""):
                try:
                    response["json"] = json.loads(request_info["body"])
                except json.JSONDecodeError:
                    pass

            self._send_json_response(200, response)
        else:
            self._send_json_response(404, {"error": "Not found"})

    def do_HEAD(self):
        """Handle HEAD requests"""
        path = urllib.parse.urlparse(self.path).path

        if path == "/get":
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        """Suppress default logging"""
        pass


def find_free_port(start_port=8880, end_port=8899):
    """Find a free port within the given range"""
    import socket

    for port in range(start_port, end_port + 1):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(("0.0.0.0", port))
                return port
            except OSError:
                continue

    raise RuntimeError(f"No free port found in range {start_port}-{end_port}")


def run_server(port=None):
    """Run the mock HTTP server"""
    if port is None:
        port = find_free_port()

    try:
        server = HTTPServer(("0.0.0.0", port), MockHTTPHandler)
        print(f"Mock HTTP server running on port {port}")

        # Write port to a file that can be read by the test environment
        import os

        port_file = os.environ.get("HTTP_MOCK_PORT_FILE", "/tmp/http-mock-port")
        try:
            # Ensure directory exists (if any)
            port_dir = os.path.dirname(port_file)
            if port_dir:
                os.makedirs(port_dir, exist_ok=True)
            with open(port_file, "w") as f:
                f.write(str(port))
            print(f"Port file written to {port_file}")
        except Exception as e:
            print(f"ERROR: Failed to write port file {port_file}: {e}")
            raise  # Don't ignore port file write errors

        server.serve_forever()
    except OSError as e:
        if port is not None:
            # If specific port was requested but failed, try to find a free one
            print(f"Port {port} not available, finding free port...")
            run_server(None)
        else:
            raise e


if __name__ == "__main__":
    import sys

    port = int(sys.argv[1]) if len(sys.argv) > 1 else None
    run_server(port)
