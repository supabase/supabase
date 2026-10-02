{
  lib,
  stdenv,
  fetchurl,
  autoPatchelfHook,
}:
let
  version = "2.75.0";

  sources = {
    x86_64-linux = {
      url = "https://github.com/supabase/cli/releases/download/v${version}/supabase_linux_amd64.tar.gz";
      hash = "sha256-5Vl0Yvhl1axyrwRTNY437LDYWWKtaRShFKU96EcwO94=";
    };
    aarch64-linux = {
      url = "https://github.com/supabase/cli/releases/download/v${version}/supabase_linux_arm64.tar.gz";
      hash = "sha256-tVHC+OA3Fb5CjSWSdlIAqeNxFo/DbsJkaoTsxTDTEg4=";
    };
    aarch64-darwin = {
      url = "https://github.com/supabase/cli/releases/download/v${version}/supabase_darwin_arm64.tar.gz";
      hash = "sha256-ZhhzZIcoep8INcRKcQFpTetMoRkoUqBwqTAUQ3ZBzqM=";
    };
  };

  src = fetchurl {
    inherit (sources.${stdenv.hostPlatform.system}) url hash;
  };
in
stdenv.mkDerivation {
  pname = "supabase-cli";
  inherit version src;

  sourceRoot = ".";

  nativeBuildInputs = lib.optionals stdenv.hostPlatform.isLinux [ autoPatchelfHook ];

  installPhase = ''
    runHook preInstall
    install -Dm755 supabase $out/bin/supabase
    runHook postInstall
  '';

  meta = with lib; {
    description = "Supabase CLI";
    homepage = "https://github.com/supabase/cli";
    license = licenses.mit;
    platforms = builtins.attrNames sources;
    mainProgram = "supabase";
  };
}
