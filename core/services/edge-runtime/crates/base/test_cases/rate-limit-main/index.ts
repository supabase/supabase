console.log("rate-limit-main started");

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const { pathname } = url;

  console.log(
    `Received request for ${pathname}, transparent header: ${
      req.headers.get("traceparent")
    }`,
  );

  const path_parts = pathname.split("/");
  const service_name = path_parts[1];

  if (!service_name || service_name === "") {
    return new Response(
      JSON.stringify({ msg: "missing function name in request" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const servicePath = `./test_cases/${service_name}`;

  const createWorker = async () => {
    const memoryLimitMb = 150;
    const workerTimeoutMs = 10 * 60 * 1000;
    const cpuTimeSoftLimitMs = 10 * 60 * 1000;
    const cpuTimeHardLimitMs = 10 * 60 * 1000;
    const noModuleCache = false;
    const envVarsObj = Deno.env.toObject();
    const envVars = Object.keys(envVarsObj).map((k) => [k, envVarsObj[k]]);

    const tracingOpts = service_name.endsWith("-untraced") ? {} : {
      otelConfig: {
        tracing_enabled: true,
        propagators: ["TraceContext"],
      },
    };

    const debugOpts = service_name.endsWith("-echo")
      ? { context: { exposeRequestTraceId: true } }
      : {};

    return await EdgeRuntime.userWorkers.create({
      servicePath,
      memoryLimitMb,
      workerTimeoutMs,
      cpuTimeSoftLimitMs,
      cpuTimeHardLimitMs,
      noModuleCache,
      envVars,
      ...tracingOpts,
      ...debugOpts,
      traceRateLimitOptions: {
        key: servicePath,
        rules: [
          {
            matches: ".*",
            ttl: 60,
            budget: { local: 10, global: 10 },
          },
        ],
      },
    });
  };

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
});
