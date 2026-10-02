Profiling of the Supabase can be done using [eFlambé][eflambe] project.

Example profiling session looks like:

- Start application within IEx session (for example by using `mise run dev`)
- Within given session you can specify which function you want to trace, by
  calling `:eflambe.capture({mod, func, arity}, no_of_captures)`, however it is
  useful to have some separate directory to store all traces, for that one can use
  quick snippet

  ```elixir
  dir = "./tmp/capture-#{DateTime.utc_now()}"; File.mkdir_p!(dir); :eflambe.capture({Supavisor.ClientHandler, :handle_event, 4}, 0, [output_directory: dir])
  ```

  Which provides separate directory for each tracing session.
- Generated traces can be viewed in [Speedoscope][] for visual navigation.

![Speedoscope session example](/docs/images/trace-example.png)

### Problems to be resolved

- Currently you can monitor only function calls. Sometimes it would be handy to
  monitor whole process instead, so it would provide better view into process work.
  [Stratus3D/eflambe#47](https://github.com/Stratus3D/eflambe/issues/47)
- Currently if there is less than `no_of_captures` calls, then eFlambé will try
  to wait for more calls indefinitely. There is no way to listen only for some
  period and then just stop. [Stratus3D/eflambe#48](https://github.com/Stratus3D/eflambe/issues/48)
- You will not see arguments of called functions in traces, which mean that you
  want to trace long running processes that have a lot of calls to similarly
  named function (like `gen_statem` process) you will need some manual work to
  find which clause matched given trace. [Stratus3D/eflambe#46](https://github.com/Stratus3D/eflambe/issues/46)

[eflambe]: https://github.com/Stratus3D/eflambe
[Speedoscope]: https://www.speedscope.app/
