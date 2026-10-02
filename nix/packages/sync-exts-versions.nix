{
  writeShellApplication,
  jq,
  yq,
  nix-editor,
  nix,
}:
writeShellApplication {
  name = "sync-exts-versions";
  runtimeInputs = [
    jq
    yq
    nix-editor.packages.nix-editor
    nix
  ];
  text = builtins.readFile ../tools/sync-exts-versions.sh.in;
}
