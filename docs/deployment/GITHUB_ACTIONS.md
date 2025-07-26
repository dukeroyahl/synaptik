# GitHub Actions CI/CD Guide

This guide explains how to set up automated Docker Hub publishing using GitHub Actions for the Synaptik project.

## Overview

The GitHub Actions workflows provide:

1. **Continuous Integration** (`ci.yml`): Tests, builds, and validates all components
2. **Docker Publishing** (`docker-publish.yml`): Builds and publishes Docker images to Docker Hub
3. **Automated Releases**: Creates GitHub releases with deployment instructions

## Setup Instructions

### 1. Configure Docker Hub Secrets

Add these secrets to your GitHub repository:

**Settings → Secrets and variables → Actions → New repository secret**

| Secret Name | Description | Value |
|-------------|-------------|--------|
| `DOCKERHUB_TOKEN` | Docker Hub access token | Your Docker Hub token |

**To create a Docker Hub token:**
1. Go to [Docker Hub → Account Settings → Security](https://hub.docker.com/settings/security)
2. Click "New Access Token"
3. Name: `github-actions-synaptik`
4. Permissions: `Read, Write, Delete`
5. Copy the generated token

### 2. Update Repository Settings

The workflow uses `github.repository_owner` as the Docker Hub username. If you want a different username:

```yaml
# In .github/workflows/docker-publish.yml, change line 20:
DOCKERHUB_USERNAME: your-dockerhub-username
```

### 3. Enable GitHub Actions

GitHub Actions should be enabled by default. Verify in:
**Settings → Actions → General → Actions permissions**

## Workflow Triggers

### CI Pipeline (`ci.yml`)
Runs on:
- Push to `main` or `develop` branches
- Pull requests to `main`

**Jobs:**
- Backend tests (Java/Quarkus + MongoDB)
- Frontend tests (React/TypeScript)
- MCP server tests (Node.js)
- Docker build validation
- Integration tests
- Security scanning

### Docker Publishing (`docker-publish.yml`)
Runs on:
- Push to `main` or `develop` branches
- Tags starting with `v*` (releases)
- Manual workflow dispatch

**Jobs:**
- Build and push multi-arch Docker images (amd64, arm64)
- Update docker-compose.hub.yml automatically
- Create GitHub releases for tags

## Publishing Workflows

### 1. Development Builds

Push to `main` or `develop`:
```bash
git push origin main
```

**Result:** Images tagged with branch name:
- `yourusername/synaptik-server:main`
- `yourusername/synaptik-client:main`
- `yourusername/synaptik-mcp-server:main`

### 2. Release Builds

Create and push a tag:
```bash
git tag v1.0.0
git push origin v1.0.0
```

**Result:** 
- Images with version tags: `v1.0.0`, `1.0`, `1`, `latest`
- Automatic GitHub release creation
- Updated docker-compose.hub.yml

### 3. Manual Builds

Use GitHub web interface:
1. Go to **Actions → Build and Push Docker Images**
2. Click **Run workflow**
3. Choose branch and optional custom tag

## Monitoring Builds

### View Workflow Status

- **Repository homepage**: Status badges show build status
- **Actions tab**: Detailed logs and history
- **Pull requests**: Status checks show CI results

### Build Artifacts

Each successful build creates:
- Docker images on Docker Hub
- Build logs and test reports
- Security scan results

## Multi-Architecture Support

Images are built for:
- `linux/amd64` (Intel/AMD x64)
- `linux/arm64` (Apple Silicon, ARM servers)

This ensures compatibility across different platforms.

## Troubleshooting

### Common Issues

#### Docker Hub Authentication Fails
```
Error: buildx failed with: error: failed to solve: unauthorized
```

**Solution:**
1. Verify `DOCKERHUB_TOKEN` secret is set correctly
2. Check token permissions include "Write"
3. Ensure token hasn't expired

#### Build Fails - Out of Memory
```
Error: Process completed with exit code 137
```

**Solution:** Large Gradle/Node.js builds may need more memory:
```yaml
- name: Build with more memory
  run: ./gradlew build -Xmx4g
```

#### Tests Fail in CI
```
Error: Connection refused (MongoDB/API tests)
```

**Solution:** Service dependencies may need more startup time:
```yaml
- name: Wait for services
  run: sleep 30
```

### Debugging Workflows

#### Enable Debug Logging
Add repository secret:
- `ACTIONS_STEP_DEBUG`: `true`

#### Access Build Logs
1. Go to **Actions** tab
2. Click on failed workflow
3. Expand failed job steps
4. Check "Set up job" for environment details

## Advanced Configuration

### Custom Docker Tags

Modify `.github/workflows/docker-publish.yml`:
```yaml
tags: |
  type=ref,event=branch
  type=ref,event=pr
  type=semver,pattern={{version}}
  type=raw,value=stable,enable={{is_default_branch}}
  type=raw,value=nightly,enable=${{ github.event_name == 'schedule' }}
```

### Conditional Publishing

Skip publishing on certain conditions:
```yaml
- name: Build and push Docker image
  if: github.actor != 'dependabot[bot]'
  uses: docker/build-push-action@v5
```

### Notifications

Add Slack/Discord notifications:
```yaml
- name: Notify on failure
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: failure
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

## Security Best Practices

1. **Secrets Management**: Never commit tokens to repository
2. **Minimal Permissions**: Use least-privilege access tokens
3. **Dependency Scanning**: Trivy scanner checks for vulnerabilities
4. **Image Signing**: Consider adding Cosign for image signatures
5. **Branch Protection**: Require status checks before merging

## Integration with Deployment

### Automated Deployment

For automatic deployment after successful builds:
```yaml
deploy:
  needs: build-and-push
  runs-on: ubuntu-latest
  if: github.ref == 'refs/heads/main'
  steps:
    - name: Deploy to staging
      run: |
        # Your deployment script
        ssh user@server 'docker-compose pull && docker-compose up -d'
```

### Rollback Strategy

Keep previous image versions for quick rollbacks:
```bash
# Rollback to previous version
docker-compose -f config/docker-compose.hub.yml down
sed -i 's/:latest/:v1.0.0/g' config/docker-compose.hub.yml
docker-compose -f config/docker-compose.hub.yml up -d
```

## Monitoring and Metrics

Track deployment metrics:
- Build success/failure rates
- Build duration trends
- Docker image sizes
- Deployment frequency

Use GitHub's built-in insights or integrate with monitoring tools like DataDog, New Relic, or Prometheus.