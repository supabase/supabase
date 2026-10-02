{
  runCommand,
  makeWrapper,
  nushell,
}:
runCommand "update-readme"
  {
    nativeBuildInputs = [ makeWrapper ];
    buildInputs = [ nushell ];
  }
  ''
    mkdir -p $out/bin
    cp ${../tools/update_readme.nu} $out/bin/update-readme
    chmod +x $out/bin/update-readme
    wrapProgram $out/bin/update-readme \
      --prefix PATH : ${nushell}/bin
  ''
