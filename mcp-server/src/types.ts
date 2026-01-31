// Simplified OpenAPI V3 types for our use case
export namespace OpenAPIV3 {
  export interface Document {
    openapi: string;
    info: InfoObject;
    paths?: PathsObject;
    components?: ComponentsObject;
    tags?: TagObject[];
  }

  export interface InfoObject {
    title: string;
    description?: string;
    version: string;
  }

  export interface PathsObject {
    [path: string]: PathItemObject;
  }

  export interface PathItemObject {
    get?: OperationObject;
    post?: OperationObject;
    put?: OperationObject;
    patch?: OperationObject;
    delete?: OperationObject;
    parameters?: (ParameterObject | ReferenceObject)[];
  }

  export interface OperationObject {
    operationId?: string;
    summary?: string;
    description?: string;
    tags?: string[];
    parameters?: (ParameterObject | ReferenceObject)[];
    requestBody?: RequestBodyObject | ReferenceObject;
    responses?: ResponsesObject;
  }

  export interface ParameterObject {
    name: string;
    in: 'path' | 'query' | 'header' | 'cookie';
    required?: boolean;
    description?: string;
    schema?: SchemaObject | ReferenceObject;
  }

  export interface RequestBodyObject {
    required?: boolean;
    content?: ContentObject;
  }

  export interface ResponsesObject {
    [statusCode: string]: ResponseObject | ReferenceObject;
  }

  export interface ResponseObject {
    description?: string;
    content?: ContentObject;
  }

  export interface ContentObject {
    [mediaType: string]: MediaTypeObject;
  }

  export interface MediaTypeObject {
    schema?: SchemaObject | ReferenceObject;
  }

  export interface ComponentsObject {
    schemas?: { [key: string]: SchemaObject | ReferenceObject };
  }

  export interface SchemaObject {
    type?: string;
    properties?: { [key: string]: SchemaObject | ReferenceObject };
    items?: SchemaObject | ReferenceObject;
    required?: string[];
    description?: string;
    example?: unknown;
    enum?: unknown[];
    format?: string;
  }

  export interface ReferenceObject {
    $ref: string;
  }

  export interface TagObject {
    name: string;
    description?: string;
  }
}
