#!/usr/bin/env python3
"""Rebuild docs and packed JavaScript, then create a fork distribution ZIP.

Use --check to verify generated files without writing an archive.
The archive preserves repository paths so examples and local links keep working.
"""
import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys
import zipfile

ROOT = Path(__file__).resolve().parent.parent
DIRECTORIES = ('MochiKit', 'packed', 'doc', 'examples', 'include', 'scripts', 'tests')
ROOT_FILES = ('README.md', 'LICENSE.txt', 'index.html', 'requirements-docs.txt')


def distribution_files():
    files = [ROOT / name for name in ROOT_FILES]
    for directory in DIRECTORIES:
        files.extend(path for path in (ROOT / directory).rglob('*')
                     if path.is_file() and '__pycache__' not in path.parts
                     and path.suffix != '.pyc' and not any(part.startswith('.')
                     for part in path.relative_to(ROOT).parts))
    return sorted(files)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args(argv)
    for script in ('pack.py', 'make_docs.py'):
        command = [sys.executable, str(ROOT / 'scripts' / script)]
        if args.check:
            command.append('--check')
        subprocess.run(command, cwd=ROOT, check=True)
    if args.check:
        return 0
    version = re.search(r'MochiKit.MochiKit.VERSION\s*=\s*[\'"]([^\'"]+)',
                        (ROOT / 'MochiKit' / 'MochiKit.js').read_text(encoding='utf-8')).group(1)
    package = 'MochiKit-' + version + '-jasonbunting'
    files = distribution_files()
    contents = {path.relative_to(ROOT).as_posix(): path.read_bytes() for path in files}
    meta = {
        'name': 'MochiKit (JasonBunting fork)', 'version': version,
        'repository': 'https://github.com/JasonBunting/mochikit',
        'upstream': 'https://github.com/mochi/mochikit',
        'license_file': 'LICENSE.txt',
        'packed_sha256': hashlib.sha256(contents['packed/MochiKit/MochiKit.js']).hexdigest(),
        'provides': {path.stem: {'file': path.relative_to(ROOT).as_posix(), 'version': version}
                     for path in files if path.parent == ROOT / 'MochiKit'},
    }
    contents['META.json'] = (json.dumps(meta, indent=2, sort_keys=True) + '\n').encode('utf-8')
    contents['Changes'] = contents['doc/rst/MochiKit/VersionHistory.rst']
    contents['MANIFEST'] = ('\n'.join(sorted(list(contents) + ['MANIFEST'])) + '\n').encode('utf-8')
    output = ROOT / 'dist' / (package + '.zip')
    output.parent.mkdir(exist_ok=True)
    temporary = output.with_suffix('.zip.tmp')
    try:
        with zipfile.ZipFile(temporary, 'w', compression=zipfile.ZIP_DEFLATED) as archive:
            for name, data in sorted(contents.items()):
                info = zipfile.ZipInfo(package + '/' + name, date_time=(1980, 1, 1, 0, 0, 0))
                info.create_system = 3
                info.external_attr = 0o100644 << 16
                info.compress_type = zipfile.ZIP_DEFLATED
                archive.writestr(info, data)
        temporary.replace(output)
    finally:
        if temporary.exists():
            temporary.unlink()
    print('Created ' + str(output))
    return 0


if __name__ == '__main__':
    sys.exit(main())
