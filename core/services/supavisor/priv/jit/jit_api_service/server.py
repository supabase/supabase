import json
import logging
import sys
import time
from http.server import BaseHTTPRequestHandler, HTTPServer

# Configure logging for Docker (outputs to stdout/stderr)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
    force=True,
)

logger = logging.getLogger(__name__)

testCases = [
    {
        "auth": "sbp_TEST_TOKEN_REDACTED",
        "expected_role": "postgres",
        "response": {
            "code": 200,
            "data": {
                "user_id": "087f4b1c-da1c-4172-92c5-1ace925079ea",
                "user_role": {"role": "postgres"},
            },
        },
    },
    {
        "auth": "sbp_TEST_TOKEN_REDACTED",
        "expected_role": "postgres",
        "response": {
            "code": 200,
            "data": {
                "user_id": "087f4b1c-da1c-4172-92c5-1ace925079ea",
                "user_role": {"role": "otherrole"},
            },
        },
    },
    {
        "auth": "sbp_TEST_TOKEN_REDACTED",
        "expected_role": "supabase_admin",
        "response": {"code": 403, "data": ""},
    },
    {
        "auth": "sbp_TEST_TOKEN_REDACTED",
        "expected_role": "postgres",
        "response": {
            "code": 503,
            "data": {
                "message": "error_occurred",
            },
        },
    },
    {
        "auth": "sbp_TEST_TOKEN_REDACTED",
        "expected_role": "postgres",
        "max_uses": 2,
        "window_seconds": 5,
        "response": {
            "code": 200,
            "data": {
                "user_id": "087f4b1c-da1c-4172-92c5-1ace925079ea",
                "user_role": {"role": "postgres"},
            },
        },
    },
    {
        "auth": "sbp_TEST_TOKEN_REDACTED",
        "expected_role": "postgres",
        "max_uses": 3,
        "window_seconds": 5,
        "response": {
            "code": 200,
            "data": {
                "user_id": "087f4b1c-da1c-4172-92c5-1ace925079ea",
                "user_role": {"role": "postgres"},
            },
        },
    },
    {
        "auth": "sbp_TEST_TOKEN_REDACTED",
        "expected_role": "postgres",
        "max_uses": 1,
        "window_seconds": 5,
        "response": {
            "code": 200,
            "data": {
                "user_id": "087f4b1c-da1c-4172-92c5-1ace925079ea",
                "user_role": {"role": "postgres"},
            },
        },
    },
    {
        "auth": "sbp_TEST_TOKEN_REDACTED",
        "expected_role": "postgres",
        "max_uses": 2,
        "window_seconds": 5,
        "response": {
            "code": 200,
            "data": {
                "user_id": "087f4b1c-da1c-4172-92c5-1ace925079ea",
                "user_role": {"role": "postgres"},
            },
        },
    },
]

# Track usage for rate-limited tokens: {token: {"count": N, "first_used": timestamp}}
token_usage = {}


class SimpleHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        # Read Authorization header
        auth = self.headers.get("Authorization").replace("Bearer ", "")

        # Read body
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length).decode("utf-8")

        try:
            data = json.loads(body)
        except json.JSONDecodeError:
            self.send_response(400)
            self.end_headers()
            self.wfile.write(b'{"error":"invalid JSON"}')
            return

        resp_code = 401  # default
        response_bytes = json.dumps({"message": "failed authorization"}).encode()

        logger.info(
            f"POST request from {self.client_address[0]} - Auth token: {auth[:10]}, Data: {json.dumps(data)}"
        )
        # Build response
        for case in testCases:
            if auth == case.get("auth"):
                # Check rate limits if configured
                max_uses = case.get("max_uses")
                window_seconds = case.get("window_seconds")
                if max_uses is not None and window_seconds is not None:
                    now = time.time()
                    usage = token_usage.get(auth)
                    if usage is not None:
                        elapsed = now - usage["first_used"]
                        if elapsed > window_seconds:
                            # Window expired, reset
                            token_usage[auth] = {"count": 1, "first_used": now}
                        elif usage["count"] >= max_uses:
                            # Exhausted within window
                            logger.info(
                                f"Rate-limited token {auth[:10]}... - {usage['count']} uses in {elapsed:.1f}s"
                            )
                            resp_code = 401
                            response_bytes = json.dumps({"message": "token expired"}).encode()
                            break
                        else:
                            usage["count"] += 1
                    else:
                        token_usage[auth] = {"count": 1, "first_used": now}

                resp_code = case.get("response").get("code")
                response_bytes = json.dumps(case.get("response").get("data")).encode(
                    "utf-8"
                )
                logger.info(
                    f"Auth test case {auth} - ResponseCode: {resp_code}, ResponseData: {response_bytes}"
                )
                break

        # Send response
        self.send_response(resp_code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(response_bytes)))
        self.end_headers()

        self.wfile.write(response_bytes)

    def do_GET(self):
        if self.path == "/health":
            logger.info(f"GET health from {self.client_address[0]}")
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"status":"healthy"}')

    # Silence logging
    def log_message(self, format, *args):
        return


if __name__ == "__main__":
    server = HTTPServer(("0.0.0.0", 8080), SimpleHandler)
    print("Server listening on port 8080")
    server.serve_forever()
