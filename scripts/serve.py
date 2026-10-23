#!/usr/bin/env python3
"""Serve the prebuilt player on localhost without installing Node dependencies."""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
import webbrowser

root = Path(__file__).resolve().parent.parent / 'dist'
if not (root / 'index.html').is_file():
    raise SystemExit('Production build missing. Run npm ci && npm run build first.')
server = ThreadingHTTPServer(('127.0.0.1', 8765), partial(SimpleHTTPRequestHandler, directory=str(root)))
url = 'http://127.0.0.1:8765/'
print(f'Yellow Player: {url}\nKeep this terminal open. Press Ctrl+C to stop.')
webbrowser.open(url)
try:
    server.serve_forever()
except KeyboardInterrupt:
    pass
finally:
    server.server_close()
