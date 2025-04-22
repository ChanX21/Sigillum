#!/bin/bash
# Script to set up the necessary environment on an EC2 instance for the image similarity app

# Detect OS
if [ -f /etc/os-release ]; then
    # freedesktop.org and systemd
    . /etc/os-release
    OS=$NAME
elif type lsb_release >/dev/null 2>&1; then
    # linuxbase.org
    OS=$(lsb_release -si)
elif [ -f /etc/lsb-release ]; then
    # For some versions of Debian/Ubuntu without lsb_release command
    . /etc/lsb-release
    OS=$DISTRIB_ID
elif [ -f /etc/debian_version ]; then
    # Older Debian/Ubuntu/etc.
    OS=Debian
elif [ -f /etc/SuSe-release ] || [ -f /etc/redhat-release ]; then
    # Older Red Hat, CentOS, etc.
    OS=$(cat /etc/redhat-release | cut -d ' ' -f 1)
else
    # Fall back to uname, e.g. "Linux <version>", also works for BSD, etc.
    OS=$(uname -s)
fi

# Convert to lowercase
OS=$(echo "$OS" | tr '[:upper:]' '[:lower:]')

echo "Detected OS: $OS"
echo "Setting up environment for image similarity application..."

# Install dependencies based on OS
if [[ "$OS" == *"amazon"* ]]; then
    echo "Setting up Amazon Linux..."
    
    # Update system
    sudo dnf update -y
    
    # Install Python and dependencies
    sudo dnf install -y python3 python3-pip python3-devel git nginx
    
    # Install development tools
    sudo dnf groupinstall "Development Tools" -y
    
elif [[ "$OS" == *"ubuntu"* ]]; then
    echo "Setting up Ubuntu..."
    
    # Update system
    sudo apt update
    sudo apt upgrade -y
    
    # Install Python and dependencies
    sudo apt install -y python3 python3-pip python3-dev git nginx
    
    # Install development tools
    sudo apt install -y build-essential
    
else
    echo "Unsupported OS. Please use Amazon Linux or Ubuntu."
    exit 1
fi

# Create application directory
APP_DIR="$HOME/image-similarity-app"
mkdir -p $APP_DIR
echo "Created application directory: $APP_DIR"

# Set up Python virtual environment
cd $APP_DIR
python3 -m venv venv
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

echo "Installing PyTorch (CPU version)..."
pip install torch==2.1.2 torchvision==0.16.2 --index-url https://download.pytorch.org/whl/cpu

echo "Installing Flask and other dependencies..."
pip install flask==2.3.3 gunicorn==23.0.0 Pillow==10.0.0 numpy==1.26.0

# Create a test file to verify the environment
echo "Testing installation..."
cat > $APP_DIR/test.py << EOL
import torch
import torchvision
import numpy as np
import PIL
import flask
import gunicorn

print("Environment test successful!")
print(f"PyTorch version: {torch.__version__}")
print(f"TorchVision version: {torchvision.__version__}")
print(f"NumPy version: {np.__version__}")
print(f"PIL version: {PIL.__version__}")
print(f"Flask version: {flask.__version__}")
EOL

python test.py
rm test.py

# Create service file
echo "Creating systemd service file..."
SERVICE_FILE="image-similarity.service"
cat > $SERVICE_FILE << EOL
[Unit]
Description=Gunicorn instance to serve image similarity application
After=network.target

[Service]
User=$(whoami)
Group=$(whoami)
WorkingDirectory=$APP_DIR
Environment="PATH=$APP_DIR/venv/bin"
ExecStart=$APP_DIR/venv/bin/gunicorn --workers 3 --bind 0.0.0.0:5000 --timeout 120 main:app

[Install]
WantedBy=multi-user.target
EOL

sudo mv $SERVICE_FILE /etc/systemd/system/
sudo systemctl daemon-reload

# Create Nginx configuration
echo "Creating Nginx configuration..."
NGINX_CONF="image-similarity.conf"
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
cat > $NGINX_CONF << EOL
server {
    listen 80;
    server_name $PUBLIC_IP;

    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        client_max_body_size 20M;
    }
}
EOL

sudo mv $NGINX_CONF /etc/nginx/conf.d/
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx

echo "===================================="
echo "Setup complete!"
echo "Use the following steps to deploy your application:"
echo "1. Upload your application files to: $APP_DIR"
echo "2. Start the application: sudo systemctl start image-similarity"
echo "3. Enable automatic start at boot: sudo systemctl enable image-similarity"
echo "4. Access your application at: http://$PUBLIC_IP"
echo "===================================="