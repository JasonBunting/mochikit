"""Regression checks for the packed build command (no Java needed)."""
import importlib.util
import io
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('pack', Path(__file__).with_name('pack.py'))
pack = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pack)


class PackTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.output = Path(self.directory.name) / 'MochiKit.js'
        self.output.write_bytes(b'previous bundle\n')
        self.addCleanup(patch.stopall)
        patch.object(pack, 'OUTPUT', self.output).start()
        patch('sys.stderr', new_callable=io.StringIO).start()
        patch('sys.stdout', new_callable=io.StringIO).start()

    def test_failed_compilation_preserves_bundle(self):
        with patch.object(pack, 'build', side_effect=subprocess.CalledProcessError(1, 'java')):
            self.assertEqual(pack.main([]), 1)
        self.assertEqual(self.output.read_bytes(), b'previous bundle\n')

    def test_stale_check_does_not_overwrite(self):
        with patch.object(pack, 'build', return_value=b'new bundle\n'):
            self.assertEqual(pack.main(['--check']), 1)
        self.assertEqual(self.output.read_bytes(), b'previous bundle\n')

    def test_check_accepts_checkout_line_endings(self):
        self.output.write_bytes(b'current bundle\r\n')
        with patch.object(pack, 'build', return_value=b'current bundle\n'):
            self.assertEqual(pack.main(['--check']), 0)
        self.assertEqual(self.output.read_bytes(), b'current bundle\r\n')

    def test_successful_build_replaces_bundle(self):
        with patch.object(pack, 'build', return_value=b'new bundle\n'):
            self.assertEqual(pack.main([]), 0)
        self.assertEqual(self.output.read_bytes(), b'new bundle\n')
        self.assertEqual(list(self.output.parent.iterdir()), [self.output])

    def test_invalid_module_rejected_before_java(self):
        with patch.object(pack.subprocess, 'run') as run:
            with self.assertRaises(ValueError):
                pack.build(['../README'])
            run.assert_not_called()

    def test_compiler_exit_status_is_checked_and_scratch_removed(self):
        paths = []
        def fail(command, **kwargs):
            paths.append(Path(command[-1]))
            self.assertTrue(paths[0].is_file())
            self.assertTrue(kwargs['check'])
            raise subprocess.CalledProcessError(1, command)
        with patch.object(pack.subprocess, 'run', side_effect=fail):
            with self.assertRaises(subprocess.CalledProcessError):
                pack.build(['Base'])
        self.assertFalse(paths[0].exists())


if __name__ == '__main__':
    unittest.main()
