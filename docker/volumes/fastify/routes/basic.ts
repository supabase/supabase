import { z } from "zod";
import { publicProcedure } from "./utils.js";

export const health = publicProcedure
	.meta({
		openapi: {
			method: "GET",
			path: "/health",
			summary: "Check Health of the server",
			protect: false,
		},
	})
	.input(z.object({}))
	.output(z.string())
	.query(async (opts) => {
		return "OK";
	});
