#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import {
  listEndpoints,
  getEndpointDetails,
  searchEndpoints,
  getSchema,
  listSchemas,
  clearCache,
} from './swagger-client.js';

const server = new McpServer({
  name: 'api-knowledge-server',
  version: '1.0.0',
});

// Tool: List all endpoints
server.tool(
  'list_endpoints',
  'List all API endpoints. Optionally filter by tag.',
  {
    tag: z.string().optional().describe('Filter endpoints by tag (e.g., "items", "users")'),
  },
  async ({ tag }) => {
    try {
      const endpoints = await listEndpoints(tag);
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(endpoints, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool: Get endpoint details
server.tool(
  'get_endpoint_details',
  'Get detailed information about a specific endpoint including parameters, request body, and responses.',
  {
    method: z.string().describe('HTTP method (GET, POST, PUT, PATCH, DELETE)'),
    path: z.string().describe('API path (e.g., "/items", "/items/{id}")'),
  },
  async ({ method, path }) => {
    try {
      const details = await getEndpointDetails(method, path);
      if (!details) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Endpoint not found: ${method} ${path}`,
            },
          ],
          isError: true,
        };
      }
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(details, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool: Search endpoints
server.tool(
  'search_endpoints',
  'Search for endpoints by keyword. Searches in path, summary, operationId, and tags.',
  {
    query: z.string().describe('Search query'),
  },
  async ({ query }) => {
    try {
      const endpoints = await searchEndpoints(query);
      return {
        content: [
          {
            type: 'text' as const,
            text:
              endpoints.length > 0
                ? JSON.stringify(endpoints, null, 2)
                : 'No endpoints found matching your query.',
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool: Get schema
server.tool(
  'get_schema',
  'Get the schema definition for a DTO or model.',
  {
    schemaName: z.string().describe('Name of the schema (e.g., "CreateItemDto", "Item")'),
  },
  async ({ schemaName }) => {
    try {
      const schema = await getSchema(schemaName);
      if (!schema) {
        const available = await listSchemas();
        return {
          content: [
            {
              type: 'text' as const,
              text: `Schema "${schemaName}" not found. Available schemas: ${available.join(', ')}`,
            },
          ],
          isError: true,
        };
      }
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(schema, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool: List schemas
server.tool('list_schemas', 'List all available DTO/model schemas.', {}, async () => {
  try {
    const schemas = await listSchemas();
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(schemas, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    };
  }
});

// Tool: Refresh cache
server.tool(
  'refresh_cache',
  'Clear the cached Swagger spec and fetch fresh data on next request.',
  {},
  async () => {
    clearCache();
    return {
      content: [
        {
          type: 'text' as const,
          text: 'Cache cleared. The next API call will fetch fresh Swagger data.',
        },
      ],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('API Knowledge MCP Server running on stdio');
}

main().catch(console.error);
