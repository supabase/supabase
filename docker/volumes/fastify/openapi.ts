import { generateOpenApiDocument } from "trpc-openapi";

import { appRouter } from "./routes/index.js";

// Generate OpenAPI schema document
export const openApiDocument = generateOpenApiDocument(appRouter, {
	title: "Example CRUD API",
	description: "OpenAPI compliant REST API built using tRPC with Fastify",
	version: "1.0.0",
	baseUrl: "http://localhost:11000/api",
});
