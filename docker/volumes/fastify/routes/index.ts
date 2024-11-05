import { t } from "./utils.js";
import { health } from "./basic.js";

export const appRouter = t.router({
    health
})

// export type definition of API
export type AppRouter = typeof appRouter;