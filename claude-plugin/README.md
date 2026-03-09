# Zyket Claude Code Plugin

A comprehensive set of skills for Claude Code to help developers build Zyket applications with best practices and architectural patterns.

Use this plugin to build backend and frontend features related to Zyket.

- [Installation with Claude Code](#installation-with-claude-code)
  - [Prerequisites](#prerequisites)
  - [Install Plugin](#install-plugin)
- [Installation for Other AI Agents](#installation-for-other-ai-agents)
- [Use Plugin](#use-plugin)
  - [Example Use Cases](#example-use-cases)
- [Skills Included](#skills-included)
- [Commands Included](#commands-included)
- [Privacy](#privacy)

## Installation with Claude Code

### Prerequisites

- [Claude Code](https://github.com/anthropics/claude-code) installed
- A Zyket project (or planning to create one)

### Install Plugin

1. Start Claude:

```bash
claude
```

2. Add Zyket marketplace to Claude Code:

```bash
/plugin marketplace add pemakz/zyket
```

3. Install the plugin:

```bash
/plugin install 
```

4. Verify the plugin is loaded:

```bash
/plugin
```

You should see the Zyket plugin listed under the Installed tab.

## Use Plugin

In your Zyket application, ask Claude to build features. Claude will know what to load from the Zyket plugin to build your feature.