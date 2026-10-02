console.log("main function started");

Deno.serve(async (req: Request) => {
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
  console.error(`serving the request with ${servicePath}`);

  const createWorker = async () => {
    const cpuTimeSoftLimitMs = 10;
    const cpuTimeHardLimitMs = 30;

    const memoryLimitMb = 150;
    const workerTimeoutMs = 10 * 60 * 1000;
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
});
