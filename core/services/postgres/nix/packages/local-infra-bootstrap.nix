{ runCommand }:
runCommand "local-infra-bootstrap" { } ''
  mkdir -p $out/bin
  substitute ${./local-infra-bootstrap.sh.in} $out/bin/local-infra-bootstrap
  chmod +x $out/bin/local-infra-bootstrap
''
