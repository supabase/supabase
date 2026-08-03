# Current Naming Conventions Review

## Service Names (in docker-compose.yml)
All services are prefixed with 'ads-':
- ads-studio
- ads-kong
- ads-auth
- ads-rest
- ads-realtime
- ads-edge-functions
- ads-meta
- ads-analytics
- ads-db
- ads-vector
- ads-storage
- ads-pooler

## Project and Organization Names
Current settings:
- Organization: Arivant
- Project: MainConsole
- Default Project: ArivantOne

## Service-Specific Names
1. Storage Service:
   - User: ads-storage-service
   - S3 Bucket: ads-arivant-s3-storage
   - IAM User: ads-storage-service

2. Email Configuration:
   - Sender Name: Arivant Support Team
   - Admin Email: noreply@arivant.com

3. Database:
   - Host: ads-db
   - Database: postgres
   - Port: 5432

4. Network:
   - Network Name: ADS-BaaS-Corenet
   - Subnet: 172.18.0.0/16

## Points for Discussion:

1. Service Prefixes:
   - Currently using 'ads-' prefix
   - Should we maintain this convention?
   - Consider impact on monitoring and logging

2. Project Naming:
   - Current project name is "MainConsole"
   - Consider changing to something more descriptive?
   - Tenant ID is "ArivantOne" - should this match project name?

3. Service Names:
   - Storage service uses multiple variations (ads-storage-service, ads-storage)
   - Should we standardize these?

4. Organization Structure:
   - Organization name: "Arivant"
   - Project name: "MainConsole"
   - Consider hierarchy and scaling

5. Email/Domain Names:
   - Currently using arivant.com domain
   - Support team naming convention
   - Email templates and branding

6. Resource Naming:
   - S3 bucket naming convention
   - IAM user naming
   - Database naming

## Recommendations for Discussion:

1. Standardize Service Prefixes:
   - Keep 'ads-' prefix for consistency
   - Align service names across configurations

2. Project Structure:
   - Consider more descriptive project name
   - Align tenant ID with project naming

3. Resource Naming:
   - Standardize resource naming patterns
   - Consider environment-based prefixes
   - Implement consistent naming across AWS resources

4. Branding Consistency:
   - Align email templates with branding
   - Standardize support contact information
   - Consistent domain usage

Please review these points and provide guidance on:
1. Preferred naming conventions
2. Any services that need renaming
3. Project/Organization structure
4. Resource naming patterns
