# Claude CTO

Fire-and-forget task execution system for Claude Code SDK with CLI and MCP interfaces.

## Features

- 🚀 **Fire-and-forget execution**: Submit tasks and let them run in the background
- 🔧 **Multiple interfaces**: CLI, MCP, and REST API
- 📦 **Easy installation**: Available on PyPI with modular extras
- 🐳 **Docker support**: Pre-built images for quick deployment
- 🔄 **Task orchestration**: Support for dependencies and task groups
- 💾 **Persistent storage**: SQLModel-based task tracking

## Installation

### Via pip (choose your installation mode)

```bash
# For MCP-only users (lightweight)
pip install claude-cto[mcp]

# For REST API + CLI users (no MCP)
pip install claude-cto[server]

# Everything - full installation
pip install claude-cto[full]
```

### Via Docker

```bash
docker pull yigitkonur35/claude-cto:latest
```

## Quick Start

### CLI Usage

```bash
# Start the server
claude-cto server

# Create a task
claude-cto task create "Analyze this codebase for improvements"

# List tasks
claude-cto task list

# Get task status
claude-cto task status <task-id>
```

### MCP Usage

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "claude-cto": {
      "command": "claude-cto-mcp"
    }
  }
}
```

### REST API Usage

```python
import requests

# Create a task
response = requests.post("http://localhost:8000/tasks", json={
    "task_identifier": "analyze_code",
    "execution_prompt": "Analyze the codebase for improvements",
    "working_directory": "/path/to/project"
})

# Get task status
task_id = response.json()["id"]
status = requests.get(f"http://localhost:8000/tasks/{task_id}")
```

## Configuration

Set your Claude Code SDK API key:

```bash
export CLAUDE_CODE_SDK_API_KEY="your-api-key"
```

## Documentation

- [MCP Documentation](MCP_README.md)
- [API Reference](https://github.com/yigitkonur/claude-cto/wiki/API)
- [Examples](https://github.com/yigitkonur/claude-cto/tree/main/examples)

## License

MIT License - see [LICENSE](LICENSE) for details.

## Author

Yigit Konur - [yigit@thinkbuddy.ai](mailto:yigit@thinkbuddy.ai)

## Links

- [GitHub Repository](https://github.com/yigitkonur/claude-cto)
- [PyPI Package](https://pypi.org/project/claude-cto/)
- [Docker Hub](https://hub.docker.com/r/yigitkonur35/claude-cto)
- [Smithery](https://smithery.ai/@yigitkonur/claude-cto)