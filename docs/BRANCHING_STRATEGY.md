# 🌿 Branching & Versioning Strategy

## Branch-Based Semantic Versioning

Synaptik uses an automated semantic versioning system that determines the version increment based on the source branch name when merging to `main`.

### 🔢 Version Increment Rules

| Branch Pattern | Version Type | Increment | Example |
|---------------|--------------|-----------|---------|
| `feature/*` or `feat/*` | **MAJOR** | `1.0.0` → `2.0.0` | New features, breaking changes |
| `fix/*`, `bugfix/*`, `hotfix/*` | **MINOR** | `1.0.0` → `1.1.0` | Bug fixes, non-breaking changes |
| All other branches | **PATCH** | `1.0.0` → `1.0.1` | Documentation, chores, small tweaks |

### 📋 Branch Naming Examples

**Feature Branches (MAJOR version bump):**
- `feature/new-dashboard`
- `feat/ai-integration`
- `feature/calendar-redesign`

**Fix Branches (MINOR version bump):**
- `fix/calendar-bug`
- `bugfix/memory-leak`
- `hotfix/security-patch`

**Other Branches (PATCH version bump):**
- `docs/update-readme`
- `chore/cleanup-deps`
- `ci/improve-tests`
- `refactor/code-cleanup`

### 🚀 Automated Process

When you merge a pull request to `main`:

1. **Branch Detection**: CI detects the source branch from the merge commit
2. **Version Calculation**: Determines increment type based on branch prefix
3. **Version Update**: Updates `package.json` and `client/src/config.ts`
4. **Git Tagging**: Creates and pushes a new version tag (e.g., `v2.1.3`)
5. **Docker Publishing**: Builds and publishes all components to DockerHub
6. **GitHub Release**: Creates a release with auto-generated notes

### 💡 Best Practices

- **Use descriptive branch names** that clearly indicate the type of work
- **Feature branches** should introduce new functionality or breaking changes
- **Fix branches** should address bugs without breaking existing functionality  
- **Keep branch names concise** but meaningful
- **Use consistent prefixes** to ensure proper version detection

### 🎯 Example Workflow

```bash
# Create a feature branch
git checkout -b feature/task-dependencies
git commit -m "Add task dependency system"
git push origin feature/task-dependencies

# Create PR and merge to main
# → Triggers MAJOR version bump: 1.0.0 → 2.0.0
# → Publishes roudranil/synaptik:*-2.0.0 to DockerHub
# → Creates GitHub release v2.0.0
```

### 🔍 Version Detection Logic

The CI system uses these patterns to detect branch types:

```bash
# Feature detection
if [[ "$BRANCH_NAME" =~ ^feature/.* ]] || [[ "$BRANCH_NAME" =~ ^feat/.* ]]; then
    # MAJOR version increment

# Fix detection  
elif [[ "$BRANCH_NAME" =~ ^fix/.* ]] || [[ "$BRANCH_NAME" =~ ^bugfix/.* ]] || [[ "$BRANCH_NAME" =~ ^hotfix/.* ]]; then
    # MINOR version increment

# Everything else
else
    # PATCH version increment
```

### 📦 Published Artifacts

Each release publishes Docker images with multiple tags:

- `roudranil/synaptik:frontend-latest` (always points to latest)
- `roudranil/synaptik:frontend-2.1.3` (specific version)
- `roudranil/synaptik:frontend-2025.02.08-abc123` (date + commit)

### 🔗 Related Documentation

- [Contributing Guidelines](../CONTRIBUTING.md)
- [Developer Guide](https://github.com/Dukeroyahl/Synaptik/wiki/Developer-Guide)
- [CI/CD Documentation](https://github.com/Dukeroyahl/Synaptik/wiki/CI-CD)

This strategy ensures clear, predictable versioning while maintaining full automation! 🎉