{
  callPackage,
  pkgs,
  rustVersion,
  pgrxVersion,
  makeRustPlatform,
  rust-bin,
  stdenv,
}:
let
  inherit ((callPackage ./default.nix { inherit rustVersion; })) mkCargoPgrx;

  # TODO: remove once nixpkgs is bumped past NixOS/nixpkgs#512735
  rustPlatform = import ./fix-cargo.nix { inherit pkgs; } (makeRustPlatform {
    cargo = rust-bin.stable.${rustVersion}.default;
    rustc = rust-bin.stable.${rustVersion}.default;
  });

  versions = builtins.fromJSON (builtins.readFile ./versions.json);

  cargo-pgrx =
    let
      pgrx =
        versions.${pgrxVersion}
          or (throw "Unsupported pgrx version ${pgrxVersion}. Available versions: ${builtins.toString (builtins.attrNames versions)}. Change 'nix/cargo-pgrx/versions.json' to add support for new versions.");
      mapping = {
        inherit (pgrx) hash;
        cargoHash =
          pgrx.rust."${rustVersion}".cargoHash
            or (throw "Unsupported rust version ${rustVersion} for pgrx version ${pgrxVersion}. Available Rust versions: ${builtins.toString (builtins.attrNames pgrx.rust)}. Change 'nix/cargo-pgrx/versions.json' to add support for new versions.");
      };
    in
    mkCargoPgrx {
      inherit (mapping) hash cargoHash;
      version = pgrxVersion;
    };

  bindgenHook =
    # Fix bindgen error on aarch64-linux for versions using pgrx with bindgen 0.68.1
    # This affects pgrx 0.6.1 through 0.11.2 which have issues with ARM NEON vector ABI
    if (builtins.compareVersions "0.11.3" pgrxVersion > 0) then
      let
        nixos2211 = (
          import (builtins.fetchTarball {
            url = "https://channels.nixos.org/nixos-22.11/nixexprs.tar.xz";
            sha256 = "1j7h75a9hwkkm97jicky5rhvzkdwxsv5v46473rl6agvq2sj97y1";
          }) { inherit (stdenv.hostPlatform) system; }
        );
      in
      rustPlatform.bindgenHook.overrideAttrs {
        libclang = nixos2211.clang.cc.lib;
        clang = nixos2211.clang;
      }
    else
      rustPlatform.bindgenHook;
in
callPackage ./buildPgrxExtension.nix {
  inherit rustPlatform;
  inherit cargo-pgrx;
  defaultBindgenHook = bindgenHook;
}
