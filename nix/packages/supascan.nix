{ pkgs, lib, ... }:
let
  # Package GOSS - server validation spec runner
  goss = pkgs.buildGoModule rec {
    pname = "goss";
    version = "0.4.8";
    src = pkgs.fetchFromGitHub {
      owner = "goss-org";
      repo = "goss";
      rev = "v${version}";
      hash = "sha256-xabGzCTzWwT8568xg6sdlE32OYPXlG9Fei0DoyAoXgo=";
    };
    vendorHash = "sha256-BPW4nC9gxDbyhA5UOfFAtOIusNvwJ7pQiprZsqTiak0=";
  };

  # Audit specifications bundled as a package
  auditSpecs = pkgs.stdenv.mkDerivation {
    name = "supascan-specs";
    src = ../../audit-specs;
    installPhase = ''
      mkdir -p $out/share/supascan
      cp -r * $out/share/supascan/
    '';
  };

  # Main supascan CLI - consolidated tool for baseline generation and validation
  supascan = pkgs.buildGoModule {
    pname = "supascan";
    version = "1.0.0";

    src = ./supascan;

    vendorHash = "sha256-1hJvahGjU9ts9SEn/SPZLhT/rPm51TRn+77swAsefIM=";

    subPackages = [ "cmd/supascan" ];

    # Disable CGO to avoid Darwin framework dependencies
    env.CGO_ENABLED = "0";

    ldflags = [
      "-s"
      "-w"
      "-X main.version=1.0.0"
    ];

    # supascan needs goss at runtime for validation
    nativeBuildInputs = [ pkgs.makeWrapper ];

    postInstall = ''
      wrapProgram $out/bin/supascan \
        --prefix PATH : ${goss}/bin
    '';

    doCheck = true;
    checkPhase = ''
      go test -v ./...
    '';

    meta = with lib; {
      description = "Supabase system scanner and validator - generates and validates baseline specs";
      license = licenses.asl20;
      platforms = platforms.linux ++ platforms.darwin;
    };
  };
in
{
  inherit goss supascan;
  supascan-specs = auditSpecs;
}
