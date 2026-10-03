let

  generic =
    # adapted from the nixpkgs postgresql package
    # dependencies
    {
      stdenv,
      lib,
      fetchurl,
      makeWrapper,
      glibc,
      zlib,
      readline,
      openssl,
      icu75,
      lz4,
      zstd,
      systemd,
      libossp_uuid,
      pkg-config,
      libxml2,
      tzdata,
      libkrb5,
      replaceVars,
      darwin,
      linux-pam,
      #orioledb specific
      perl,
      bison,
      flex,
      docbook_xsl,
      docbook_xml_dtd_45,
      docbook_xsl_ns,
      libxslt,

      # This is important to obtain a version of `libpq` that does not depend on systemd.
      systemdSupport ? lib.meta.availableOn stdenv.hostPlatform systemd && !stdenv.hostPlatform.isStatic,
      enableSystemd ? null,
      gssSupport ? with stdenv.hostPlatform; !isWindows && !isStatic,

      # Portable build variant - disables hardcoded system paths
      portable ? false,

      # for postgresql.pkgs
      self,
      newScope,
      buildEnv,

      # source specification
      version,
      hash,
      revision ? null,
      muslPatches ? { },

      # for tests
      testers,

      # PL/Python
      pythonSupport ? false,
      python3,

      # detection of crypt fails when using llvm stdenv, so we add it manually
      # for <13 (where it got removed: https://github.com/postgres/postgres/commit/c45643d618e35ec2fe91438df15abd4f3c0d85ca)
      libxcrypt,

      isOrioleDB ? (builtins.match "[0-9][0-9]_.*" version) != null,
    }@args:
    let
      atLeast = lib.versionAtLeast version;
      olderThan = lib.versionOlder version;
      lz4Enabled = atLeast "14";
      zstdEnabled = atLeast "15";

      systemdSupport' =
        if enableSystemd == null then
          systemdSupport
        else
          (lib.warn "postgresql: argument enableSystemd is deprecated, please use systemdSupport instead." enableSystemd);

      pname = "postgresql";
    in
    stdenv.mkDerivation (finalAttrs: {
      inherit version pname;

      src =
        if isOrioleDB then
          if revision != null then
            fetchurl {
              url = "https://github.com/orioledb/postgres/archive/${revision}.tar.gz";
              inherit hash;
            }
          else
            fetchurl {
              url = "https://github.com/orioledb/postgres/archive/refs/tags/patches${version}.tar.gz";
              inherit hash;
            }
        else
          fetchurl {
            url = "mirror://postgresql/source/v${version}/${pname}-${version}.tar.bz2";
            inherit hash;
          };

      # The 'pie' hardening flag has been removed in favor of enabling PIE by default in compilers and should no longer be used.
      # hardeningEnable = lib.optionals (!stdenv.cc.isClang) [ "pie" ];

      outputs = [
        "out"
        "lib"
      ];
      setOutputFlags = false; # $out retains configureFlags :-/

      buildInputs = [
        zlib
        readline
        openssl
        (libxml2.override { python3 = python3; })
        # Pin ICU to version 75 to maintain collation version 153.120
        # This prevents collation mismatch warnings when upgrading nixpkgs
        icu75
      ]
      ++ lib.optionals (olderThan "13") [ libxcrypt ]
      ++ lib.optionals lz4Enabled [ lz4 ]
      ++ lib.optionals zstdEnabled [ zstd ]
      ++ lib.optionals systemdSupport' [ systemd ]
      ++ lib.optionals pythonSupport [ python3 ]
      ++ lib.optionals gssSupport [ libkrb5 ]
      ++ lib.optionals stdenv.isLinux [ linux-pam ]
      ++ lib.optionals (!stdenv.isDarwin) [ libossp_uuid ];

      nativeBuildInputs = [
        makeWrapper
        pkg-config
      ]
      # Build tools for PG17+ and OrioleDB - these are NOT runtime dependencies
      ++ lib.optionals (isOrioleDB || (lib.versionAtLeast version "17")) [
        perl
        bison
        flex
        docbook_xsl
        docbook_xml_dtd_45
        docbook_xsl_ns
        libxslt
      ];

      enableParallelBuilding = true;

      separateDebugInfo = true;
      __structuredAttrs = true;

      buildFlags = [ "world-bin" ];

      # Makes cross-compiling work when xml2-config can't be executed on the host.
      # Fixed upstream in https://github.com/postgres/postgres/commit/0bc8cebdb889368abdf224aeac8bc197fe4c9ae6
      env.NIX_CFLAGS_COMPILE = lib.optionalString (olderThan "13") "-I${libxml2.dev}/include/libxml2";

      configureFlags = [
        "--with-openssl"
        "--with-libxml"
        "--with-icu"
        "--sysconfdir=/etc"
        "--libdir=$(lib)/lib"
        "--enable-debug"
        (lib.optionalString systemdSupport' "--with-systemd")
        (if stdenv.isDarwin then "--with-uuid=e2fs" else "--with-ossp-uuid")
      ]
      ++ lib.optionals (!portable) [ "--with-system-tzdata=${tzdata}/share/zoneinfo" ]
      ++ lib.optionals lz4Enabled [ "--with-lz4" ]
      ++ lib.optionals zstdEnabled [ "--with-zstd" ]
      ++ lib.optionals gssSupport [ "--with-gssapi" ]
      ++ lib.optionals pythonSupport [ "--with-python" ]
      ++ lib.optionals stdenv.isLinux [ "--with-pam" ];

      patches = [
        (
          if atLeast "16" then
            ./patches/relative-to-symlinks-16+.patch
          else
            ./patches/relative-to-symlinks.patch
        )
        ./patches/less-is-more.patch
        ./patches/paths-for-split-outputs.patch
        ./patches/specify_pkglibdir_at_runtime.patch
        ./patches/paths-with-postgresql-suffix.patch
      ]
      ++ lib.optionals (!portable) [
        (replaceVars ./patches/locale-binary-path.patch {
          locale = "${if stdenv.isDarwin then darwin.adv_cmds else lib.getBin stdenv.cc.libc}/bin/locale";
        })
      ]
      ++ lib.optionals stdenv.hostPlatform.isMusl (
        # Using fetchurl instead of fetchpatch on purpose: https://github.com/NixOS/nixpkgs/issues/240141
        map fetchurl (lib.attrValues muslPatches)
      )
      ++ lib.optionals stdenv.isLinux [
        (if atLeast "13" then ./patches/socketdir-in-run-13+.patch else ./patches/socketdir-in-run.patch)
      ];

      installTargets = [ "install-world-bin" ];

      postPatch = ''
        # Hardcode the path to pgxs so pg_config returns the path in $out
        substituteInPlace "src/common/config_info.c" --subst-var out
      '';

      postInstall = ''
        moveToOutput "lib/pgxs" "$out" # looks strange, but not deleting it
        moveToOutput "lib/libpgcommon*.a" "$out"
        moveToOutput "lib/libpgport*.a" "$out"
        moveToOutput "lib/libecpg*" "$out"

        # Prevent a retained dependency on gcc-wrapper.
        substituteInPlace "$out/lib/pgxs/src/Makefile.global" --replace ${stdenv.cc}/bin/ld ld

        if [ -z "''${dontDisableStatic:-}" ]; then
          # Remove static libraries in case dynamic are available.
          for i in $out/lib/*.a $lib/lib/*.a; do
            name="$(basename "$i")"
            ext="${stdenv.hostPlatform.extensions.sharedLibrary}"
            if [ -e "$lib/lib/''${name%.a}$ext" ] || [ -e "''${i%.a}$ext" ]; then
              rm "$i"
            fi
          done
        fi
      '';

      postFixup =
        lib.optionalString (!portable && !stdenv.isDarwin && stdenv.hostPlatform.libc == "glibc")
          ''
            # initdb needs access to "locale" command from glibc.
            wrapProgram $out/bin/initdb --prefix PATH ":" ${glibc.bin}/bin
          '';

      doCheck = !stdenv.isDarwin;
      # autodetection doesn't seem to able to find this, but it's there.
      checkTarget = "check";

      disallowedReferences = [ stdenv.cc ];

      passthru =
        let
          this = self.callPackage generic args;
        in
        {
          psqlSchema = lib.versions.major version;
          inherit revision;

          dlSuffix = if olderThan "16" then ".so" else stdenv.hostPlatform.extensions.sharedLibrary;
          inherit isOrioleDB;

          patchset =
            if isOrioleDB then
              if revision != null then revision else builtins.elemAt (builtins.split "_" version) 2
            else
              null;

          pkgs =
            let
              scope = {
                postgresql = this;
                stdenv = stdenv;
              };
              newSelf = self // scope;
              newSuper = {
                callPackage = newScope (scope // this.pkgs);
              };
            in
            import ./ext newSelf newSuper;

          withPackages = postgresqlWithPackages {
            inherit makeWrapper buildEnv;
            postgresql = this;
          } this.pkgs;

          tests = {
            postgresql-wal-receiver = import ../../../../nixos/tests/postgresql-wal-receiver.nix {
              inherit (stdenv.hostPlatform) system;
              pkgs = self;
              package = this;
            };
            pkg-config = testers.testMetaPkgConfig finalAttrs.finalPackage;
          };
        };

      meta = with lib; {
        homepage = "https://www.postgresql.org";
        description = "Powerful, open source object-relational database system";
        license = licenses.postgresql;
        changelog = "https://www.postgresql.org/docs/release/${finalAttrs.version}/";
        teams = [ ];
        pkgConfigModules = [
          "libecpg"
          "libecpg_compat"
          "libpgtypes"
          "libpq"
        ];
        platforms = platforms.unix;
        inherit isOrioleDB;
      };
    });

  postgresqlWithPackages =
    {
      postgresql,
      makeWrapper,
      buildEnv,
    }:
    pkgs: f:
    buildEnv {
      name = "postgresql-and-plugins-${postgresql.version}";
      paths = f pkgs ++ [
        postgresql
        postgresql.lib
        #TODO RM postgresql.man   # in case user installs this into environment
      ];
      nativeBuildInputs = [ makeWrapper ];

      # We include /bin to ensure the $out/bin directory is created, which is
      # needed because we'll be removing the files from that directory in postBuild
      # below. See #22653
      pathsToLink = [
        "/"
        "/bin"
      ];

      # Note: the duplication of executables is about 4MB size.
      # So a nicer solution was patching postgresql to allow setting the
      # libdir explicitly.
      postBuild = ''
        mkdir -p $out/bin
        rm $out/bin/{pg_config,postgres,pg_ctl}
        cp --target-directory=$out/bin ${postgresql}/bin/{postgres,pg_config,pg_ctl}
        wrapProgram $out/bin/postgres --set NIX_PGLIBDIR $out/lib
      '';

      passthru = {
        inherit (postgresql)
          version
          revision
          patchset
          psqlSchema
          isOrioleDB
          ;
      };
    };
in
generic
# passed by <major>.nix
# versionArgs:
# # passed by default.nix
# { self, ... } @defaultArgs:
# self.callPackage generic (defaultArgs // versionArgs)
