import { OpenAPIV3 } from './types.js';

const SWAGGER_URL = process.env.SWAGGER_URL || 'http://localhost:3000/api-json';

let cachedSpec: OpenAPIV3.Document | null = null;

export async function fetchSwaggerSpec(): Promise<OpenAPIV3.Document> {
  if (cachedSpec) {
    return cachedSpec;
  }

  const response = await fetch(SWAGGER_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch Swagger spec: ${response.statusText}`);
  }

  cachedSpec = (await response.json()) as OpenAPIV3.Document;
  return cachedSpec;
}

export function clearCache(): void {
  cachedSpec = null;
}

export interface EndpointSummary {
  method: string;
  path: string;
  summary?: string;
  tags: string[];
  operationId?: string;
}

export interface EndpointDetails {
  method: string;
  path: string;
  summary?: string;
  description?: string;
  tags: string[];
  operationId?: string;
  parameters: ParameterInfo[];
  requestBody?: RequestBodyInfo;
  responses: ResponseInfo[];
}

export interface ParameterInfo {
  name: string;
  in: string;
  required: boolean;
  description?: string;
  schema?: object;
}

export interface RequestBodyInfo {
  required: boolean;
  contentType: string;
  schema?: object;
}

export interface ResponseInfo {
  statusCode: string;
  description: string;
  schema?: object;
}

export async function listEndpoints(tag?: string): Promise<EndpointSummary[]> {
  const spec = await fetchSwaggerSpec();
  const endpoints: EndpointSummary[] = [];

  for (const [path, pathItem] of Object.entries(spec.paths || {})) {
    if (!pathItem) continue;

    const methods = ['get', 'post', 'put', 'patch', 'delete'] as const;
    for (const method of methods) {
      const operation = pathItem[method] as OpenAPIV3.OperationObject | undefined;
      if (!operation) continue;

      const opTags = operation.tags || [];
      if (tag && !opTags.includes(tag)) continue;

      endpoints.push({
        method: method.toUpperCase(),
        path,
        summary: operation.summary,
        tags: opTags,
        operationId: operation.operationId,
      });
    }
  }

  return endpoints;
}

export async function getEndpointDetails(
  method: string,
  path: string
): Promise<EndpointDetails | null> {
  const spec = await fetchSwaggerSpec();
  const pathItem = spec.paths?.[path];
  if (!pathItem) return null;

  const operation = pathItem[method.toLowerCase() as keyof typeof pathItem] as
    | OpenAPIV3.OperationObject
    | undefined;
  if (!operation) return null;

  const parameters: ParameterInfo[] = [];
  for (const param of operation.parameters || []) {
    const p = param as OpenAPIV3.ParameterObject;
    parameters.push({
      name: p.name,
      in: p.in,
      required: p.required || false,
      description: p.description,
      schema: p.schema as object,
    });
  }

  let requestBody: RequestBodyInfo | undefined;
  if (operation.requestBody) {
    const rb = operation.requestBody as OpenAPIV3.RequestBodyObject;
    const contentType = Object.keys(rb.content || {})[0] || 'application/json';
    const content = rb.content?.[contentType];
    requestBody = {
      required: rb.required || false,
      contentType,
      schema: resolveSchema(spec, content?.schema),
    };
  }

  const responses: ResponseInfo[] = [];
  for (const [statusCode, response] of Object.entries(operation.responses || {})) {
    const resp = response as OpenAPIV3.ResponseObject;
    const contentType = Object.keys(resp.content || {})[0];
    const content = resp.content?.[contentType];
    responses.push({
      statusCode,
      description: resp.description || '',
      schema: resolveSchema(spec, content?.schema),
    });
  }

  return {
    method: method.toUpperCase(),
    path,
    summary: operation.summary,
    description: operation.description,
    tags: operation.tags || [],
    operationId: operation.operationId,
    parameters,
    requestBody,
    responses,
  };
}

export async function searchEndpoints(query: string): Promise<EndpointSummary[]> {
  const endpoints = await listEndpoints();
  const lowerQuery = query.toLowerCase();

  return endpoints.filter(
    (ep) =>
      ep.path.toLowerCase().includes(lowerQuery) ||
      ep.summary?.toLowerCase().includes(lowerQuery) ||
      ep.operationId?.toLowerCase().includes(lowerQuery) ||
      ep.tags.some((t) => t.toLowerCase().includes(lowerQuery))
  );
}

export async function getSchema(schemaName: string): Promise<object | null> {
  const spec = await fetchSwaggerSpec();
  const schema = spec.components?.schemas?.[schemaName];
  if (!schema) return null;

  return resolveSchema(spec, schema) || null;
}

export async function listSchemas(): Promise<string[]> {
  const spec = await fetchSwaggerSpec();
  return Object.keys(spec.components?.schemas || {});
}

function resolveSchema(
  spec: OpenAPIV3.Document,
  schema?: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject
): object | undefined {
  if (!schema) return undefined;

  if ('$ref' in schema) {
    const refPath = schema.$ref.replace('#/components/schemas/', '');
    const resolved = spec.components?.schemas?.[refPath];
    if (resolved && !('$ref' in resolved)) {
      return {
        $ref: schema.$ref,
        resolved: resolved,
      };
    }
    return { $ref: schema.$ref };
  }

  return schema as object;
}
