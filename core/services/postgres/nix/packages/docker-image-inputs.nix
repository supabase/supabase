{
  lib,
  stdenv,
  writeShellApplication,
  writeText,
  jq,
  # Slim packages used in Docker images
  psql_15_slim,
  psql_17_slim,
  psql_orioledb-17_slim,
  # Groonga is also installed in images
  supabase-groonga,
}:

let
  root = ../..;

  # Bundle all source files that are copied into Docker images
  dockerSources = stdenv.mkDerivation {
    name = "docker-image-sources";
    src = lib.fileset.toSource {
      inherit root;
      fileset = lib.fileset.unions [
        # Dockerfiles
        (root + "/Dockerfile-15")
        (root + "/Dockerfile-17")
        (root + "/Dockerfile-orioledb-17")
        (root + "/Dockerfile-multigres")

        # PostgreSQL configuration files (copied into images)
        (root + "/ansible/files/postgresql_config")
        (root + "/ansible/files/pgbouncer_config")
        (root + "/ansible/files/stat_extension.sql")
        (root + "/ansible/files/postgresql_extension_custom_scripts")
        (root + "/ansible/files/walg_helper_scripts")

        # pgctld config templates + wrapper script (copied into the multigres image)
        (root + "/docker/pgctld")

        # Database migrations (copied into images)
        (root + "/migrations/db")
      ];
    };

    phases = [
      "unpackPhase"
      "installPhase"
    ];
    installPhase = ''
      mkdir -p $out
      cp -r . $out/
    '';
  };

  # Create a manifest of all package store paths
  # This ensures the hash changes when any package changes
  packageManifest = writeText "docker-image-packages-manifest" ''
    # Slim PostgreSQL packages installed in Docker images
    psql_15_slim=${psql_15_slim}
    psql_17_slim=${psql_17_slim}
    psql_orioledb-17_slim=${psql_orioledb-17_slim}

    # Groonga (installed in all images)
    supabase-groonga=${supabase-groonga}
  '';

  # Combined derivation that depends on both sources and packages
  dockerImageInputs = stdenv.mkDerivation {
    name = "docker-image-inputs";

    # No source needed - we just create a manifest
    dontUnpack = true;

    # These are the actual dependencies that affect the hash
    buildInputs = [
      dockerSources
      psql_15_slim
      psql_17_slim
      psql_orioledb-17_slim
      supabase-groonga
    ];

    installPhase = ''
      mkdir -p $out

      # Include source files reference
      echo "sources=${dockerSources}" > $out/manifest

      # Include package manifest
      cat ${packageManifest} >> $out/manifest

      # Create a combined hash from all inputs
      echo "" >> $out/manifest
      echo "# Combined input paths:" >> $out/manifest
      echo "${dockerSources}" >> $out/manifest
      echo "${psql_15_slim}" >> $out/manifest
      echo "${psql_17_slim}" >> $out/manifest
      echo "${psql_orioledb-17_slim}" >> $out/manifest
      echo "${supabase-groonga}" >> $out/manifest
    '';
  };
in
writeShellApplication {
  name = "docker-image-inputs-hash";

  runtimeInputs = [ jq ];

  text = ''
    set -euo pipefail

    DOCKER_INPUTS="${dockerImageInputs}"
    INPUT_HASH=$(basename "$DOCKER_INPUTS" | cut -d- -f1)

    case "''${1:-hash}" in
      hash)
        echo "$INPUT_HASH"
        ;;
      path)
        echo "$DOCKER_INPUTS"
        ;;
      manifest)
        cat "$DOCKER_INPUTS/manifest"
        ;;
      json)
        jq -n \
          --arg hash "$INPUT_HASH" \
          --arg path "$DOCKER_INPUTS" \
          --arg sources "${dockerSources}" \
          --arg psql_15_slim "${psql_15_slim}" \
          --arg psql_17_slim "${psql_17_slim}" \
          --arg psql_orioledb_17_slim "${psql_orioledb-17_slim}" \
          --arg supabase_groonga "${supabase-groonga}" \
          '{
            hash: $hash,
            path: $path,
            sources: $sources,
            packages: {
              psql_15_slim: $psql_15_slim,
              psql_17_slim: $psql_17_slim,
              "psql_orioledb-17_slim": $psql_orioledb_17_slim,
              "supabase-groonga": $supabase_groonga
            }
          }'
        ;;
      *)
        echo "Usage: docker-image-inputs-hash [hash|path|manifest|json]" >&2
        exit 1
        ;;
    esac
  '';

  meta = {
    description = "Get the content hash of all Docker image inputs";
    longDescription = ''
      This package tracks all inputs that affect Docker image builds:
      - Source files: Dockerfiles, configs, migrations
      - Nix packages: psql_*_slim, supabase-groonga

      The hash changes when ANY of these change, including transitive
      dependencies of the Nix packages.

      Usage:
        docker-image-inputs-hash hash      # Get just the hash
        docker-image-inputs-hash path      # Get the Nix store path
        docker-image-inputs-hash manifest  # Show all tracked inputs
        docker-image-inputs-hash json      # Get detailed JSON output
    '';
  };
}
