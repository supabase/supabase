import os
import sys
import pandas as pd

KEY = "Elapsed seconds"
BASE_METRICS = ["CPU (%)", "Real (MB)"]
branch_order = []
merged = None

paths = [p.strip() for p in sys.stdin.read().split() if p.strip()]

for csv_path in paths:
    # br is branch (variable shortened to pass linter)
    br = os.path.splitext(os.path.basename(csv_path))[0]
    branch_order.append(br)

    df = pd.read_csv(csv_path)

    if KEY not in df.columns:
        sys.exit(f"{csv_path} is missing the {KEY} column")

    for m in BASE_METRICS:
        if m not in df.columns:
            sys.exit(f"Error: '{csv_path}' missing required column '{m}'.")

    # add branch marker to every metric column
    df = df.rename(columns={c: f"{c} [{br}]" for c in df.columns if c != KEY})

    # outer join so missing rows appear
    merged = df if merged is None else merged.merge(df, on=KEY, how="outer")

# Re-order columns so related metrics are adjacent
ordered_cols = [KEY]
for metric in BASE_METRICS:
    for br in branch_order:
        col_name = f"{metric} [{br}]"
        if col_name in merged.columns:
            ordered_cols.append(col_name)

merged = merged[ordered_cols]

# replace nan with empty string
merged = merged.fillna("")
merged.to_markdown(sys.stdout, index=False, tablefmt="github")
