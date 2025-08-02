# 📚 Documentation & Wiki Strategy

## Repository Structure

Synaptik uses a **dual-repository documentation approach**:

### 🏠 Main Repository (`Synaptik/`)
**Purpose**: Essential technical documentation that belongs with the codebase

**Contains**:
- `README.md` - Application overview, installation, quick start
- `docs/BRANCHING_STRATEGY.md` - Development workflow and versioning  
- `docs/images/` - Screenshots and visual assets
- `CONTRIBUTING.md` - Contribution guidelines

### 📖 Wiki Repository (`synaptik.wiki`)
**Purpose**: Comprehensive user and developer documentation

**Contains**:
- **User Guides** - Complete tutorials, how-tos, troubleshooting
- **Developer Documentation** - API reference, architecture docs, deployment guides
- **FAQ & Support** - Common questions and community resources

## Documentation Principles

### ✅ What Goes in Main Repository
- Technical docs that change with code (branching strategy, contributing)
- Visual assets needed for README (screenshots, logos)
- Brief setup and quick start information

### ✅ What Goes in Wiki Repository  
- Comprehensive user documentation
- Detailed developer guides
- API documentation and examples
- Troubleshooting and FAQ sections
- Community guidelines and resources

### 🔗 Linking Strategy
- **Main README** links to appropriate wiki sections
- **Wiki pages** can reference technical docs in main repo
- **Keep it simple** - avoid deep nesting of documentation links

## Migration Notes

When moving from scattered local docs to wiki:
1. **Audit existing content** in `/docs` folders
2. **Categorize by audience** (user vs developer)
3. **Consolidate similar content** to avoid duplication
4. **Update all cross-references** and links
5. **Archive outdated documentation**

## Best Practices

- **Single Source of Truth**: Each piece of information should live in one place
- **Clear Navigation**: Wiki should have intuitive structure and navigation
- **Regular Updates**: Keep wiki synchronized with feature releases
- **Visual Documentation**: Use screenshots and diagrams where helpful
- **Search-Friendly**: Structure content for easy discovery

This approach ensures documentation stays organized, discoverable, and maintainable as the project grows! 🚀