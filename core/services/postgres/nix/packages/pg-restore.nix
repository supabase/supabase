{ runCommand, psql_15 }:
runCommand "run-pg-restore" { } ''
  mkdir -p $out/bin
  substitute ${./run-restore.sh.in} $out/bin/pg-restore \
    --subst-var-by PSQL15_BINDIR '${psql_15}'
  chmod +x $out/bin/pg-restore
''
