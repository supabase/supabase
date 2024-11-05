import type { OpenApiMeta } from "trpc-openapi";
import { initTRPC } from "@trpc/server";
export const t = initTRPC
	.meta<OpenApiMeta>()
	.create({
		errorFormatter: ({ error, shape }) => {
			console.log(error, shape);
			return shape;
		},
	});

export const publicProcedure = t.procedure;

