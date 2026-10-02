{
  lib,
  buildGoModule,
  buildGo126Module,
  fetchFromGitHub,
  brotli,
  libsodium,
  installShellFiles,
}:

let
  walGCommon =
    {
      version,
      vendorHash,
      sha256,
      majorVersion,
      # Go builder to use. Defaults to the nixpkgs default (currently 1.25.5);
      # override when a wal-g release's go.mod demands a newer toolchain than
      # that, since Nix builds run with GOTOOLCHAIN=local and cannot fetch one.
      goBuilder ? buildGoModule,
      # Extra GOEXPERIMENT flags. wal-g 3.x imports encoding/json/v2 directly
      # (internal/uploader.go), which Go 1.25 gates behind GOEXPERIMENT=jsonv2.
      goExperiment ? null,
      # Fetch modules through the Go proxy instead of `go mod vendor`. Needed
      # when deps collide case-insensitively, since a `vendor/` tree then hashes
      # differently on case-sensitive (Linux) vs case-insensitive (Darwin) filesystems.
      proxyVendor ? false,
      patches ? [ ],
    }:
    goBuilder rec {
      pname = "wal-g-${majorVersion}";
      inherit version;

      src = fetchFromGitHub {
        owner = "wal-g";
        repo = "wal-g";
        rev = "v${version}";
        inherit sha256;
      };

      inherit vendorHash patches proxyVendor;

      env = lib.optionalAttrs (goExperiment != null) {
        GOEXPERIMENT = goExperiment;
      };

      nativeBuildInputs = [ installShellFiles ];

      buildInputs = [
        brotli
        libsodium
      ];

      subPackages = [ "main/pg" ];

      tags = [
        "brotli"
        "libsodium"
      ];

      ldflags = [
        "-s"
        "-w"
        "-X github.com/wal-g/wal-g/cmd/pg.walgVersion=${version}"
        "-X github.com/wal-g/wal-g/cmd/pg.gitRevision=${src.rev}"
      ];

      postInstall = ''
        mv $out/bin/pg $out/bin/wal-g-${majorVersion}

        # Create version-specific completions
        mkdir -p $out/share/bash-completion/completions
        $out/bin/wal-g-${majorVersion} completion bash > $out/share/bash-completion/completions/wal-g-${majorVersion}

        mkdir -p $out/share/zsh/site-functions
        $out/bin/wal-g-${majorVersion} completion zsh > $out/share/zsh/site-functions/_wal-g-${majorVersion}

      '';

      meta = with lib; {
        homepage = "https://github.com/wal-g/wal-g";
        license = licenses.asl20;
        description = "Archival restoration tool for PostgreSQL";
        mainProgram = "wal-g-${majorVersion}";
      };
    };
in
{
  # wal-g v2.0.1
  wal-g-2 = walGCommon {
    version = "2.0.1";
    sha256 = "sha256-5mwA55aAHwEFabGZ6c3pi8NLcYofvoe4bb/cFj7NWok=";
    vendorHash = "sha256-BbQuY6r30AkxlCZjY8JizaOrqEBdv7rIQet9KQwYB/g=";
    majorVersion = "2";
  };

  # wal-g v3.0.8 — installed alongside v2 (INDATA-904).
  # OrioleDB support + backward-compat validation; binary is wal-g-3.
  wal-g-3 = walGCommon {
    version = "3.0.9";
    sha256 = "sha256-QTPgJuCuLxlBqa2QAhV91qX4XTQHIvzAQDntchGpxrQ=";
    vendorHash = "sha256-m+X6WIdBjMU88tgwkS46lL6YwyGB0FoO3aCXCAUQzpo=";
    majorVersion = "3";
    goBuilder = buildGo126Module;
    # github.com/Microsoft/go-winio and github.com/microsoft/go-mssqldb differ
    # only in case, so a vendor/ tree cannot hash the same on macOS and Linux.
    proxyVendor = true;
    goExperiment = "jsonv2";
    # Backport wal-g/wal-g#2502: Correctly read OrioleDBOndiskPageHeader
    patches = [ ./wal-g/0001-correctly-read-orioledbondiskpageheader.patch ];
  };
}
