# workaround: crates.io blocks python-requests' default UA (nixpkgs#512735)
# TODO: remove once nixpkgs pin includes that fix
{ pkgs }:
rustPlatform:
let
  fixedUtilBin = rustPlatform.callPackage (
    { writers, python3Packages }:
    writers.writePython3Bin "fetch-cargo-vendor-util"
      {
        libraries =
          with python3Packages;
          [
            requests
            tomli-w
          ]
          ++ requests.optional-dependencies.socks;
        flakeIgnore = [ "E501" ];
      }
      (
        builtins.readFile (
          pkgs.fetchurl {
            url = "https://raw.githubusercontent.com/NixOS/nixpkgs/941b631956516306effaed1641bd00f2ab2e570b/pkgs/build-support/rust/fetch-cargo-vendor-util-v2.py";
            hash = "sha256-hnL0hh8vFgMBXV8kDDezRV40+CHpwtSVlzG0dyQpZXg=";
          }
        )
      )
  ) { };
in
rustPlatform.overrideScope (
  _final: prev: {
    fetchCargoVendor =
      args:
      (prev.fetchCargoVendor args).overrideAttrs (old: {
        vendorStaging = old.vendorStaging.overrideAttrs (oldStaging: {
          nativeBuildInputs = map (
            x: if (x.pname or x.name or "") == "fetch-cargo-vendor-util" then fixedUtilBin else x
          ) oldStaging.nativeBuildInputs;
        });
      });
    importCargoLock =
      args:
      let
        orig = prev.importCargoLock (
          args
          // {
            extraRegistries = {
              "https://github.com/rust-lang/crates.io-index" = "https://static.crates.io/crates";
            }
            // (args.extraRegistries or { });
          }
        );
      in
      # strip the duplicate crates-io source stanza extraRegistries adds, or cargo metadata breaks
      pkgs.runCommand orig.name { } ''
        cp -r ${orig} $out
        chmod -R u+w $out
        sed -i '\|\[source\."https://github.com/rust-lang/crates.io-index"\]|,+2d' $out/.cargo/config.toml
      '';
  }
)
