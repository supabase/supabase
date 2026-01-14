# Repository Setup Plan

## Directory Structure
```
ADS-BaaS/
├── .env                      (existing)
├── docker-compose.yml        (existing)
├── volumes/
│   ├── api/
│   │   └── kong.yml
│   ├── db/
│   │   ├── realtime.sql
│   │   ├── webhooks.sql
│   │   ├── roles.sql
│   │   ├── jwt.sql
│   │   ├── _supabase.sql
│   │   ├── logs.sql
│   │   └── pooler.sql
│   ├── realtime/
│   │   └── data/
│   ├── functions/
│   │   └── node-function/
│   ├── logs/
│   │   └── vector.toml
│   └── pooler/
│       └── pooler.exs
├── ads-auth-v2/             (custom auth implementation)
│   └── Dockerfile
├── ads-storage/             (custom storage implementation)
│   └── Dockerfile
├── init-kong.sh
└── documentation/
    ├── TaskManagementPlan.md
    ├── BranchingStrategy.md
    └── TaskProgress.log

## Implementation Steps

1. Create Directory Structure
   - Create all required directories
   - Set up volume mounts
   - Ensure proper permissions

2. Configuration Files
   - Set up Kong API gateway configuration
   - Configure Vector logging
   - Initialize database scripts
   - Configure connection pooling

3. Custom Services
   - Implement ads-auth-v2 service
   - Implement ads-storage service with AWS S3
   - Configure service networking

4. Documentation
   - Move management files to documentation directory
   - Update paths in docker-compose.yml
   - Document service configurations

## Service Customizations

### Authentication (ads-auth-v2)
- Custom GoTrue implementation
- AWS SES integration
- JWT configuration

### Storage (ads-storage)
- AWS S3 backend
- Custom image transformation
- Tenant isolation

### Networking
- Custom subnet: 172.18.0.0/16
- Service discovery via ADS-BaaS-Corenet
- Internal DNS resolution

## Security Considerations
- JWT secret management
- Database password handling
- AWS credential management
- Network isolation
