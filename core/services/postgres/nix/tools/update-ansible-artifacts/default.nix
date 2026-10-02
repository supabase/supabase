{
  bash,
  coreutils,
  gnugrep,
  curl,
  gitMinimal,
  jinja2-cli,
  writeShellApplication,
  yq-go,
}:
writeShellApplication {
  name = "update-ansible-artifacts";

  runtimeInputs = [
    bash
    coreutils
    curl
    gnugrep
    gitMinimal
    jinja2-cli
    yq-go
  ];

  text = builtins.readFile ./update-ansible-artifacts.sh;
}
