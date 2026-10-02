console.log("main function started");

Deno.serve({
  handler: async (req: Request) => {
    const { pathname } = new URL(req.url);
    const servicePath = `./test_cases${pathname}`;
    const projectRef = req.headers.get("x-project-ref");

    console.error(`serving the request with ${servicePath}`);

    const envVarsObj = Deno.env.toObject();
    const envVars = Object.keys(envVarsObj).map((k) => [k, envVarsObj[k]]);

    try {
      const worker = await EdgeRuntime.userWorkers.create({
        servicePath,
        memoryLimitMb: 150,
        workerTimeoutMs: 10 * 60 * 1000,
        cpuTimeSoftLimitMs: 10 * 60 * 1000,
        cpuTimeHardLimitMs: 10 * 60 * 1000,
        noModuleCache: false,
        envVars,
        context: projectRef ? { projectRef } : {},
      });

      return await worker.fetch(req);
    } catch (e) {
      console.error(e);

      const error = { msg: e.toString() };
      return new Response(
        JSON.stringify(error),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  },

  onError: (e) => new Response(e.toString(), { status: 500 }),
});
