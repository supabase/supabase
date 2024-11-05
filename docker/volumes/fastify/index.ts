import fastifyJWT from "@fastify/jwt";
import cors from "@fastify/cors";
import fastify from "fastify";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import { fastifyTRPCOpenApiPlugin } from "trpc-openapi";
import {
	fastifyTRPCPlugin,
	type FastifyTRPCPluginOptions,
} from "@trpc/server/adapters/fastify";
import { appRouter, type AppRouter } from "./routes/index.js";
import type { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";
import dotenv from "dotenv";
import { openApiDocument } from "./openapi.js";
import fs from "node:fs";

let envfile = ".env";
if (fs.existsSync("prod.env")) {
	envfile = "prod.env";
}

export const env = dotenv.config({
	path: envfile,
});

const server = fastify({
	logger: true,
	maxParamLength: 5000,
});

// Setup CORS
await server.register(cors);

export async function createContext({ req, res }: CreateFastifyContextOptions) {
	return { req, res, fastify: server };
}

export type AuthContext = Awaited<ReturnType<typeof createContext>>;

// Handle incoming tRPC requests
await server.register(fastifyTRPCPlugin, {
	prefix: "/trpc",
	useWss: false,
	trpcOptions: { router: appRouter, createContext },
});

// Handle incoming OpenAPI requests
await server.register(fastifyTRPCOpenApiPlugin, {
	basePath: "/api",
	router: appRouter,
	createContext,
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
} as any);

await server.register(fastifySwagger, {
	mode: "static",
	specification: { document: openApiDocument },
});
await server.register(fastifySwaggerUi, {
	routePrefix: "/docs",
	// baseDir: "/trpc/v1/docs",
	uiConfig: { displayOperationId: true },
});

try {
	console.log("Starting Server");
	await server.listen({
		host: process.env["HOST"] ?? "127.0.0.1",
		port: Number.parseInt(process.env["PORT"] ?? "11000"),
	});
	console.log("Server started");
} catch (err) {
	server.log.error(err);
	process.exit(1);
}
