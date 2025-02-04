#!/bin/bash

# Check for force env var or production environment
if [[ "$FORCE_ASSET_CDN" != "1" ]] && [[ "$VERCEL_ENV" != "production" ]]; then
    echo "Skipping asset upload. Set FORCE_ASSET_CDN=1 or VERCEL_ENV=production to execute."
    exit 0
fi

# Configuration
BUCKET_NAME="demo-sb-cdn-assets"
STATIC_DIR=".next/static"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Install AWS CLI if not present
if ! command -v aws &> /dev/null; then
    echo -e "${YELLOW}Setting up AWS CLI...${NC}"
    curl -s "https://awscli.amazonaws.com/awscli-exe-linux-x86_64-2.22.35.zip" -o "awscliv2.zip"
    unzip -q awscliv2.zip
    export PATH=$PWD/aws/dist:$PATH
    rm awscliv2.zip
fi

# Check if directory exists
if [ ! -d "$STATIC_DIR" ]; then
    echo -e "${YELLOW}Directory $STATIC_DIR not found!${NC}"
    echo "Make sure you're running this script from your Next.js project root."
    exit 1
fi

# Upload files with cache configuration and custom endpoint
echo -e "${YELLOW}Uploading static files to R2...${NC}"
aws s3 sync "$STATIC_DIR" "s3://$BUCKET_NAME/$SITE_NAME/${VERCEL_GIT_COMMIT_SHA:0:12}/_next/static" \
    --endpoint-url "$ASSET_CDN_S3_ENDPOINT" \
    --cache-control "public,max-age=31536000,immutable" \
    --region auto \
    --only-show-errors

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Upload completed successfully!${NC}"
    
    # Clean up local static files so we prevent a double upload
    echo -e "${YELLOW}Cleaning up local static files...${NC}"
    rm -rf "$STATIC_DIR"/*
    echo -e "${GREEN}Local static files cleaned up${NC}"
fi