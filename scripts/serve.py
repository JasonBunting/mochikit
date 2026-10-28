#!/usr/bin/env python3
"""Serve this checkout; --packed runs the existing browser tests on the bundle."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import io
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent
SCRIPT = re.compile(r'<script\b[^>]*src="\.\./MochiKit/([^"/]+)\.js"[^>]*></script>')


def packed_test_html(html):
    included = False

    def replace(match):
        nonlocal included
        if match.group(1) == 'MockDOM':
            return match.group(0)  # Test fixture, not a production module.
        if included:
            return ''
        included = True
        return '<script src="/packed/MochiKit/MochiKit.js"></script>'

    return SCRIPT.sub(replace, html)


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, packed=False, **kwargs):
        self.packed = packed
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def send_head(self):
        path = Path(self.translate_path(self.path)).resolve()
        if (self.packed and path.is_relative_to(ROOT / 'tests')
                and path.suffix == '.html' and path.is_file()):
            data = packed_test_html(path.read_text(encoding='utf-8')).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(data)))
            self.end_headers()
            return io.BytesIO(data)
        return super().send_head()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--packed', action='store_true')
    parser.add_argument('--port', type=int, default=8000)
    args = parser.parse_args()
    with ThreadingHTTPServer(('127.0.0.1', args.port), partial(Handler, packed=args.packed)) as server:
        print('Serving %s tests at http://127.0.0.1:%d/tests/index.html' %
              ('packed' if args.packed else 'source', server.server_port), flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == '__main__':
    main()
