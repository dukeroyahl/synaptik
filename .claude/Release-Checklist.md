# 🚀 Synaptik Release Checklist

This checklist ensures consistent, reliable releases for the Synaptik project. Follow this process for all version releases.

## 📋 Pre-Release Preparation

### 🔍 **Version Planning**
- [ ] Determine semantic version number (MAJOR.MINOR.PATCH)
- [ ] Review commit history since last release
- [ ] Identify breaking changes, new features, and bug fixes
- [ ] Plan release timeline and communication

### 🌿 **Create Release Branch**
- [ ] Create release branch: `git checkout -b release/x.x.x`
- [ ] Push branch to remote: `git push origin release/x.x.x`

## 🔧 Version Updates

### 📝 **Update All Version References**
- [ ] `server/build.gradle` - Update `version 'x.x.x'`
- [ ] `mcp/build.gradle` - Update `version 'x.x.x'`
- [ ] `package.json` - Update `"version": "x.x.x"`
- [ ] `client/package.json` - Update `"version": "x.x.x"`
- [ ] `README.md` - Update any version-specific references
- [ ] `CHANGELOG.md` - Update future version references

### ✅ **Verify Version Consistency**
```bash
# Run this command to verify all versions match
grep -r "x\.x\.x" --include="*.gradle" --include="*.json" . | grep version
```

## 🛠️ Technical Updates

### 🔧 **Dependency & Configuration Updates**
- [ ] Check for deprecated parameters in workflows
- [ ] Update Gradle action parameters if needed
- [ ] Verify Docker configurations are current
- [ ] Check for security vulnerabilities in dependencies

### 🧪 **Workflow Validation**
- [ ] Verify CI/CD workflow syntax
- [ ] Check all workflow jobs have required steps
- [ ] Ensure error handling is robust
- [ ] Validate release automation logic

## 📚 Documentation Updates

### 📖 **README.md Updates**
- [ ] Update version badges and references
- [ ] Verify installation instructions are current
- [ ] Update port references (ensure consistency)
- [ ] Check native binary availability status
- [ ] Update direct download links for badges
- [ ] Verify Claude Desktop integration instructions

### 📋 **CHANGELOG.md Updates**
- [ ] Add new version entry with date
- [ ] Categorize changes:
  - 🎯 **New Features** (feat: commits)
  - 🐛 **Bug Fixes** (fix: commits)
  - 🏗️ **Improvements** (improvement/enhance commits)
  - 🔧 **Technical Changes** (chore/refactor commits)
  - 📦 **Version Updates** (version bumps)
  - 📋 **Notes** (important information)
- [ ] Include technical details for developers
- [ ] Update any "coming soon" references to "available"

### 🤖 **Claude Prompt Updates**
- [ ] Update `.claude/CLaude-Prompt.md` with new patterns
- [ ] Document any new troubleshooting solutions
- [ ] Add new workflow improvements to knowledge base
- [ ] Update version management procedures

## 🧪 Testing & Validation

### 🔍 **Pre-Release Testing**
- [ ] Build and test all components locally
- [ ] Verify Docker containers build successfully
- [ ] Test MCP server compilation (both JVM and native)
- [ ] Validate API endpoints are functional
- [ ] Test Claude Desktop integration

### 🚀 **Workflow Testing**
- [ ] Test CI workflow on release branch
- [ ] Verify all jobs pass successfully
- [ ] Check artifact generation
- [ ] Validate security scans pass

## 📦 Release Execution

### 🔀 **Merge Process**
- [ ] Create Pull Request: `release/x.x.x` → `main`
- [ ] Add comprehensive PR description
- [ ] Request review from team members
- [ ] Ensure all CI checks pass
- [ ] Merge PR to main branch

### 🏷️ **Tag Creation**
- [ ] Switch to main branch: `git checkout main`
- [ ] Pull latest changes: `git pull origin main`
- [ ] Create annotated tag: `git tag -a vx.x.x -m "Release vx.x.x"`
- [ ] Push tag: `git push origin vx.x.x`

### ⚡ **Release Automation**
- [ ] Monitor CD workflow execution
- [ ] Verify all jobs complete successfully:
  - [ ] validate-tag
  - [ ] cleanup-deleted-tag
  - [ ] generate-release-notes
  - [ ] create-release
  - [ ] build-docker-images
  - [ ] build-native-binaries
- [ ] Check GitHub release is created
- [ ] Verify release notes are comprehensive
- [ ] Confirm all artifacts are attached

## 🔍 Post-Release Validation

### 📦 **Artifact Verification**
- [ ] Docker images published to registries:
  - [ ] GitHub Container Registry (ghcr.io)
  - [ ] Docker Hub
- [ ] Native binaries available for download:
  - [ ] macOS ARM64
  - [ ] Linux x86_64
  - [ ] Linux ARM64
- [ ] Release notes are complete and accurate

### 🧪 **Functional Testing**
- [ ] Test Docker installation: `curl -sSL https://raw.githubusercontent.com/dukeroyahl/synaptik/main/install.sh | bash`
- [ ] Verify web interface loads: `http://localhost:4000`
- [ ] Test API endpoints: `http://localhost:8060/health`
- [ ] Download and test native MCP binary
- [ ] Verify Claude Desktop integration works

### 📢 **Communication**
- [ ] Update project documentation
- [ ] Notify team of successful release
- [ ] Update any external references
- [ ] Consider social media/community announcements

## 🛠️ Troubleshooting Guide

### 🚨 **Common Issues & Solutions**

#### **Workflow Failures**
- **Tag Recreation Issues**: Use safe recreation process (delete-wait-push)
- **Heredoc Syntax Errors**: Use unique terminators (e.g., `RELEASE_NOTES_END`)
- **Missing Checkout**: Ensure `actions/checkout@v4` in all jobs needing repo access
- **Gradle Deprecation**: Use `cache-cleanup` instead of `gradle-home-cache-cleanup`

#### **Release Creation Failures**
- **Existing Release Conflict**: Workflow handles automatic cleanup
- **Large Release Notes**: Uses file-based input to avoid command line limits
- **Special Characters**: File-based approach handles complex content

#### **Binary Compilation Issues**
- **Native Compilation**: Ensure GraalVM configuration is correct
- **Platform Support**: Verify matrix builds for all target platforms
- **Size Optimization**: Check native image settings

### 🔄 **Recovery Procedures**

#### **Failed Release**
1. Identify failure point in workflow logs
2. Fix underlying issue in release branch
3. Delete failed tag: `git push origin :refs/tags/vx.x.x`
4. Wait 10 seconds for workflow cleanup
5. Recreate tag: `git tag -f vx.x.x && git push origin vx.x.x`

#### **Partial Release**
1. Check which artifacts were created successfully
2. Manually trigger missing jobs if possible
3. Consider creating patch release if critical issues found

## 📊 Release Metrics

### 📈 **Success Criteria**
- [ ] All workflow jobs complete successfully
- [ ] Docker images available in both registries
- [ ] Native binaries downloadable for all platforms
- [ ] Installation script works without errors
- [ ] Documentation is accurate and up-to-date
- [ ] No critical bugs reported within 24 hours

### 📋 **Post-Release Review**
- [ ] Document any issues encountered
- [ ] Update this checklist with lessons learned
- [ ] Review workflow performance and optimization opportunities
- [ ] Plan improvements for next release cycle

---

## 🎯 Quick Reference Commands

### **Version Update Script**
```bash
# Replace OLD_VERSION and NEW_VERSION with actual versions
OLD_VERSION="0.0.3"
NEW_VERSION="0.0.4"

# Update all version files
sed -i "s/version '$OLD_VERSION'/version '$NEW_VERSION'/g" server/build.gradle mcp/build.gradle
sed -i "s/\"version\": \"$OLD_VERSION\"/\"version\": \"$NEW_VERSION\"/g" package.json client/package.json
```

### **Safe Tag Recreation**
```bash
# Safe tag recreation to prevent workflow conflicts
TAG_NAME="v0.0.4"
git push origin :refs/tags/$TAG_NAME  # Delete remote
sleep 10                              # Wait for workflows
git tag -f $TAG_NAME                  # Recreate local
git push origin $TAG_NAME             # Push new tag
```

### **Release Validation**
```bash
# Verify version consistency
grep -r "0\.0\.4" --include="*.gradle" --include="*.json" . | grep version

# Check for deprecated parameters
grep -r "gradle-home-cache-cleanup" . --exclude-dir=.git --exclude-dir=node_modules

# Validate port references
grep -n "8060" README.md
```

---

**📝 Note**: This checklist should be updated after each release to incorporate lessons learned and process improvements. Keep it as a living document that evolves with the project.

**🔄 Last Updated**: v0.0.4 Release (August 2025)
