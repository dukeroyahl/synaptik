# 🤝 Contributing to Synaptik

Thank you for considering contributing to Synaptik! We welcome contributions from everyone, whether you're a seasoned developer or just getting started.

## 📋 Table of Contents
- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)

## 📜 Code of Conduct

This project adheres to a Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

### Our Standards
- **Be Respectful**: Treat everyone with respect and kindness
- **Be Inclusive**: Welcome people of all backgrounds and experience levels
- **Be Collaborative**: Work together towards common goals
- **Be Constructive**: Provide helpful feedback and suggestions

## 🚀 Getting Started

### Prerequisites
- **Java 21+** for backend development
- **Node.js 18+** for frontend and MCP server
- **Docker** for database and full-stack deployment
- **Git** for version control

### Quick Setup
```bash
# Clone the repository
git clone https://github.com/your-username/synaptik.git
cd synaptik

# Run initial setup
./scripts/synaptik.sh setup

# Start development environment
./scripts/synaptik.sh dev
```

## 🛠️ Development Setup

### Architecture Overview
```
synaptik/
├── client/          # React 18 + TypeScript frontend
├── server/          # Java 21 + Quarkus backend  
├── mcp-server/      # Node.js MCP server for AI integration
├── docs/            # Documentation
├── scripts/         # Development and deployment scripts
└── config/          # Configuration files
```

### Development Workflow
1. **MongoDB**: Runs in Docker (`./scripts/synaptik.sh docker:up`)
2. **Backend**: Java/Quarkus with hot reload (`npm run server:dev`)
3. **Frontend**: React with Vite dev server (`npm run client:dev`)
4. **MCP Server**: Node.js TypeScript (`npm run mcp:dev`)

### Environment Setup
```bash
# Copy environment templates
cp client/.env.example client/.env.local
cp server/.env.example server/.env

# Start MongoDB
npm run docker:up

# Install dependencies
npm run install:all

# Start development
npm run dev
```

## 🤝 How to Contribute

### 🐛 Reporting Bugs
1. **Check existing issues** to avoid duplicates
2. **Use the bug report template** when creating issues
3. **Provide detailed information**:
   - Environment details (OS, Java version, Node version)
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots or logs if applicable

### 💡 Suggesting Features
1. **Check existing feature requests** to avoid duplicates
2. **Use the feature request template**
3. **Provide context**:
   - Use case and problem it solves
   - Proposed solution
   - Alternative solutions considered
   - Implementation suggestions

### 🔧 Code Contributions
1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** following our coding standards
4. **Add tests** for new functionality
5. **Update documentation** as needed
6. **Commit your changes**: `git commit -m 'Add amazing feature'`
7. **Push to your fork**: `git push origin feature/amazing-feature`
8. **Open a Pull Request**

## 📝 Pull Request Process

### Before Submitting
- [ ] **Run tests**: Ensure all tests pass
- [ ] **Run linting**: Code follows style guidelines
- [ ] **Update documentation**: README, API docs, etc.
- [ ] **Test manually**: Verify changes work as expected
- [ ] **Check breaking changes**: Note any breaking changes

### PR Guidelines
1. **Clear title and description**
2. **Reference related issues**: Use `Fixes #123` or `Closes #123`
3. **Provide context**: Explain what and why
4. **Include screenshots**: For UI changes
5. **Small, focused changes**: One feature/fix per PR

### Review Process
1. **Automated checks**: CI/CD pipeline must pass
2. **Code review**: At least one maintainer review
3. **Testing**: Manual testing in development environment
4. **Documentation**: Ensure docs are updated
5. **Merge**: Squash and merge after approval

## 🎨 Coding Standards

### General Principles
- **Clean Code**: Write readable, maintainable code
- **SOLID Principles**: Follow object-oriented design principles
- **DRY**: Don't Repeat Yourself
- **KISS**: Keep It Simple, Stupid
- **Documentation**: Comment complex logic

### Java/Quarkus Backend
```java
// Use proper naming conventions
public class TaskService {
    
    // Document complex methods
    /**
     * Calculates task urgency based on TaskWarrior algorithm
     * @param task The task to calculate urgency for
     * @return Urgency score between 0.0 and 100.0
     */
    public double calculateUrgency(Task task) {
        // Implementation
    }
}
```

### React/TypeScript Frontend
```typescript
// Use proper TypeScript types
interface TaskProps {
  task: Task;
  onUpdate: (task: Task) => void;
}

// Document complex components
/**
 * TaskCard displays a single task with actions
 * Supports TaskWarrior-style quick actions
 */
export const TaskCard: React.FC<TaskProps> = ({ task, onUpdate }) => {
  // Implementation
};
```

### Code Style
- **Java**: Google Java Style Guide
- **TypeScript/React**: ESLint + Prettier configuration
- **Commit Messages**: Conventional Commits format

## 🧪 Testing

### Backend Testing
```bash
# Run Java tests
cd server && ./gradlew test

# Run specific test class
cd server && ./gradlew test --tests TaskServiceTest

# Generate test coverage
cd server && ./gradlew jacocoTestReport
```

### Frontend Testing
```bash
# Run React tests
cd client && npm test

# Run tests with coverage
cd client && npm run test:coverage

# Run E2E tests
cd client && npm run test:e2e
```

### Integration Testing
```bash
# Start full environment
npm run docker:full:build

# Run integration tests
npm run test:integration
```

## 📚 Documentation

### Types of Documentation
1. **Code Comments**: Explain complex logic
2. **API Documentation**: OpenAPI/Swagger specs
3. **User Guides**: How to use features
4. **Developer Docs**: Architecture and setup
5. **Deployment Guides**: Production deployment

### Documentation Standards
- **Clear and Concise**: Easy to understand
- **Up to Date**: Keep in sync with code changes
- **Examples**: Provide code examples
- **Screenshots**: For UI features
- **Links**: Cross-reference related topics

### Updating Documentation
- **API Changes**: Update OpenAPI specs
- **New Features**: Add user guide sections
- **Breaking Changes**: Update migration guides
- **Setup Changes**: Update CONTRIBUTING.md

## 🏷️ Issue Labels

### Priority
- `priority:critical` - Security issues, data loss
- `priority:high` - Important features, major bugs
- `priority:medium` - Standard features, minor bugs
- `priority:low` - Nice-to-have features, cosmetic issues

### Type
- `type:bug` - Something isn't working
- `type:feature` - New functionality
- `type:enhancement` - Improve existing functionality
- `type:documentation` - Documentation updates
- `type:refactor` - Code improvement without new features

### Component
- `component:frontend` - React/TypeScript frontend
- `component:backend` - Java/Quarkus backend
- `component:mcp` - AI integration server
- `component:database` - MongoDB related
- `component:deployment` - Docker, CI/CD

## 🎯 Development Focus Areas

### High Priority
- **Performance Optimization**: Database queries, UI responsiveness
- **AI Integration**: Enhanced MCP capabilities
- **Mobile Support**: Responsive design improvements
- **Testing Coverage**: Increase test coverage

### Medium Priority
- **Accessibility**: WCAG compliance
- **Internationalization**: Multi-language support
- **Real-time Features**: WebSocket integration
- **Advanced Analytics**: Usage insights

### Lower Priority
- **Third-party Integrations**: Slack, Discord, etc.
- **Themes**: Additional UI themes
- **Plugins**: Extension system
- **Desktop App**: Electron wrapper

## 🆘 Getting Help

### Community Support
- **GitHub Discussions**: Q&A and general discussion
- **GitHub Issues**: Bug reports and feature requests
- **Documentation**: Check docs/ directory first

### Maintainer Contact
- **General Questions**: Use GitHub Discussions
- **Security Issues**: Email maintainers directly
- **Urgent Issues**: Tag maintainers in issues

## 🙏 Recognition

### Contributors
We recognize all contributors in:
- **README.md**: Contributors section
- **CHANGELOG.md**: Release notes
- **GitHub**: Contributor insights

### Types of Contributions
- **Code**: Features, bug fixes, refactoring
- **Documentation**: Guides, API docs, examples
- **Testing**: Test cases, QA, bug reports
- **Design**: UI/UX improvements, mockups
- **Community**: Support, discussions, evangelism

---

**Thank you for contributing to Synaptik! 🧠✨**

Together, we're building something amazing that connects ideas and enhances productivity through intelligent task management.