function sleep(ms: number): Promise<string> {
  return new Promise((res) => {
    setTimeout(() => {
      res("meow");
    }, ms);
  });
}

function mySlowFunction(baseNumber: number) {
  const now = Date.now();
  let result = 0;
  for (let i = Math.pow(baseNumber, 7); i >= 0; i--) {
    result += Math.atan(i) * Math.tan(i);
  }
  const duration = Date.now() - now;
  return { result: result, duration: duration };
}

class MyBackgroundTaskEvent extends Event {
  readonly taskPromise: Promise<string>;

  constructor(taskPromise: Promise<string>) {
    super("myBackgroundTask");
    this.taskPromise = taskPromise;
  }
}

globalThis.addEventListener("myBackgroundTask", async (event) => {
  const str = await (event as MyBackgroundTaskEvent).taskPromise;
  console.log(str);
});

export default {
  fetch() {
    // consumes lots of cpu time
    mySlowFunction(10);
    // however, this time we did not notify the runtime that it should wait for this promise.
    // therefore, the above console.log(str) will not be output and the worker will terminate.
    dispatchEvent(new MyBackgroundTaskEvent(sleep(5000)));
    return new Response();
  },
};
