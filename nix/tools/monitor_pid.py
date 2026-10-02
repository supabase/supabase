# Monitor a process pid with psutil and emits a CSV.
import sys
import time
import psutil
import pandas as pd

KEY = "Elapsed seconds"
BASE_METRICS = ["CPU (%)", "Real (MB)"]
SAMPLE_INTERVAL_SECS = 1

if len(sys.argv) != 2 or not sys.argv[1].isdigit():
    sys.exit(f"Usage: {sys.argv[0]} <PID>")

pid = int(sys.argv[1])
try:
    proc = psutil.Process(pid)
except psutil.NoSuchProcess:
    sys.exit(f"Error: process {pid} not found.")

print(f"Starting monitoring of {pid} pid", file=sys.stderr)

records = []
start = time.time()
# ignore first result as per docs recommendation
# https://psutil.readthedocs.io/en/latest/#psutil.cpu_percent
proc.cpu_percent(None)

while True:
    try:
        if not proc.is_running():
            break
        time.sleep(SAMPLE_INTERVAL_SECS)

        elapsed_secs = int(time.time() - start)
        cpu = proc.cpu_percent(None)
        meminfo = proc.memory_info()
        bytes_in_MB = 1024**2
        rss_mb = meminfo.rss / bytes_in_MB

        records.append(
            [
                str(elapsed_secs),
                f"{cpu:.3f}",
                f"{rss_mb:.3f}",
            ]
        )

    except psutil.NoSuchProcess:
        break

end = time.time()
total_time = end - start
print(f"Finished {pid} pid monitoring in {total_time:.3f}", file=sys.stderr)

cols = [KEY] + BASE_METRICS
df = pd.DataFrame(records, columns=cols, dtype=str)
df.to_csv(sys.stdout, index=False)
