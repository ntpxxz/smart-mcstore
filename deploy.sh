#!/bin/bash

# OneInv Docker Deployment Script (Linux/Mac)
# Usage: ./deploy.sh [environment] [options]
# Example: ./deploy.sh production --build

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="production"
BUILD=false
NO_PULL=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        development|production|staging)
            ENVIRONMENT="$1"
            shift
            ;;
        --build|-b)
            BUILD=true
            shift
            ;;
        --no-pull)
            NO_PULL=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [environment] [options]"
            echo ""
            echo "Environments:"
            echo "  development, production, staging (default: production)"
            echo ""
            echo "Options:"
            echo "  --build, -b      Force rebuild Docker image"
            echo "  --no-pull        Skip git pull"
            echo "  --help, -h       Show this help message"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

echo -e "${CYAN}🚀 OneInv Docker Deployment Script${NC}"
echo -e "${YELLOW}Environment: $ENVIRONMENT${NC}"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker found: $(docker --version)${NC}"

# Check if docker compose is available
if ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker Compose found: $(docker compose version)${NC}"

echo ""

# Set environment file
ENV_FILE=".env.$ENVIRONMENT"
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ Environment file not found: $ENV_FILE${NC}"
    echo -e "${YELLOW}   Creating from template...${NC}"
    
    if [ -f ".env" ]; then
        cp .env "$ENV_FILE"
        echo -e "${GREEN}✅ Created $ENV_FILE from .env template${NC}"
        echo -e "${YELLOW}⚠️  Please edit $ENV_FILE with your configuration${NC}"
        exit 0
    else
        echo -e "${RED}❌ Template .env file not found${NC}"
        exit 1
    fi
fi

echo -e "${CYAN}📄 Using environment file: $ENV_FILE${NC}"

# Pull latest code (unless --no-pull)
if [ "$NO_PULL" = false ]; then
    echo ""
    echo -e "${CYAN}📥 Pulling latest code...${NC}"
    if git pull; then
        echo -e "${GREEN}✅ Code updated${NC}"
    else
        echo -e "${YELLOW}⚠️  Git pull failed, continuing anyway...${NC}"
    fi
fi

# Stop existing containers
echo ""
echo -e "${CYAN}🛑 Stopping existing containers...${NC}"
docker compose --env-file "$ENV_FILE" down
echo -e "${GREEN}✅ Containers stopped${NC}"

# Build if requested
if [ "$BUILD" = true ]; then
    echo ""
    echo -e "${CYAN}🔨 Building Docker image...${NC}"
    docker compose --env-file "$ENV_FILE" build --no-cache
    echo -e "${GREEN}✅ Build completed${NC}"
fi

# Start containers
echo ""
echo -e "${CYAN}🚀 Starting containers...${NC}"
docker compose --env-file "$ENV_FILE" up -d
echo -e "${GREEN}✅ Containers started${NC}"

# Wait for services to be healthy
echo ""
echo -e "${CYAN}⏳ Waiting for services to be ready...${NC}"
sleep 5

# Check container status
echo ""
echo -e "${CYAN}📊 Container Status:${NC}"
docker compose --env-file "$ENV_FILE" ps

# Show logs
echo ""
echo -e "${CYAN}📋 Recent logs:${NC}"
docker compose --env-file "$ENV_FILE" logs --tail=20 app

# Get app URL
echo ""
echo -e "${GREEN}✅ Deployment completed!${NC}"
echo ""
echo -e "${CYAN}📍 Application URLs:${NC}"
echo "   - App: http://localhost:3000"
echo "   - pgAdmin: http://localhost:5050 (if enabled)"
echo ""
echo -e "${CYAN}📝 Useful commands:${NC}"
echo "   - View logs: docker compose --env-file $ENV_FILE logs -f app"
echo "   - Stop: docker compose --env-file $ENV_FILE stop"
echo "   - Restart: docker compose --env-file $ENV_FILE restart"
echo "   - Remove: docker compose --env-file $ENV_FILE down -v"
echo ""
