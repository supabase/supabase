console.log("main function started");

Deno.serve({
  handler: async (req: Request) => {
    console.log(req.url);
    const url = new URL(req.url);
    const { pathname } = url;
    const path_parts = pathname.split("/");
    const service_name = path_parts[1];

    if (!service_name || service_name === "") {
      const error = { msg: "missing function name in request" };
      return new Response(
        JSON.stringify(error),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const servicePath = `./test_cases/${service_name}`;

    let allow_net: string[] | null | undefined;
    let deny_net: string[] | null;

    try {
      const payload = await req.clone().json();

      allow_net = payload.allowNet;
      deny_net = payload.allowNet === null ? [] : null;
    } catch {}

    console.error(`serving the request with ${servicePath}`);

    const createWorker = async () => {
      const memoryLimitMb = 150;
      const workerTimeoutMs = 10 * 60 * 1000;
      const cpuTimeSoftLimitMs = 10 * 60 * 1000;
      const cpuTimeHardLimitMs = 10 * 60 * 1000;
      const noModuleCache = false;
      const envVarsObj = Deno.env.toObject();
      const envVars = Object.keys(envVarsObj).map((k) => [k, envVarsObj[k]]);

      return await EdgeRuntime.userWorkers.create({
        servicePath,
        memoryLimitMb,
        workerTimeoutMs,
        cpuTimeSoftLimitMs,
        cpuTimeHardLimitMs,
        noModuleCache,
        envVars,
        permissions: {
          allow_all: false,
          allow_env: [],
          allow_net,
          deny_net,
          allow_read: [],
          allow_write: [],
          allow_import: [],
          allow_sys: ["hostname"],
        },
      });
    };

    const callWorker = async () => {
      try {
        const worker = await createWorker();
        return await worker.fetch(req);
      } catch (e) {
        console.error(e);

        // if (e instanceof Deno.errors.WorkerRequestCancelled) {
        // 	return await callWorker();
        // }

        const error = { msg: e.toString() };
        return new Response(
          JSON.stringify(error),
          { status: 500, headers: { "Content-Type": "application/json" } },
        );
      }
    };

    return callWorker();
  },

  onError: (e) => new Response(e.toString(), { status: 500 }),
});
