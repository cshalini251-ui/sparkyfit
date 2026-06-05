#!/bin/bash

# Proxmox Deployment Script for SparkyFitness

# This script automates the deployment of the SparkyFitness application
# using Docker Compose within a Proxmox LXC (Linux Container).

# IMPORTANT: This script is provided as-is and is largely untested in a live Proxmox environment.
# Use at your own risk. Review each step carefully before execution.

# Prerequisites:
# - A Proxmox VE host with network connectivity.
# - A Linux template available in Proxmox (e.g., debian-11-standard or ubuntu-22.04-standard).
# - Root access on the Proxmox host to run this script.

# --- Configuration Variables ---
# You can modify these default values or provide them via command-line arguments.
LXC_ID="" # Required: Unique ID for the new LXC (e.g., 101)
LXC_HOSTNAME="sparkyfitness-app"
LXC_MEMORY="2048" # MB
LXC_SWAP="512"    # MB
LXC_DISK_SIZE="10G" # GB
LXC_TEMPLATE_PATH="/var/lib/vz/template/cache/debian-11-standard_11.0-1_amd64.tar.gz" # Adjust to your template path
LXC_BRIDGE="vmbr0" # Your Proxmox network bridge
LXC_IP="" # Required: IP address for the LXC (e.g., 192.168.1.100/24)
LXC_GATEWAY="" # Required: Gateway IP (e.g., 192.168.1.1)
LXC_DNS="8.8.8.8" # DNS server

# --- Environment Variables for SparkyFitness (will be written to .env file) ---
# These are example values. You MUST change them for production.
SPARKY_FITNESS_DB_NAME="sparkyfitness_db"
SPARKY_FITNESS_DB_USER="sparkyuser"
SPARKY_FITNESS_DB_PASSWORD="your_db_password" # CHANGE THIS!
SPARKY_FITNESS_SERVER_PORT="3000"
SPARKY_FITNESS_LOG_LEVEL="info"
SPARKY_FITNESS_API_ENCRYPTION_KEY="your_api_encryption_key" # CHANGE THIS! Must be 32 characters long for AES-256
JWT_SECRET="your_jwt_secret" # CHANGE THIS!
SPARKY_FITNESS_FRONTEND_URL="http://your_proxmox_ip:3004" # Change to your Proxmox host IP or domain

# --- Functions ---

# Function to display usage
usage() {
    echo "Usage: proxmox_sparkyfitness.sh -id <LXC_ID> -ip <LXC_IP/CIDR> -gw <LXC_GATEWAY> [-t <TEMPLATE_PATH>]"
    echo "  -id   : Unique ID for the new LXC (e.g., 101)"
    echo "  -ip   : IP address for the LXC with CIDR (e.g., 192.168.1.100/24)"
    echo "  -gw   : Gateway IP for the LXC (e.g., 192.168.1.1)"
    echo "  -t    : Optional: Path to the LXC template (default: $LXC_TEMPLATE_PATH)"
    echo "Example: proxmox_sparkyfitness.sh -id 101 -ip 192.168.1.100/24 -gw 192.168.1.1"
    exit 1
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check for errors and exit
check_error() {
    if [ $? -ne 0 ]; then
        echo "Error: $1"
        exit 1
    fi
}

# --- Main Script ---

# Parse command-line arguments
while getopts "id:ip:gw:t:" opt; do
    case ${opt} in
        i ) LXC_ID=$OPTARG ;;
        p ) LXC_IP=$OPTARG ;;
        g ) LXC_GATEWAY=$OPTARG ;;
        t ) LXC_TEMPLATE_PATH=$OPTARG ;;
        \? ) usage ;;
    esac
done

# Validate required arguments
if [ -z "$LXC_ID" ] || [ -z "$LXC_IP" ] || [ -z "$LXC_GATEWAY" ]; then
    echo "Error: Missing required arguments."
    usage
fi

echo "--- Starting SparkyFitness Proxmox Deployment ---"

# 1. Check for necessary commands
echo "Checking for required commands..."
command_exists pct || check_error "Proxmox 'pct' command not found. Are you running this on a Proxmox host?"
command_exists qm || check_error "Proxmox 'qm' command not found. Are you running this on a Proxmox host?"
echo "All required commands found."

# 2. Create LXC
echo "Creating LXC with ID $LXC_ID..."
pct create $LXC_ID $LXC_TEMPLATE_PATH \
    -hostname $LXC_HOSTNAME \
    -memory $LXC_MEMORY \
    -swap $LXC_SWAP \
    -rootfs local-lvm:$LXC_DISK_SIZE \
    -net0 name=eth0,bridge=$LXC_BRIDGE,ip=$LXC_IP,gw=$LXC_GATEWAY \
    -nameserver $LXC_DNS \
    -unprivileged 1 # Recommended for Docker inside LXC
check_error "Failed to create LXC $LXC_ID."
echo "LXC $LXC_ID created successfully."

# 3. Start LXC
echo "Starting LXC $LXC_ID..."
pct start $LXC_ID
check_error "Failed to start LXC $LXC_ID."
echo "LXC $LXC_ID started."

# 4. Wait for LXC to be ready and update system
echo "Waiting for LXC $LXC_ID to be ready and updating packages..."
# This loop waits until apt update succeeds inside the container
pct exec $LXC_ID -- bash -c "while ! apt update >/dev/null 2>&1; do echo 'Waiting for network and apt update...'; sleep 5; done"
check_error "Failed to update packages in LXC $LXC_ID."
pct exec $LXC_ID -- apt upgrade -y
check_error "Failed to upgrade packages in LXC $LXC_ID."
echo "LXC $LXC_ID is ready and updated."

# 5. Install Docker and Docker Compose inside LXC
echo "Installing Docker and Docker Compose inside LXC $LXC_ID..."
pct exec $LXC_ID -- bash -c "
    apt install -y ca-certificates curl gnupg lsb-release
    mkdir -m 0755 -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo \
      \"deb [arch=\$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
      \$(lsb_release -cs) stable\" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt update
    apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    systemctl enable docker
    systemctl start docker
"
check_error "Failed to install Docker and Docker Compose in LXC $LXC_ID."
echo "Docker and Docker Compose installed in LXC $LXC_ID."

# 6. Create Docker Compose file inside LXC
echo "Creating docker-compose.yml inside LXC $LXC_ID..."
pct exec $LXC_ID -- bash -c 'cat > /root/docker-compose.yml <<EOF
version: "3.9"

services:
  sparkyfitness-db:
    image: postgres:15-alpine
    restart: always
    environment:
      POSTGRES_DB: ${SPARKY_FITNESS_DB_NAME}
      POSTGRES_USER: ${SPARKY_FITNESS_DB_USER}
      POSTGRES_PASSWORD: ${SPARKY_FITNESS_DB_PASSWORD}
    volumes:
      - ./postgresql:/var/lib/postgresql/data
    networks:
      - default # Use default bridge network

  sparkyfitness-server:
    image: codewithcj/sparkyfitness_server:latest # Use pre-built image
    ports:
      - "${SPARKY_FITNESS_SERVER_PORT}:${SPARKY_FITNESS_SERVER_PORT}" # Backend port
    environment:
      SPARKY_FITNESS_SERVER_PORT: ${SPARKY_FITNESS_SERVER_PORT}
      SPARKY_FITNESS_LOG_LEVEL: ${SPARKY_FITNESS_LOG_LEVEL}
      SPARKY_FITNESS_DB_USER: ${SPARKY_FITNESS_DB_USER}
      SPARKY_FITNESS_DB_HOST: sparkyfitness-db # Use the service name 'sparkyfitness-db' for inter-container communication
      SPARKY_FITNESS_DB_NAME: ${SPARKY_FITNESS_DB_NAME}
      SPARKY_FITNESS_DB_PASSWORD: ${SPARKY_FITNESS_DB_PASSWORD}
      SPARKY_FITNESS_DB_PORT: 5432
      SPARKY_FITNESS_API_ENCRYPTION_KEY: ${SPARKY_FITNESS_API_ENCRYPTION_KEY}
      JWT_SECRET: ${JWT_SECRET}
      SPARKY_FITNESS_FRONTEND_URL: ${SPARKY_FITNESS_FRONTEND_URL}
    networks:
      - default # Use default bridge network
    restart: always
    depends_on:
      - sparkyfitness-db # Backend depends on the database being available


  sparkyfitness-frontend:
    image: codewithcj/sparkyfitness:latest # Use pre-built image
    ports:
      - "3004:80" # Map host port 8080 to container port 80 (Nginx)
    networks:
      - default # Use default bridge network
    restart: always
    depends_on:
      - sparkyfitness-server # Frontend depends on the server
networks:
  default:
    driver: bridge
EOF
'
check_error "Failed to create docker-compose.yml in LXC $LXC_ID."
echo "docker-compose.yml created in LXC $LXC_ID."

# 7. Handle .env file
if [ ! -f "./.env" ]; then
    echo "--- IMPORTANT: .env file not found ---"
    echo "Please create a '.env' file in the same directory as this script."
    echo "You can use the following as a template:"
    echo ""
    echo "# SparkyFitness Environment Variables"
    echo "# IMPORTANT: Change these values for production!"
    echo ""
    echo "SPARKY_FITNESS_DB_NAME=\"$SPARKY_FITNESS_DB_NAME\""
    echo "SPARKY_FITNESS_DB_USER=\"$SPARKY_FITNESS_DB_USER\""
    echo "SPARKY_FITNESS_DB_PASSWORD=\"$SPARKY_FITNESS_DB_PASSWORD\""
    echo "SPARKY_FITNESS_SERVER_PORT=\"$SPARKY_FITNESS_SERVER_PORT\""
    echo "SPARKY_FITNESS_LOG_LEVEL=\"$SPARKY_FITNESS_LOG_LEVEL\""
    echo "SPARKY_FITNESS_API_ENCRYPTION_KEY=\"$SPARKY_FITNESS_API_ENCRYPTION_KEY\""
    echo "JWT_SECRET=\"$JWT_SECRET\""
    echo "SPARKY_FITNESS_FRONTEND_URL=\"$SPARKY_FITNESS_FRONTEND_URL\""
    echo ""
    echo "Press any key to continue after you have created your .env file..."
    read -n 1 -s -r -p "" # Wait for user input

    if [ ! -f "./.env" ]; then
        echo "Error: .env file still not found. Exiting."
        exit 1
    fi
fi
echo ".env file found. Proceeding..."

# 8. Copy .env file and postgresql volume to LXC
echo "Copying .env file to LXC $LXC_ID..."
pct push $LXC_ID ./.env /root/.env
check_error "Failed to copy .env file to LXC $LXC_ID."
echo ".env file copied."

echo "Checking for existing postgresql data directory..."
if [ -d "./postgresql" ]; then
    echo "Copying existing postgresql data directory to LXC $LXC_ID..."
    pct push $LXC_ID ./postgresql /root/postgresql
    check_error "Failed to copy postgresql directory to LXC $LXC_ID."
    echo "postgresql directory copied."
else
    echo "No local postgresql directory found. A new one will be created inside the LXC."
fi

# 9. Run Docker Compose
echo "Running Docker Compose in LXC $LXC_ID..."
pct exec $LXC_ID -- bash -c "cd /root && docker compose up -d"
check_error "Failed to run Docker Compose in LXC $LXC_ID."
echo "Docker Compose services are now running in LXC $LXC_ID."

echo ""
echo "--- Deployment Complete! ---"
echo "SparkyFitness should now be running in LXC $LXC_ID."
echo "You can access the frontend at: $SPARKY_FITNESS_FRONTEND_URL"
echo "Remember to open port 3004 (or your chosen frontend port) on your Proxmox host firewall if needed."
echo "You can manage the LXC from your Proxmox web interface or via 'pct enter $LXC_ID'."