# API Knowledge MCP Server

MCP server để tra cứu API documentation từ Swagger.

## Setup

```bash
cd mcp-server
npm install
npm run build
```

## MCP Configuration

Thêm vào file settings của IDE/Agent (ví dụ: `.gemini/settings.json`):

```json
{
  "mcpServers": {
    "api-knowledge": {
      "command": "node",
      "args": ["/Users/tom/Documents/test-mcp-be/mcp-server/dist/index.js"],
      "env": {
        "SWAGGER_URL": "http://localhost:3000/api-json"
      }
    }
  }
}
```

## Tools

| Tool | Mô tả |
|------|-------|
| `list_endpoints` | Liệt kê tất cả API endpoints |
| `get_endpoint_details` | Chi tiết endpoint (params, request, response) |
| `search_endpoints` | Tìm kiếm endpoint theo keyword |
| `get_schema` | Lấy schema DTO/model |
| `list_schemas` | Liệt kê tất cả schemas |
| `refresh_cache` | Refresh cached Swagger data |

## Usage Examples

```
# Liệt kê endpoints của tag "items"
list_endpoints(tag: "items")

# Xem chi tiết POST /items
get_endpoint_details(method: "POST", path: "/items")

# Tìm endpoints liên quan đến "item"
search_endpoints(query: "item")

# Xem schema CreateItemDto
get_schema(schemaName: "CreateItemDto")
```
