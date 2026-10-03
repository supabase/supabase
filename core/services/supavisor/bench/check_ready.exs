alias Supavisor.DbHandler, as: Db

long = <<51, 0, 0, 0, 4, 90, 0, 0, 0, 5, 84>>
short = <<90, 0, 0, 0, 5, 84>>
empty = <<>>
pattern = <<?Z, 5::32, ?I>>

Benchee.run(%{
  "check_ready long" => fn ->
    Db.check_ready(long)
  end,
  "check_ready short" => fn ->
    Db.check_ready(short)
  end,
  "check_ready empty" => fn ->
    Db.check_ready(empty)
  end,
  "String.end_with? long" => fn ->
    String.ends_with?(long, pattern)
  end,
  "String.ends_with? short" => fn ->
    String.ends_with?(short, pattern)
  end,
  "String.ends_with? empty" => fn ->
    String.ends_with?(empty, pattern)
  end
})

# Name                              ips        average  deviation         median         99th %
# check_ready empty             29.24 M       34.21 ns   ±132.43%          42 ns          42 ns
# String.ends_with? empty       26.26 M       38.08 ns   ±103.24%          42 ns          42 ns
# check_ready short             22.62 M       44.21 ns ±10906.38%          42 ns          83 ns
# check_ready long              22.27 M       44.90 ns ±11107.18%          42 ns          83 ns
# String.ends_with? short       11.65 M       85.80 ns ±34927.89%          42 ns          84 ns
# String.end_with? long         11.45 M       87.34 ns ±35769.87%          42 ns          84 ns

# Comparison:
# check_ready empty             29.24 M
# String.ends_with? empty       26.26 M - 1.11x slower +3.88 ns
# check_ready short             22.62 M - 1.29x slower +10.00 ns
# check_ready long              22.27 M - 1.31x slower +10.70 ns
# String.ends_with? short       11.65 M - 2.51x slower +51.60 ns
# String.end_with? long         11.45 M - 2.55x slower +53.14 ns
