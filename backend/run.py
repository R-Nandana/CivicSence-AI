import os
import sys
import uvicorn

# Automatically add project root to python path regardless of where this script is launched from
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)

if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

if __name__ == "__main__":
    print(f"Starting CivicSense Backend API from: {PROJECT_ROOT}")
    uvicorn.run(
        "backend.app.main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        app_dir=PROJECT_ROOT
    )
