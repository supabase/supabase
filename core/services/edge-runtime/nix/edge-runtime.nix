{
  lib,
  stdenv,
  rustPlatform,
  openblas,
  onnxruntime,
  pkg-config,
  patchelf,
  curl,
  fetchurl,
  cmake,
  openssl,
  zstd,
}:
let
  system = stdenv.hostPlatform.system;

  v8Artifacts = {
    "aarch64-darwin" = {
      archive = {
        url = "https://github.com/supabase/rusty_v8/releases/download/v130.0.7/librusty_v8_release_aarch64-apple-darwin.a.gz";
        sha256 = "sha256-VYWg+9WekcHBJWEq49eAAVpc6g/PPaoZDm/j2DKNQLY=";
      };
      binding = {
        url = "https://github.com/supabase/rusty_v8/releases/download/v130.0.7/src_binding_release_aarch64-apple-darwin.rs";
        sha256 = "sha256-ytcUCd4V1MQkinakmT3rJsdow1RLVWrGqtMjava4BaU=";
      };
    };

    # TODO: Missing "x86_64-darwin" supabase/rusty_v8
    #"x86_64-darwin" = {
    #  archive = {
    #    url = "https://github.com/supabase/rusty_v8/releases/download/v130.0.7/src_binding_release_x86_64-apple-darwin.rs";
    #    sha256 = "sha256-VYWg+9WekcHBJWEq49eAAVpc6g/PPaoZDm/j2DKNQLY=";
    #  };
    #  binding = {
    #    url = "https://github.com/supabase/rusty_v8/releases/download/v130.0.7/src_binding_release_x86_64-apple-darwin.rs";
    #    sha256 = lib.fakeHash;
    #  };
    #};

    "aarch64-linux" = {
      archive = {
        url = "https://github.com/supabase/rusty_v8/releases/download/v130.0.7/librusty_v8_release_aarch64-unknown-linux-gnu.a.gz";
        sha256 = "sha256-8YupKkWyFn8oZ+RbEzcigdgwvIRjzE5GW7OSnmkIYHU=";
      };
      binding = {
        url = "https://github.com/supabase/rusty_v8/releases/download/v130.0.7/src_binding_release_aarch64-unknown-linux-gnu.rs";
        sha256 = "sha256-sq8JII71BvnI43jNMm5yCj8WgGQ1K9n7AcOCJsfklRQ=";
      };
    };
    "x86_64-linux" = {
      archive = {
        url = "https://github.com/supabase/rusty_v8/releases/download/v130.0.7-patch.1/librusty_v8_release_x86_64-unknown-linux-gnu.a.gz";
        sha256 = "sha256-4tF7bHXad7K1ADwv3r718HUawEixSEOR5fNoBYJkFsA=";
      };
      binding = {
        url = "https://github.com/supabase/rusty_v8/releases/download/v130.0.7/src_binding_release_x86_64-unknown-linux-gnu.rs";
        sha256 = "sha256-sq8JII71BvnI43jNMm5yCj8WgGQ1K9n7AcOCJsfklRQ=";
      };
    };
  };

  v8 = v8Artifacts.${system} or (throw "Unsupported system: ${system}");
  v8Archive = fetchurl v8.archive;
  v8Binding = fetchurl v8.binding;

  build_step = rustPlatform.buildRustPackage (finalAttrs: {
    pname = "edge_runtime_build";
    version = "v1.73.3";
    src = ../.;
    nativeBuildInputs = [ pkg-config curl cmake ];
    buildInputs = [ openblas onnxruntime openssl zstd ];
    propagatedBuildInputs = [ onnxruntime ];
    doCheck = false;

    cargoLock = {
      lockFile = ../Cargo.lock;
      outputHashes = {
        "deno_core-0.324.0" = "sha256-WCEUKkCnDQ3VHILsf1hAnz1L1wlr9prTMgHKnzJ5cXc=";
        "v8-130.0.7" = "sha256-0mcHKmIECFX7yTTOh0yEjyCMXCkwxL5LS1TkuO8GTlA=";
        "eszip-0.80.0" = "sha256-KILUDqMpMbR9WuB7gE0a4kiRECVB2dTiOW++3sz2mBU=";
      };
    };

    RUSTY_V8_MIRROR="null";
    RUST_BACKTRACE="full";
    RUSTFLAGS = "-C debuginfo=0";

    RUSTY_V8_ARCHIVE = v8Archive;
    RUSTY_V8_SRC_BINDING_PATH = v8Binding;
    DYLD_LIBRARY_PATH = "${onnxruntime}/lib";
  });
in
stdenv.mkDerivation {
  name = "edge_runtime_portable";
  version = "0.1.0";
  dontUnpack = true;
  dontPatchShebangs = true;
  nativeBuildInputs = lib.optionals stdenv.isLinux [ patchelf ];

buildPhase = ''
  mkdir -p $out/bin $out/lib

  binaries="edge-runtime"

  get_deps() {
    if [ "$(uname)" = "Darwin" ]; then
      otool -L "$1" 2>/dev/null | grep /nix/store | awk '{print $1}'
    else
      ldd "$1" 2>/dev/null | grep /nix/store | awk '{print $3}'
    fi
  }

  # Helper function to check if a library should be excluded (system libraries)
  should_exclude() {
    local libname="$1"
    # Exclude core system libraries that must come from the host system
    # These libraries are tightly coupled to the kernel and system configuration
    case "$libname" in
      libc.so*|libc-*.so*|ld-linux*.so*|libdl.so*|libpthread.so*|libm.so*|libresolv.so*|librt.so*)
        return 0  # Exclude
        ;;
      *)
        return 1  # Include
        ;;
    esac
  }

  # Helper function to get dependencies from a binary based on platform
  # Returns empty string if no dependencies found (which is valid - not an error)
  copy_dep() {
    local dep="$1"
    local libname=$(basename "$dep")
    [ -f "$out/lib/$libname" ] && return  # already copied
    should_exclude "$libname" && return
    [ -f "$dep" ] && cp "$dep" $out/lib/ 2>/dev/null || true
  }

  # Helper function to get the library file pattern based on platform
  get_lib_pattern() {
    if [ "$(uname)" = "Darwin" ]; then
      echo "*.dylib*"
    else
      echo "*.so*"
    fi
  }

  # Copy binaries from cargo build to wrapped style
  for bin in $binaries; do
    cp ${build_step}/bin/$bin $out/bin/.$bin-wrapped 2>/dev/null || true
  done

  # Seed: direct deps of binary + onnxruntime and all its siblings
  for dep in $(get_deps $out/bin/.*-wrapped); do
    copy_dep "$dep"
  done

  # Copy onnxruntime
  lib_pattern=$(get_lib_pattern)
  cp ${onnxruntime}/lib/libonnxruntime$lib_pattern $out/lib/ 2>/dev/null || true

  # Iterative crawl until no new deps appear
  for iteration in {1..5}; do
    before_count=$(ls $out/lib/ | wc -l || echo "0")

    for lib in $out/lib/*; do
      [ -f "$lib" ] || continue
      for dep in $(get_deps "$lib"); do
        copy_dep "$dep"
      done
    done

    after=$(ls $out/lib/ | wc -l)
    echo "Iteration $iteration: $before_count -> $after libs"
    [ "$before_count" -eq "$after" ] && break
  done
'';

installPhase = ''
  # Create wrapper scripts and set up library paths
  for bin in $binaries; do
     if [ -f $out/bin/.$bin-wrapped ]; then
       cat > $out/bin/$bin << 'WRAPPER_EOF'
#!/bin/sh
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LIB_DIR="$SCRIPT_DIR/../lib"

# For Linux, set LD_LIBRARY_PATH to include bundled libraries
if [ "$(uname)" = "Linux" ]; then
  export LD_LIBRARY_PATH="$LIB_DIR''${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
fi

# For macOS, set DYLD_LIBRARY_PATH
if [ "$(uname)" = "Darwin" ]; then
  export DYLD_LIBRARY_PATH="$LIB_DIR''${DYLD_LIBRARY_PATH:+:$DYLD_LIBRARY_PATH}"
fi

exec "$SCRIPT_DIR/.BINNAME-wrapped" "$@"
WRAPPER_EOF
      sed -i "s/BINNAME/$bin/g" $out/bin/$bin
        chmod +x $out/bin/$bin
      fi
      done
'';

  postFixup =
    lib.optionalString stdenv.isLinux ''
      # Determine the correct interpreter path based on architecture
      if [ "$(uname -m)" = "x86_64" ]; then
        INTERP="/lib64/ld-linux-x86-64.so.2"
      elif [ "$(uname -m)" = "aarch64" ]; then
        INTERP="/lib/ld-linux-aarch64.so.1"
      else
        echo "ERROR: Unsupported architecture $(uname -m)"
        exit 1
      fi

      # On Linux, patch binaries to use system interpreter and relative library paths
      # This makes the bundle portable across Linux systems
      for bin in $out/bin/.*-wrapped; do
        if [ -f "$bin" ] && file "$bin" | grep -q ELF; then
          echo "Patching RPATH and interpreter for $bin"
          # Set interpreter to system dynamic linker for portability
          patchelf --set-interpreter "$INTERP" "$bin" 2>/dev/null || true
          # Set RPATH to $ORIGIN/../lib so binaries find libraries relative to their location
          patchelf --set-rpath '$ORIGIN/../lib' "$bin" 2>/dev/null || true
          # Shrink RPATH to remove any unused paths
          patchelf --shrink-rpath "$bin" 2>/dev/null || true
        fi
      done

      # Patch shared libraries to use relative RPATH
      for lib in $out/lib/*.so*; do
        if [ -f "$lib" ] && file "$lib" | grep -q ELF; then
          echo "Patching RPATH for $lib"
          # Set RPATH to $ORIGIN so libraries find other libraries in same directory
          patchelf --set-rpath '$ORIGIN' "$lib" 2>/dev/null || true
          # Shrink RPATH to remove any unused paths
          patchelf --shrink-rpath "$lib" 2>/dev/null || true
        fi
      done
    ''
    + lib.optionalString stdenv.isDarwin ''
      # On macOS, patch binaries to use relative library paths
      # This makes the bundle portable across macOS systems
      for bin in $out/bin/.*-wrapped; do
        if [ -f "$bin" ] && file "$bin" | grep -q "Mach-O"; then
          # Get all dylib dependencies from Nix store
          otool -L "$bin" | grep /nix/store | awk '{print $1}' | while read dep; do
            libname=$(basename "$dep")
            # Check if we have this library in our lib directory
            if [ -f "$out/lib/$libname" ]; then
              echo "Patching $bin: $dep -> @rpath/$libname"
              install_name_tool -change "$dep" "@rpath/$libname" "$bin" 2>/dev/null || true
            fi
          done
          # Add @rpath to look in @executable_path/../lib
          install_name_tool -add_rpath "@executable_path/../lib" "$bin" 2>/dev/null || true
        fi
      done

      # Patch dylibs to use @rpath for their dependencies
      for lib in $out/lib/*.dylib*; do
        if [ -f "$lib" ] && file "$lib" | grep -q "Mach-O"; then
          # First, fix the library's own ID to use @rpath
          libname=$(basename "$lib")
          install_name_tool -id "@rpath/$libname" "$lib" 2>/dev/null || true

          # Add @rpath to the library itself so it can find other libraries
          install_name_tool -add_rpath "@loader_path" "$lib" 2>/dev/null || true

          # Then fix references to other libraries
          otool -L "$lib" | grep /nix/store | awk '{print $1}' | while read dep; do
            deplibname=$(basename "$dep")
            if [ -f "$out/lib/$deplibname" ]; then
              echo "Patching $lib: $dep -> @rpath/$deplibname"
              install_name_tool -change "$dep" "@rpath/$deplibname" "$lib" 2>/dev/null || true
            fi
          done
        fi
      done
    '';

  meta = {
    description = "Supabae Edge Runtime for the Supabase CLI";

    license = lib.licenses.mit;
    platforms = lib.platforms.unix;
    maintainers = [ ];
  };
}
