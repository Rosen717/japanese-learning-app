#!/usr/bin/env python3
import argparse
import json
import os
import urllib.error
import urllib.request
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OPENAI_TTS_URL = "https://api.openai.com/v1/audio/speech"


def style_instructions(style: str) -> str:
    if style == "cute":
        return "Speak in Japanese with a youthful, bright, cute female tone. Sound lively and sweet, but stay clear."
    return "Speak in Japanese with a natural, warm, conversational female tone."


def style_speed(style: str) -> float:
    if style == "cute":
        return 1.10
    return 0.96


class AppHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def _send_json(self, status: int, payload: dict) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        if self.path != "/api/tts":
            self._send_json(404, {"error": "Not found"})
            return

        api_key = os.getenv("OPENAI_API_KEY", "").strip()
        if not api_key:
            self._send_json(500, {"error": "Missing OPENAI_API_KEY"})
            return

        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length)
        try:
            payload = json.loads(raw.decode("utf-8")) if raw else {}
        except json.JSONDecodeError:
            self._send_json(400, {"error": "Invalid JSON"})
            return

        text = str(payload.get("input", "")).strip()
        if not text:
            self._send_json(400, {"error": "input is required"})
            return

        voice = str(payload.get("voice", "sage")) or "sage"
        style = str(payload.get("style", "natural"))

        tts_payload = {
            "model": "gpt-4o-mini-tts",
            "voice": voice,
            "input": text,
            "response_format": "mp3",
            "instructions": style_instructions(style),
            "speed": style_speed(style),
        }

        req = urllib.request.Request(
            OPENAI_TTS_URL,
            data=json.dumps(tts_payload).encode("utf-8"),
            method="POST",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
        )

        try:
            with urllib.request.urlopen(req, timeout=45) as resp:
                audio = resp.read()
        except urllib.error.HTTPError as e:
            details = e.read().decode("utf-8", errors="replace") if hasattr(e, "read") else ""
            self._send_json(e.code, {"error": "OpenAI API error", "details": details})
            return
        except Exception as e:
            self._send_json(502, {"error": f"TTS request failed: {e}"})
            return

        self.send_response(200)
        self.send_header("Content-Type", "audio/mpeg")
        self.send_header("Content-Length", str(len(audio)))
        self.end_headers()
        self.wfile.write(audio)


def main() -> None:
    parser = argparse.ArgumentParser(description="Run YomuNavi local server with TTS proxy")
    parser.add_argument("--port", type=int, default=8080)
    args = parser.parse_args()

    server = ThreadingHTTPServer(("127.0.0.1", args.port), AppHandler)
    print(f"Serving {ROOT} at http://127.0.0.1:{args.port}")
    server.serve_forever()


if __name__ == "__main__":
    main()
