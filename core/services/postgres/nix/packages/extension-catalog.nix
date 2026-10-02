# Multi version extension catalog and update tools.
{
  perSystem =
    {
      pkgs,
      lib,
      self',
      ...
    }:
    let
      # Mirror a per-version package, adding unversioned control/library names
      # only where missing — packages that already ship generic names (e.g.
      # postgis and its `-3` convention) pass through untouched.
      mkGenericVersion =
        leanPkg:
        pkgs.runCommand "${leanPkg.pname}-${leanPkg.version}-generic" { } ''
          set -euo pipefail
          shopt -s nullglob
          mkdir -p "$out/lib" "$out/share/postgresql/extension"
          ext="$out/share/postgresql/extension"

          for f in ${leanPkg}/lib/*; do ln -s "$f" "$out/lib/$(basename "$f")"; done
          for f in ${leanPkg}/share/postgresql/extension/*; do ln -s "$f" "$ext/$(basename "$f")"; done

          # <name>.control with default_version, from <name>--<version>.control
          for cf in "$ext"/*--*.control; do
            b=$(basename "$cf")
            n=''${b%%--*}
            v=''${b#*--}; v=''${v%.control}
            [[ -e "$ext/$n.control" ]] && continue
            { echo "default_version = '$v'"; cat "$cf"; } > "$ext/$n.control"
          done

          # <base>.so -> <base>-<version>.so
          for f in "$out"/lib/*-[0-9]*; do
            b=$(basename "$f")
            suffix=.''${b##*.}
            core=''${b%.*}
            base=''${core%-[0-9]*}
            [[ "$base" != "$core" ]] || continue
            gen=$base$suffix
            [[ -e "$out/lib/$gen" ]] || ln -sfn "$b" "$out/lib/$gen"
          done

          # Sanity check. No generic control is fine only for preload-only
          # modules (e.g. pg-safeupdate), which still ship a library.
          generic=0
          for c in "$ext"/*.control; do
            case "$(basename "$c")" in
              *--*) ;;
              *) generic=$((generic + 1)) ;;
            esac
          done
          libs=$(ls -A "$out/lib" 2>/dev/null | wc -l)
          if ((generic == 0)) && ((libs == 0)); then
            echo "extension-catalog: empty wrapper for ${leanPkg.pname} (no control, no lib)" >&2
            exit 1
          fi
        '';

      wrappersFor =
        extsSet:
        lib.mapAttrs (_: drv: lib.mapAttrs (_: mkGenericVersion) drv.perVersion) (
          lib.filterAttrs (_: drv: lib.isDerivation drv && drv ? perVersion) extsSet
        );

      # Make catalog json from a set of wrappers: { <ext>: { <version>: <path> } }
      # Keyed on each wrapper's actual default_version, not the nix attr name,
      # which can differ (pgsql-http "1.5.0" builds extversion "1.5").
      mkCatalogFile =
        wrappers:
        pkgs.runCommand "pg-extensions-catalog"
          {
            paths = map toString (lib.concatMap lib.attrValues (lib.attrValues wrappers));
            nativeBuildInputs = [ pkgs.jq ];
            # Without this the literal wrapper paths in the JSON would pull
            # every wrapper's closure into the catalog's runtime closure.
            __structuredAttrs = true;
            unsafeDiscardReferences.out = true;
          }
          ''
            set -euo pipefail
            obj='{}'
            for path in "''${paths[@]}"; do
              for ctrl in "$path"/share/postgresql/extension/*.control; do
                base=$(basename "$ctrl")
                case "$base" in *--*) continue ;; esac
                name=''${base%.control}
                ver=$(sed -n "s/^default_version = '\(.*\)'.*/\1/p" "$ctrl" | head -1)
                [[ -n "$ver" ]] || { echo "no default_version in $ctrl" >&2; exit 1; }
                obj=$(printf '%s' "$obj" | jq --arg e "$name" --arg v "$ver" --arg p "$path" '.[$e][$v] = $p')
              done
            done
            mkdir -p "$out/share"
            printf '%s\n' "$obj" | jq -S . > "$out/share/pg-extensions-catalog.json"
          '';

      # Multi version extensions as attrsets: { <major> = { <ext> = { <version> = drv; }; }; }
      perMajor = lib.genAttrs [ "15" "17" "orioledb-17" ] (
        major: wrappersFor self'.legacyPackages."psql_${major}".exts
      );

      # Catalog json plus bin/site-extensions-{resolve,update} that use it by default.
      catalogs = lib.mapAttrs' (
        major: wrappers:
        lib.nameValuePair "site-extensions-catalog-${major}" (
          pkgs.runCommand "site-extensions-catalog" { nativeBuildInputs = [ pkgs.makeWrapper ]; } ''
            mkdir -p "$out/share" "$out/bin"
            ln -s ${mkCatalogFile wrappers}/share/pg-extensions-catalog.json "$out/share/"
            makeWrapper ${self'.packages.site-extensions-resolve}/bin/site-extensions-resolve \
              "$out/bin/site-extensions-resolve" \
              --set PG_EXTENSIONS_CATALOG "$out/share/pg-extensions-catalog.json"
            makeWrapper ${self'.packages.site-extensions-update}/bin/site-extensions-update \
              "$out/bin/site-extensions-update" \
              --set PG_EXTENSIONS_CATALOG "$out/share/pg-extensions-catalog.json"
          ''
        )
      ) perMajor;
    in
    {
      packages = catalogs // {
        # Takes manifest json as argument. Format: {<ext>: <version>}.
        # Prints nix-store paths of the resolved extensions, one per line.
        # Does not download or install.
        site-extensions-resolve = pkgs.writeShellApplication {
          name = "site-extensions-resolve";
          runtimeInputs = [
            pkgs.coreutils
            pkgs.jq
          ];
          text = ''
            : "''${PG_EXTENSIONS_CATALOG:?PG_EXTENSIONS_CATALOG must point at a pg-extensions-catalog.json}"
            manifest="''${1:?Usage: $0 path-to/pg-extensions.json}"
            jq -r 'to_entries[] | "\(.key)=\(.value)"' "$manifest" | while IFS='=' read -r name version; do
              [ -n "$name" ] || { echo "ERROR: empty extension name in $manifest" >&2; exit 1; }
              jq -er --arg n "$name" --arg v "$version" \
                '.[$n][$v] // error("\($n)=\($v) not in catalog")' "$PG_EXTENSIONS_CATALOG"
            done | sort -u
          '';
        };

        # Takes manifest json as argument.
        # Downloads paths and installs them as an env into the profile, replacing all existing ones.
        site-extensions-update = pkgs.writeShellApplication {
          name = "site-extensions-update";
          runtimeInputs = [
            self'.packages.site-extensions-resolve
            pkgs.nix
          ];
          text = ''
            manifest="''${1:?Usage: $0 path-to/pg-extensions.json}"
            profile="''${NIX_PROFILE:-/nix/var/nix/profiles/site-extensions}"
            readarray -t paths < <(site-extensions-resolve "$manifest")
            nix-store -r --option stalled-download-timeout 120 "''${paths[@]}" >/dev/null
            nix-env --profile "$profile" --install "''${paths[@]}" --remove-all
          '';
        };
      };
      legacyPackages = catalogs;
    };
}
