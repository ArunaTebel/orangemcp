# OrangeHRM MCP Server

An [MCP](https://modelcontextprotocol.io/) (Model Context Protocol) server that exposes OrangeHRM data and utilities to Cursor and other MCP clients. It runs as an **HTTP server** using the Streamable HTTP transport and calls the OrangeHRM REST API (and local reference data) to power the tools.

## Overview

- **Transport**: Streamable HTTP (POST/GET on `/mcp`). The server listens on a configurable port (default `3000`).
- **Authentication**: OAuth2 client credentials. The server obtains a bearer token from OrangeHRM’s `POST {baseUrl}/oauth/issueToken` and uses it for all API requests.
- **API**: Uses OrangeHRM API v2 (e.g. `GET /api/employees`).

## Tools

| Tool | Description |
|------|-------------|
| **list_employees** | List employees with pagination (`limit`, `offset`), optional name filter, filters (e.g. `joined_date`, `termination`, `supervisor_name_or_id`), and optional `include` for extra data (job title, locations, work experience, etc.). Calls OrangeHRM `GET /api/employees`. |
| **get_employee_filter_schema** | Returns supported employee filter keys and the pattern for filtering by related-entity **name** (location, job title, sub unit, cost centre). Use when mapping user intent to `list_employees` or when the user asks by name (e.g. “employees in New York Office”) so the client can use `include` and filter client-side. |
| **get_employee_include_schema** | Returns supported `include` keys with descriptions and user-prompt hints (e.g. “work experience” → `workExperience`). Use to map user requests for specific data to the `include` array for `list_employees`. |
| **get_leave_rule_reference** | Returns reference leave-rule XML with human-readable descriptions for each element. Use when the user provides leave-rule XML and wants it explained. Optionally pass `user_xml` to get the reference alongside their XML in one response. (No OrangeHRM API call; uses bundled `scripts/sample-leave-rule.xml`.) |

## Prerequisites

- **Node.js** 18+ (ESM, `node:fs`, `fetch`)
- An OrangeHRM instance (local or hosted) with an OAuth2 client with client_credentials grant type enabled
- Client ID and secret for the above OAuth Client.

## Installation

```bash
git clone <repository-url>
cd orangemcp
npm install
```

## Configuration

Environment variables (use a `.env` file or export in the shell):

| Variable | Required | Description |
|----------|----------|-------------|
| **ORANGEHRM_BASE_URL** | Yes | Base URL of the OrangeHRM app (no trailing slash), e.g. `https://your-orangehrm.example.com`. |
| **ORANGEHRM_CLIENT_ID** | Yes | OAuth2 client ID for `client_credentials` grant. |
| **ORANGEHRM_CLIENT_SECRET** | Yes | OAuth2 client secret. |
| **PORT** | No | HTTP port for the MCP server (default: `3000`). |

Copy the example env file and edit:

```bash
cp .env.example .env
# Edit .env with your OrangeHRM base URL and client credentials.
```

## Build

From the project root:

```bash
npm run build
```

This compiles TypeScript from `src/` to `build/` and makes `build/index.js` executable.

## Run

Start the MCP HTTP server:

```bash
npm start
```

Or with explicit env:

```bash
ORANGEHRM_BASE_URL="https://your-orangehrm.example.com" \
ORANGEHRM_CLIENT_ID="your_client_id" \
ORANGEHRM_CLIENT_SECRET="your_client_secret" \
PORT=3000 \
node build/index.js
```

On success you should see:

```text
OrangeHRM MCP API listening on http://127.0.0.1:3000/mcp
```

Keep this process running so Cursor (or another MCP client) can connect.

### Self-signed certificate (development)

If your OrangeHRM instance uses a self-signed or untrusted TLS certificate, the server may fail when calling the API. For **development only**, you can disable TLS certificate verification before starting the server:

```bash
export NODE_TLS_REJECT_UNAUTHORIZED='0'
npm start
```

**Warning:** Do not use this in production; it disables certificate validation and is insecure.

## Exposing the server publicly with ngrok

The MCP server listens on `localhost` by default. To expose it publicly (e.g. so a remote Cursor or another client can connect), use [ngrok](https://ngrok.com/).

1. **Install ngrok on Linux**

   - Using the official package (recommended):

     ```bash
     curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
     echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
     sudo apt update && sudo apt install ngrok
     ```

   - Or via Snap: `sudo snap install ngrok`

   - Or download the binary from [ngrok.com/download](https://ngrok.com/download) and add it to your `PATH`.

2. **Start the MCP server** (e.g. `npm start` on port 3000).

3. **In another terminal**, run:

   ```bash
   ngrok http 3000 --host-header="localhost:3000"
   ```

   ngrok will print a public URL (e.g. `https://abc123.ngrok.io`). Use `https://abc123.ngrok.io/mcp` as the MCP server URL in Cursor (or your client) instead of `http://127.0.0.1:3000/mcp`.

## Cursor configuration

This server uses **Streamable HTTP** transport, not stdio. In Cursor:

1. Open **Settings → Tools & MCP** (or edit `.cursor/mcp.json` in your project or user config).
2. Add an MCP server with:
   - **Type**: `streamableHttp`
   - **URL**: Use the **localhost** URL when Cursor runs on the same machine as the server (`http://127.0.0.1:3000/mcp`), or the **ngrok** URL when the server is exposed via ngrok (e.g. `https://abc123.ngrok.io/mcp`). Choose whichever fits your setup.
   - **Name**: e.g. `orangehrm`

Example `.cursor/mcp.json` (localhost):

```json
{
  "mcpServers": {
    "orangehrm": {
      "url": "http://127.0.0.1:3000/mcp", // Or the ngrok URL
      "transport": "streamableHttp"
    }
  }
}
```

Ensure the OrangeHRM MCP server is running (`npm start`) before using the tools in Cursor. Restart Cursor after changing MCP configuration if the server list does not update.

## Project structure

```text
orangemcp/
├── src/
│   ├── index.ts              # HTTP server, MCP transport, tool registration
│   ├── orangehrm.ts          # Base URL, OAuth2 token, API request helpers
│   ├── tools.ts              # Registers PIM and leave tools
│   ├── pim/
│   │   ├── tools.ts          # PIM tool registration (employees)
│   │   └── employees/
│   │       ├── api.ts        # listEmployees() → GET /api/employees
│   │       ├── tools.ts      # list_employees, get_employee_filter_schema, get_employee_include_schema
│   │       ├── filters.ts    # Employee filter schema and related-name pattern
│   │       └── includes.ts  # Employee include options and schema
│   └── leave/
│       └── rules/
│           └── tools.ts      # get_leave_rule_reference (reads scripts/sample-leave-rule.xml)
├── scripts/
│   └── sample-leave-rule.xml # Reference leave-rule XML with descriptions
├── build/                    # Compiled output (after npm run build)
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

## License

ISC
