# Dundra CI/CD Pipeline

This document describes the continuous integration and deployment pipeline for the Dundra D&D companion application.

## Overview

The CI/CD pipeline is built using GitHub Actions and consists of multiple workflows that handle different aspects of the development lifecycle:

- **CI Pipeline** (`ci.yml`) - Automated testing, linting, and building
- **Deployment** (`deploy.yml`) - Staging and production deployments
- **Security Analysis** (`codeql.yml`) - Automated security scanning
- **Dependency Management** (`dependabot.yml`) - Automated dependency updates

## Workflows

### 1. CI Pipeline (`ci.yml`)

**Triggers:**

- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**Features:**

- **Smart Change Detection**: Only runs jobs for changed components (backend, frontend, or shared)
- **Parallel Execution**: Backend and frontend jobs run in parallel for faster feedback
- **Comprehensive Testing**: Unit tests, linting, type checking, and building
- **Security Auditing**: Automated dependency vulnerability scanning
- **Code Formatting**: Prettier format checking
- **Caching**: NPM dependencies and build artifacts are cached for performance

**Jobs:**

- `changes` - Detects which parts of the codebase have changed
- `backend-lint` - ESLint checking for backend code
- `backend-test` - Jest unit tests for backend
- `backend-build` - TypeScript compilation and build verification
- `frontend-lint` - ESLint checking for frontend code
- `frontend-test` - Jest unit tests for frontend with React Testing Library
- `frontend-build` - Vite build process for production
- `security-audit` - NPM audit for security vulnerabilities
- `format-check` - Prettier formatting verification
- `ci-success` - Summary job that ensures all checks pass

### 2. Deployment Pipeline (`deploy.yml`)

**Triggers:**

- Successful completion of CI pipeline on `main` or `develop` branches

**Features:**

- **Environment-Based Deployment**: Separate staging and production environments
- **Build Artifact Reuse**: Uses cached builds from CI pipeline
- **Health Checks**: Automated health checking after deployment
- **Rollback Capability**: Manual rollback workflow for production
- **Notifications**: Slack notifications for deployment status

**Environments:**

- **Staging** (`develop` branch) - `https://staging.dundra.app`
- **Production** (`main` branch) - `https://dundra.app`

### 3. Security Analysis (`codeql.yml`)

**Triggers:**

- Push to `main` or `develop` branches
- Pull requests to `main` branch
- Weekly scheduled runs (Sundays at 6:00 AM UTC)

**Features:**

- **CodeQL Analysis**: GitHub's semantic code analysis
- **Multi-Language Support**: JavaScript and TypeScript analysis
- **Automated Security Alerts**: Integration with GitHub Security tab

### 4. Dependency Management (`dependabot.yml`)

**Features:**

- **Automated Updates**: Weekly dependency update PRs
- **Multi-Package Support**: Root, backend, frontend, and GitHub Actions
- **Organized PRs**: Proper commit message prefixes and reviewers
- **Controlled Updates**: Limited number of open PRs to prevent spam

## Branch Strategy

```
main (production)
├── develop (staging)
├── feature/feature-name
└── hotfix/hotfix-name
```

- **`main`**: Production-ready code, triggers production deployment
- **`develop`**: Integration branch, triggers staging deployment
- **`feature/*`**: Feature branches, trigger CI pipeline
- **`hotfix/*`**: Hotfix branches, trigger CI pipeline

## Environment Variables & Secrets

### Required GitHub Secrets

```bash
# Deployment
SLACK_WEBHOOK_URL          # Slack notifications
CODECOV_TOKEN             # Code coverage reporting

# Production Environment
PROD_DATABASE_URL         # Production MongoDB connection
PROD_JWT_SECRET          # Production JWT signing secret
PROD_API_URL             # Production API URL

# Staging Environment
STAGING_DATABASE_URL     # Staging MongoDB connection
STAGING_JWT_SECRET       # Staging JWT signing secret
STAGING_API_URL          # Staging API URL
```

### Environment Configuration

Environments are configured in GitHub repository settings:

1. **Staging Environment**

   - URL: `https://staging.dundra.app`
   - Auto-deploy from `develop` branch
   - No protection rules

2. **Production Environment**
   - URL: `https://dundra.app`
   - Auto-deploy from `main` branch
   - Protection rules: Require reviews, restrict to main branch

## Deployment Process

### Staging Deployment

1. Push changes to `develop` branch
2. CI pipeline runs and validates changes
3. If CI passes, deployment workflow triggers automatically
4. Backend and frontend deploy to staging environment
5. Health checks verify deployment success
6. Slack notification sent with deployment status

### Production Deployment

1. Merge `develop` into `main` branch (via pull request)
2. CI pipeline runs on `main` branch
3. If CI passes, production deployment triggers automatically
4. Production backup is created
5. Backend and frontend deploy to production environment
6. Comprehensive health checks and smoke tests run
7. Slack notification sent with deployment status

### Rollback Process

If a production deployment fails or issues are detected:

1. Navigate to GitHub Actions
2. Manually trigger the "Rollback Production" workflow
3. Previous version is restored
4. Health checks verify rollback success
5. Team is notified via Slack

## Performance Optimizations

- **Dependency Caching**: NPM dependencies cached across workflow runs
- **Build Artifact Caching**: Build outputs cached and reused in deployment
- **Parallel Job Execution**: Backend and frontend jobs run simultaneously
- **Change Detection**: Only affected components are tested and built
- **Smart Triggers**: Workflows only run when relevant files change

## Monitoring & Observability

- **GitHub Actions Dashboard**: Real-time pipeline status
- **Slack Notifications**: Deployment status and failure alerts
- **CodeQL Security**: Automated security vulnerability detection
- **Dependabot**: Automated dependency update tracking
- **Code Coverage**: Codecov integration for test coverage reporting

## Local Development

To test the CI pipeline locally:

```bash
# Run all checks that CI runs
npm run lint          # Lint all code
npm run format:check  # Check formatting
npm test             # Run all tests
npm run type-check   # TypeScript type checking

# Backend specific
cd backend
npm run lint
npm test
npm run build
npm run type-check

# Frontend specific
cd frontend
npm run lint
npm test
npm run build
npm run type-check
```

## Troubleshooting

### Common Issues

1. **Build Failures**

   - Check TypeScript errors: `npm run type-check`
   - Verify dependencies: `npm ci`

2. **Test Failures**

   - Run tests locally: `npm test`
   - Check test coverage: `npm run test:coverage`

3. **Deployment Issues**

   - Verify environment secrets are set
   - Check deployment logs in GitHub Actions
   - Verify health check endpoints

4. **Security Alerts**
   - Review CodeQL results in Security tab
   - Update vulnerable dependencies via Dependabot PRs

### Getting Help

- Check GitHub Actions logs for detailed error messages
- Review this documentation for configuration details
- Contact the development team for deployment issues

## Future Improvements

- [ ] End-to-end testing integration
- [ ] Performance testing in CI
- [ ] Blue-green deployment strategy
- [ ] Automated database migrations
- [ ] Container-based deployments
- [ ] Multi-region deployment support
- [ ] Advanced monitoring and alerting
