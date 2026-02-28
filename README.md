# OrangeHRM MCP Server

MCP server that exposes OrangeHRM APIs to Cursor and other MCP clients. It runs on **stdio** (for Cursor’s “command” MCP type) and calls the OrangeHRM app’s REST API.

## Tools

- **list_employees** – List employees (with pagination and optional name filter). Calls OrangeHRM `GET /api/employees` (API v2).

## Configuration (env)

Run the server with:

- **ORANGEHRM_BASE_URL** – Base URL of the OrangeHRM app (e.g. `https://roster.test-webubuntu83.orangehrmdev.com`). Required.
- **ORANGEHRM_ACCESS_TOKEN** – OAuth2 Bearer token. Required unless client credentials are set.
- **ORANGEHRM_CLIENT_ID** and **ORANGEHRM_CLIENT_SECRET** – Optional. If set and `ORANGEHRM_ACCESS_TOKEN` is not set, the server fetches a token from `POST {baseUrl}/oauth/issueToken` with `grant_type=client_credentials`.

## Build (host machine, Node 24)

```bash
cd weather
npm run build
```

## Run (stdio, for Cursor)

```bash
ORANGEHRM_BASE_URL="https://roster.test-webubuntu83.orangehrmdev.com" \
ORANGEHRM_ACCESS_TOKEN="your-token" \
node build/index.js
```

Or with client credentials:

```bash
ORANGEHRM_BASE_URL="https://roster.test-webubuntu83.orangehrmdev.com" \
ORANGEHRM_CLIENT_ID="mcp_client" \
ORANGEHRM_CLIENT_SECRET="your-secret" \
node build/index.js
```

## Cursor configuration

In `.cursor/mcp.json` (project or user), add a **command**-based server:

```json
{
  "mcpServers": {
    "orangehrm": {
      "command": "node",
      "args": ["/absolute/path/to/roster/weather/build/index.js"],
      "env": {
        "ORANGEHRM_BASE_URL": "https://roster.test-webubuntu83.orangehrmdev.com",
        "ORANGEHRM_ACCESS_TOKEN": "your-bearer-token"
      }
    }
  }
}
```

Use the full path to `weather/build/index.js`. Refresh the token when it expires (e.g. 1 hour).
