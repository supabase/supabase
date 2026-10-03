{ pkgs, ... }:
let
  upstream-gatekeeper = pkgs.buildGoModule {
    pname = "jit-db-gatekeeper";
    version = "1.0.5";
    src = pkgs.fetchFromGitHub {
      owner = "supabase";
      repo = "jit-db-gatekeeper";
      rev = "v1.0.5";
      sha256 = "sha256-z+TE9Cc+NL6nvCIkAKFdSgm4V/1K45tRRnfQdauDjes=";
    };
    vendorHash = null;

    buildInputs = [ pkgs.pam ];

    # dlopen'd into PAM, which already links these libs
    NIX_DONT_SET_RPATH = pkgs.stdenv.isLinux;

    buildPhase = ''
      runHook preBuild
      go build -buildmode=c-shared -o pam_jit_pg.so
      runHook postBuild
    '';

    installPhase = ''
      runHook preInstall
      mkdir -p $out/lib/security
      cp pam_jit_pg.so $out/lib/security/
      runHook postInstall
    '';
  };
in

pkgs.stdenv.mkDerivation {
  pname = "gatekeeper";
  version = "1.0.5";

  buildInputs = [ upstream-gatekeeper ];

  dontUnpack = true;

  installPhase = ''
    mkdir -p $out/lib/security/
    cp ${upstream-gatekeeper}/lib/security/pam_jit_pg.so $out/lib/security/pam_jit_pg.so
  '';
}
