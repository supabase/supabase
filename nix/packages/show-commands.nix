{
  runCommand,
  makeWrapper,
  nushell,
  stdenv,
}:
runCommand "show-commands"
  {
    nativeBuildInputs = [ makeWrapper ];
    buildInputs = [ nushell ];
  }
  ''
    mkdir -p $out/bin
    cat > $out/bin/show-commands << 'EOF'
    #!${nushell}/bin/nu
    let json_output = (nix flake show --json --quiet --all-systems | from json)
    let apps = ($json_output | get apps.${stdenv.hostPlatform.system})
    $apps | transpose name info | select name | each { |it| echo $"Run this app with: nix run .#($it.name)" }
    EOF
    chmod +x $out/bin/show-commands
    wrapProgram $out/bin/show-commands \
      --prefix PATH : ${nushell}/bin
  ''
