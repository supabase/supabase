class DenoCommand {
  constructor(command, options) {
    this.command = command;
    this.options = options;
  }

  output() {
    return Promise.reject(
      new Error(
        "Spawning subprocesses is not allowed on Supabase Edge Runtime.",
      ),
    );
  }

  outputSync() {
    throw new Error(
      "Spawning subprocesses is not allowed on Supabase Edge Runtime.",
    );
  }

  spawn() {
    throw new Error(
      "Spawning subprocesses is not allowed on Supabase Edge Runtime.",
    );
  }
}

const os_start_time = Date.now();

const osCalls = {
  gid: () => 1000,
  uid: () => 1000,
  osUptime: () => Math.floor(Math.abs(Date.now() - os_start_time) / 1000),
  osRelease: () => "0.0.0-00000000-generic",
  loadAvg: () => [0, 0, 0],
  hostname: () => "localhost",
  systemMemoryInfo: () => ({
    total: 0,
    free: 0,
    available: 0,
    buffers: 0,
    cached: 0,
    swapTotal: 0,
    swapFree: 0,
  }),
  consoleSize: () => ({ columns: 80, rows: 24 }),
  command: DenoCommand,
  networkInterfaces: () => [
    {
      "family": "IPv4",
      "name": "lo",
      "address": "127.0.0.1",
      "netmask": "255.0.0.0",
      "scopeid": null,
      "cidr": "127.0.0.1/8",
      "mac": "00:00:00:00:00:00",
    },
    {
      "family": "IPv4",
      "name": "eth0",
      "address": "10.0.0.10",
      "netmask": "255.255.255.0",
      "scopeid": null,
      "cidr": "10.0.0.10/24",
      "mac": "00:00:00:00:00:01",
    },
  ],
};

export { osCalls };
