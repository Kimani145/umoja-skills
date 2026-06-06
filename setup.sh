#!/bin/bash
set -e

PROJECT_ROOT=$(pwd)

# Create backend structure
cd $PROJECT_ROOT/backend
mkdir -p core users services bookings reviews messaging

# Create Django manage.py and wsgi
cat > manage.py << 'EOF'
#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys


def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
EOF

chmod +x manage.py
touch core/__init__.py
mkdir -p core/{migrations,templates,static}

cd $PROJECT_ROOT/frontend
echo "Frontend directory created at $PROJECT_ROOT/frontend"

echo "Setup complete. Structure created."
