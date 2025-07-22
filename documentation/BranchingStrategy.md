# ADS-BaaS Branching Strategy

## Overview
This document outlines the Git branching strategy for the ADS-BaaS project, ensuring consistent version control practices across development sessions.

## Branch Types

### Main Branches
- `main` - Production-ready code
- `develop` - Integration branch for feature development

### Supporting Branches
- `feature/*` - New features and non-emergency fixes
- `hotfix/*` - Urgent production fixes
- `release/*` - Release preparation
- `config/*` - Configuration changes

## Branch Naming Convention
- Feature branches: `feature/YYYYMMDD-description`
- Hotfix branches: `hotfix/YYYYMMDD-issue-description`
- Release branches: `release/vX.Y.Z`
- Configuration branches: `config/YYYYMMDD-service-name`

## Workflow Rules

### Feature Development
1. Create from: `develop`
2. Merge back into: `develop`
3. Naming: `feature/20250214-aws-ses-integration`

### Hotfix Process
1. Create from: `main`
2. Merge back into: `main` and `develop`
3. Naming: `hotfix/20250214-smtp-config-fix`

### Release Process
1. Create from: `develop`
2. Merge back into: `main` and `develop`
3. Naming: `release/v1.0.0`

### Configuration Updates
1. Create from: `develop`
2. Merge back into: `develop`
3. Naming: `config/20250214-storage-service`

## Commit Message Format
```
[Type] Brief description

- Detailed bullet points of changes
- Additional context or related changes

Type can be:
- Feature: New functionality
- Fix: Bug fixes
- Config: Configuration changes
- Docs: Documentation updates
- Test: Test-related changes
```

## Example Commit Messages
```
[Feature] Implement AWS SES integration

- Add SMTP configuration for email service
- Update auth service environment variables
- Add email templates for authentication

[Config] Update storage service settings

- Configure S3 bucket permissions
- Add backup retention policies
- Update volume mount points
```

## Branch Protection Rules
1. `main` branch:
   - Requires pull request reviews
   - Must be up to date before merging
   - No direct pushes

2. `develop` branch:
   - Requires pull request reviews
   - Must be up to date before merging

## Tagging Strategy
- Release tags: `v1.0.0`, `v1.1.0`, etc.
- Format: `vMAJOR.MINOR.PATCH`
- Tag after merging to main branch

## Session Management Integration
- Each development session should create a new feature branch
- Branch names should include session date: `feature/20250214-session-1`
- Reference TaskProgress.log entries in commit messages

## Backup and Recovery
- Regular pushes to remote repository
- Maintain local backup of configuration files
- Document any manual interventions in TaskProgress.log
