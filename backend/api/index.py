import sys
import os

# Add parent directory to path so we can import main
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, parent_dir)

# Change working directory to parent so .env and relative paths work
os.chdir(parent_dir)

try:
    from main import app  # noqa: E402, F401
except Exception as e:
    import traceback
    traceback.print_exc(file=sys.stderr)
    raise
