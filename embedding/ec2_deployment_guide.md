# EC2 Deployment Guide for Image Similarity App

This guide provides step-by-step instructions for deploying your image similarity application on an AWS EC2 instance.

## Step 1: Launch an EC2 Instance

1. Log in to the AWS Management Console
2. Navigate to EC2 service
3. Click "Launch instance"
4. Choose an Amazon Machine Image (AMI)
   - Recommended: Amazon Linux 2023 or Ubuntu Server 22.04 LTS
5. Choose an Instance Type
   - For development/testing: t2.medium (2 vCPU, 4 GiB memory)
   - For production: t3.large (2 vCPU, 8 GiB memory) or better
6. Configure Instance Details
   - Use default settings or customize as needed
7. Add Storage
   - Recommended: At least 20 GiB for system and application
8. Add Tags (optional)
   - Key: Name, Value: ImageSimilarityApp
9. Configure Security Group
   - Allow SSH (port 22) from your IP
   - Allow HTTP (port 80) from anywhere
   - Allow HTTPS (port 443) from anywhere
10. Review and Launch
11. Create or select an existing key pair
    - Download the key pair (.pem file) and keep it secure
12. Launch the instance

## Step 2: Connect to Your EC2 Instance

Using SSH:

```bash
# Change permissions for your key file
chmod 400 your-key-pair.pem

# Connect to your instance
ssh -i "your-key-pair.pem" ec2-user@your-instance-public-dns
```

## Step 3: Set Up the Environment

### Update and Install Dependencies

For Amazon Linux 2023:

```bash
# Update package lists
sudo dnf update -y

# Install Python and other dependencies
sudo dnf install -y python3 python3-pip python3-devel git nginx

# Install development tools
sudo dnf groupinstall "Development Tools" -y
```

For Ubuntu:

```bash
# Update package lists
sudo apt update
sudo apt upgrade -y

# Install Python and other dependencies
sudo apt install -y python3 python3-pip python3-dev git nginx

# Install development tools
sudo apt install -y build-essential
```

### Create a Directory for the Application

```bash
# Create directory
mkdir -p ~/image-similarity-app
cd ~/image-similarity-app
```

## Step 4: Upload Your Application Code

Option 1: Using Git:

```bash
# Clone your repository (if your code is on GitHub, GitLab, etc.)
git clone https://your-repository-url.git .
```

Option 2: Using SCP to upload files from your local machine:

```bash
# Run this command on your local machine, not on the EC2 instance
scp -i "your-key-pair.pem" -r /path/to/your/app/* ec2-user@your-instance-public-dns:~/image-similarity-app/
```

## Step 5: Install Python Dependencies

```bash
# Create a virtual environment
python3 -m venv venv
source venv/bin/activate

# Install PyTorch (CPU version is usually sufficient)
pip install torch==2.1.2 torchvision==0.16.2 --index-url https://download.pytorch.org/whl/cpu

# Install other dependencies
pip install flask==2.3.3 gunicorn==23.0.0 Pillow==10.0.0 numpy==1.26.0
```

## Step 6: Configure Gunicorn as a Service

Create a systemd service file:

```bash
sudo nano /etc/systemd/system/image-similarity.service
```

Add the following content:

```
[Unit]
Description=Gunicorn instance to serve image similarity application
After=network.target

[Service]
User=ec2-user
Group=ec2-user
WorkingDirectory=/home/ec2-user/image-similarity-app
Environment="PATH=/home/ec2-user/image-similarity-app/venv/bin"
ExecStart=/home/ec2-user/image-similarity-app/venv/bin/gunicorn --workers 3 --bind 0.0.0.0:5000 --timeout 120 main:app

[Install]
WantedBy=multi-user.target
```

For Ubuntu, change the User and Group to ubuntu, and update the paths accordingly.

Start and enable the service:

```bash
sudo systemctl start image-similarity
sudo systemctl enable image-similarity
sudo systemctl status image-similarity
```

## Step 7: Configure Nginx as a Reverse Proxy

Create an Nginx configuration file:

```bash
sudo nano /etc/nginx/conf.d/image-similarity.conf
```

Add the following content:

```
server {
    listen 80;
    server_name your_domain_or_ip;

    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 20M;  # Allow uploads up to 20MB
    }
}
```

Test and restart Nginx:

```bash
# Test the configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

## Step 8: Set Up SSL with Let's Encrypt (Optional but Recommended)

Install Certbot:

For Amazon Linux 2023:
```bash
sudo dnf install -y certbot python3-certbot-nginx
```

For Ubuntu:
```bash
sudo apt install -y certbot python3-certbot-nginx
```

Obtain and install SSL certificate:

```bash
sudo certbot --nginx -d your_domain
```

Follow the prompts to complete the certificate setup.

## Step 9: Test Your Application

Open your browser and navigate to your EC2 instance's public IP address or domain name:

```
http://your_domain_or_ip
```

Your image similarity application should now be running!

## Maintenance and Monitoring

### Set Up Automatic Updates

For Amazon Linux 2023:
```bash
sudo dnf install -y dnf-automatic
sudo systemctl enable --now dnf-automatic.timer
```

For Ubuntu:
```bash
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

### Set Up Basic Monitoring

```bash
# Install monitoring tool
sudo amazon-linux-extras install epel
sudo dnf install -y htop
```

### Create a Backup Script

Create a simple backup script in ~/backup.sh:

```bash
#!/bin/bash
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
BACKUP_DIR="/home/ec2-user/backups"
mkdir -p $BACKUP_DIR

# Backup application files
tar -czf $BACKUP_DIR/app-$TIMESTAMP.tar.gz -C /home/ec2-user/image-similarity-app .

# Keep only the 5 most recent backups
ls -t $BACKUP_DIR/app-*.tar.gz | tail -n +6 | xargs -r rm
```

Make it executable and set up a cron job:

```bash
chmod +x ~/backup.sh
crontab -e
```

Add this line to run the backup daily at 2 AM:
```
0 2 * * * /home/ec2-user/backup.sh
```

## Troubleshooting

### Check Application Logs

```bash
# Check Gunicorn service logs
sudo journalctl -u image-similarity.service

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Common Issues

1. **Application not starting**:
   - Check the Gunicorn service status: `sudo systemctl status image-similarity`
   - Verify all dependencies are installed correctly

2. **Cannot connect to the application**:
   - Check if Nginx is running: `sudo systemctl status nginx`
   - Check if security groups allow HTTP/HTTPS traffic
   - Test the application directly: `curl http://localhost:5000`

3. **"502 Bad Gateway" error**:
   - This usually means Gunicorn is not running or not accessible
   - Check the service: `sudo systemctl restart image-similarity`
   - Verify the socket/port configuration in Nginx and Gunicorn match

4. **Slow performance**:
   - Consider resizing your EC2 instance type
   - Optimize the number of Gunicorn workers (typically 2-4× number of CPU cores)
   - Use AWS CloudWatch to monitor resource usage