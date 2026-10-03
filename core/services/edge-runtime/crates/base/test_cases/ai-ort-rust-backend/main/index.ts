import * as path from "jsr:@std/path";

const handle = setInterval(async () => {
  try {
    const cleanupCount = await EdgeRuntime.ai.tryCleanupUnusedSession();
    if (cleanupCount == 0) {
      return;
    }
    console.log("EdgeRuntime.ai.tryCleanupUnusedSession", cleanupCount);
  } catch (e) {
    console.error(e.toString());
  }
}, 100);

addEventListener("beforeunload", () => {
  clearInterval(handle);
});

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

  const servicePath = path.join("test_cases/ai-ort-rust-backend", pathname);

  const createWorker = async () => {
    const memoryLimitMb = 1500;
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
