import * as path from "jsr:@std/path";

Deno.serve(async (req: Request) => {
  console.log(req.url);
  const url = new URL(req.url);
  const { pathname } = url;
  const service_name = pathname;

  if (!service_name || service_name === "") {
    const error = { msg: "missing function name in request" };
    return new Response(
      JSON.stringify(error),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const servicePath = path.join("test_cases/runtime-event", pathname);
  let configs = {
    memoryLimitMb: 150 * 1,
    workerTimeoutMs: 60 * 1000,
    cpuTimeSoftLimitMs: 1000 * 2,
    cpuTimeHardLimitMs: 1000 * 4,
  } as const;

  switch (pathname) {
    case "/cpu":
      configs = {
        ...configs,
        cpuTimeSoftLimitMs: 250,
        cpuTimeHardLimitMs: 500,
      };
      break;

    case "/mem":
      configs = {
        ...configs,
        memoryLimitMb: 50,
      };
      break;

    case "/wall-clock":
      configs = {
        ...configs,
        workerTimeoutMs: 1000 * 5,
      };
      break;

    case "/unload":
      configs = {
        ...configs,
        workerTimeoutMs: 1000 * 2,
      };
      break;

    default:
      return new Response(null, { status: 200 });
  }

  const createWorker = async () => {
    const noModuleCache = false;
    const envVarsObj = Deno.env.toObject();
    const envVars = Object.keys(envVarsObj).map((k) => [k, envVarsObj[k]]);

    return await EdgeRuntime.userWorkers.create({
      ...configs,
      servicePath,
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

      const error = { msg: e.toString() };
      return new Response(
        JSON.stringify(error),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  };

  return await callWorker();
});
