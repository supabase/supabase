#!/bin/bash
set -eo pipefail

#######

# This script is used to upload static build assets (JS, CSS, ...) and public static files (public folder) to a CDN.
# We're using Cloudflare R2 as CDN.
# By using a CDN, we can serve static assets extremely fast while saving big time on egress costs.
# An alternative is proxying via CF, but that comes with Orange-To-Orange issues (Cloudflare having issues with Cloudflare) and increased latency as there is a double TLS termination.
# The script is only supposed to run on production deployments and is not run on any previews.

# By using a dynamic path including the env, app and commit hash, we can ensure that there are no conflicts.
# Static assets from previous deployments stick around for a while to ensure there are no "downtimes".

# Advantages of the CDN approach we're using:

# Get rid of egress costs for static assets across our apps on Vercel
# Disable CF proxying and get around these odd timeouts issues
# Save ~20ms or so for asset requests, as there is no additional CF proxying and we avoid terminating SSL twice
# Always hits the CDN, gonna be super quick
# Does not run on local or preview environments, only on staging/prod deployments
# There are no other disadvantages - you don't have to consider it when developing locally, previews still work, everything on Vercel works as we're used to

#######

# If asset CDN is specifically disabled (i.e. studio self-hosted), we skip
if [[ "$FORCE_ASSET_CDN" == "-1" ]]; then
    echo "Skipping asset upload. Set FORCE_ASSET_CDN=1 or VERCEL_ENV=production to execute."
    exit 0
fi

# Check for force env var or production environment
if [[ "$FORCE_ASSET_CDN" != "1" ]] && [[ "$VERCEL_ENV" != "production" ]]; then
    echo "Skipping asset upload. Set FORCE_ASSET_CDN=1 or VERCEL_ENV=production to execute."
    exit 0
fi

# Set the cdnBucket variable based on NEXT_PUBLIC_ENVIRONMENT
if [[ "$NEXT_PUBLIC_ENVIRONMENT" == "staging" ]]; then
  BUCKET_NAME="frontend-assets-staging"
else
  BUCKET_NAME="frontend-assets-prod"
fi

STATIC_DIR=".next/static"
PUBLIC_DIR="public"

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
    --cache-control "public,max-age=604800,immutable" \
    --region auto \
    --only-show-errors

# Some public files may be referenced through CSS (relative path) and therefore they would be requested via the CDN url
# To ensure we don't run into some nasty debugging issues, we upload the public files to the CDN as well 
echo -e "${YELLOW}Uploading public files to R2...${NC}"
aws s3 sync "$PUBLIC_DIR" "s3://$BUCKET_NAME/$SITE_NAME/${VERCEL_GIT_COMMIT_SHA:0:12}" \
    --endpoint-url "$ASSET_CDN_S3_ENDPOINT" \
    --cache-control "public,max-age=604800,immutable" \
    --region auto \
    --only-show-errors

echo -e "${GREEN}Upload completed successfully!${NC}"

# Clean up local static files so we prevent a double upload
echo -e "${YELLOW}Cleaning up local static files...${NC}"
rm -rf "$STATIC_DIR"/*
echo -e "${GREEN}Local static files cleaned up${NC}"

# We still keep the public dir, as Next.js does not officially support serving the public files via CDN