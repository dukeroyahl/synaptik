# 🚀 Synaptik Release Notes Template

This template is used by the CD pipeline to generate consistent, readable release notes.

## 📋 **Template Structure**

### **Header**
- Version number with emoji
- Clear "What's New" section

### **Categorized Changes**
Commits are automatically categorized based on their prefixes:

- **🎯 New Features**: `feat:`, `add:`, `implement:`
- **🐛 Bug Fixes**: `fix:`, `resolve:`, `correct:`
- **🏗️ Improvements**: `improve:`, `enhance:`, `update:`, `refactor:`, `optimize:`
- **📝 Other Changes**: Everything else

### **Installation Options**
Four clear options with:
- **Purpose statement**: Who this is for
- **Setup time**: How long it takes
- **Benefits**: What you get
- **Examples**: Real code snippets

### **Resources Section**
Links to documentation and support

---

## 🎯 **Purpose of Installation Options**

The Installation Options section serves to:

1. **🎯 Guide User Choice** - Help users pick the right installation method for their needs and technical level
2. **⏱️ Set Expectations** - Show setup time and complexity upfront  
3. **🔄 Support Different Workflows** - From quick trials to production deployments
4. **📈 Progressive Complexity** - Start simple, offer advanced options for power users

### **Decision Matrix:**
| Your Goal | Recommended Option | Time | Requirements |
|-----------|-------------------|------|-------------|
| Try Synaptik quickly | Quick Install | 2 min | Docker |
| AI task management | Claude Integration | 5 min | Docker + Claude Desktop |
| Development/customization | Docker Images | 5 min | Docker knowledge |
| Production deployment | Native Binaries | 10 min | System admin skills |

---

## ✅ **Benefits of This Template**

### **For Users:**
- **Easy to scan**: Visual hierarchy with emojis and headings
- **Clear choices**: Each option explains who it's for
- **No confusion**: Progressive complexity from simple to advanced
- **Actionable**: Real code examples they can copy-paste

### **For Maintainers:**
- **Consistent format**: Every release looks professional
- **Automated categorization**: Commits are sorted automatically
- **Reduced work**: Template handles formatting
- **Better adoption**: Users can find what they need quickly

---

## 🔧 **How It Works in CD**

1. **Commit Analysis**: Pipeline scans commit messages between releases
2. **Automatic Categorization**: Sorts commits into Features, Fixes, Improvements
3. **Template Application**: Applies this structure to every release
4. **Version Substitution**: Replaces placeholders with actual version numbers
5. **GitHub Release**: Creates clean, professional release notes

---

## 📝 **Commit Message Best Practices**

To get the best categorization, use these prefixes:

### **Features**
- `feat: add Claude Desktop integration`
- `add: native binary support for Linux ARM64`
- `implement: MCP server reflection configuration`

### **Bug Fixes** 
- `fix: resolve Docker connectivity issues`
- `correct: task domain alignment between MCP and backend`
- `resolve: null pointer exceptions in MCP tools`

### **Improvements**
- `improve: enhance logging for better debugging`
- `update: MCP server with comprehensive API tools`
- `refactor: simplify release notes generation`
- `optimize: startup time for native binaries`

### **Other**
- `docs: update installation instructions`
- `chore: bump version to 0.0.4`
- `test: add unit tests for MCP server tools`

---

This template ensures every release has consistent, user-friendly documentation that helps people get started quickly!