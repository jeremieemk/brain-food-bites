# tiny local server that saves one transcript sent by the youtube page, then stops.
# usage: python3 -I scripts/receive-transcript.py
# it listens on 127.0.0.1:8765 (this computer only) and writes into ../transcripts/

import http.server, json, os, re

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "transcripts")
os.makedirs(OUT, exist_ok=True)


class Handler(http.server.BaseHTTPRequestHandler):
    def allow_youtube(self):
        # let the youtube page (and only it) send data here
        self.send_header("Access-Control-Allow-Origin", "https://www.youtube.com")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Private-Network", "true")

    def do_OPTIONS(self):
        self.send_response(204)
        self.allow_youtube()
        self.end_headers()

    def do_POST(self):
        data = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
        name = re.sub(r"[^a-zA-Z0-9_.-]", "", data["name"])
        with open(os.path.join(OUT, name), "w") as f:
            f.write(data["text"])
        self.send_response(200)
        self.allow_youtube()
        self.end_headers()
        self.wfile.write(b"ok")
        print(f"saved {name}", flush=True)
        self.server.done = True

    def log_message(self, *args):
        pass


server = http.server.HTTPServer(("127.0.0.1", 8765), Handler)
server.done = False
while not server.done:
    server.handle_request()
