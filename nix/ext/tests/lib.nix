{ self, pkgs }:
let
  inherit (pkgs) lib;
  system = pkgs.pkgsLinux.stdenv.hostPlatform.system;

  expectedVersions = {
    "15" = "15.19";
    "17" = "17.11";
  };

  defaultPort = 5432;

  # Simple getkey script that returns a static hex key for testing
  getkeyScript = pkgs.pkgsLinux.writeShellScript "pgsodium-getkey" ''
    echo "0000000000000000000000000000000000000000000000000000000000000000"
  '';

  # Source paths for ansible config files and migrations
  ansibleConfigDir = builtins.path {
    path = ../../../ansible/files/postgresql_config;
    name = "postgresql-config";
  };
  extensionCustomScriptsDir = builtins.path {
    path = ../../../ansible/files/postgresql_extension_custom_scripts;
    name = "extension-custom-scripts";
  };
  migrationsDir = builtins.path {
    path = ../../../migrations/db;
    name = "migrations-db";
  };
  pgbouncerAuthSchemaSql = builtins.path {
    path = ../../../ansible/files/pgbouncer_config/pgbouncer_auth_schema.sql;
    name = "pgbouncer-auth-schema.sql";
  };
  statExtensionSql = builtins.path {
    path = ../../../ansible/files/stat_extension.sql;
    name = "stat-extension.sql";
  };
  postgresqlSchemaSql = builtins.path {
    path = ../../../nix/tools/postgresql_schema.sql;
    name = "postgresql-schema.sql";
  };

  # Process the ansible config files into a derivation with @dataDir@ placeholders
  processAnsibleConfig =
    { majorVersion }:
    pkgs.pkgsLinux.runCommand "processed-postgresql-config-${majorVersion}" { } ''
      mkdir -p $out/conf.d $out/extension-custom-scripts

      # Copy ansible config files (make writable so we can append/modify later)
      cp ${ansibleConfigDir}/pg_hba.conf.j2 $out/pg_hba.conf
      cp ${ansibleConfigDir}/pg_ident.conf.j2 $out/pg_ident.conf
      chmod u+w $out/pg_hba.conf $out/pg_ident.conf

      # Copy conf.d
      cp -r ${ansibleConfigDir}/conf.d/* $out/conf.d/ || true

      # Copy read-replica config
      cp ${ansibleConfigDir}/custom_read_replica.conf $out/read-replica.conf

      # Copy extension custom scripts
      cp -r ${extensionCustomScriptsDir}/* $out/extension-custom-scripts/

      # Process supautils.conf: substitute extension_custom_scripts_path
      sed "s|supautils.extension_custom_scripts_path = '/etc/postgresql-custom/extension-custom-scripts'|supautils.extension_custom_scripts_path = '@dataDir@/extension-custom-scripts'|" \
        ${ansibleConfigDir}/supautils.conf.j2 > $out/supautils.conf

      # Process postgresql.conf with all required substitutions
      sed \
        -e "1i\\
      include = '@dataDir@/supautils.conf'" \
        -e "\$a\\
      pgsodium.getkey_script = '${getkeyScript}'" \
        -e "\$a\\
      vault.getkey_script = '${getkeyScript}'" \
        -e "s|data_directory = '/var/lib/postgresql/data'|data_directory = '@dataDir@'|" \
        -e "s|hba_file = '/etc/postgresql/pg_hba.conf'|hba_file = '@dataDir@/pg_hba.conf'|" \
        -e "s|ident_file = '/etc/postgresql/pg_ident.conf'|ident_file = '@dataDir@/pg_ident.conf'|" \
        -e "s|include = '/etc/postgresql/logging.conf'|#&|" \
        -e "s|include = '/etc/postgresql-custom/read-replica.conf'|include = '@dataDir@/read-replica.conf'|" \
        -e "\$a\\
      session_preload_libraries = 'supautils'" \
        -e "s|include_dir = '/etc/postgresql-custom/conf.d'|include_dir = '@dataDir@/conf.d'|" \
        -e "\$a\\
      unix_socket_directories = '/run/postgresql'" \
        ${ansibleConfigDir}/postgresql.conf.j2 > $out/postgresql.conf

      # Prepend peer auth lines to pg_hba.conf so local socket auth works in test VMs
      # (tests run as root, psql uses local socket without -h)
      {
        echo "local all supabase_admin peer map=supabase_map"
        echo "local all postgres peer map=supabase_map"
        cat $out/pg_hba.conf
      } > $out/pg_hba.conf.tmp
      mv $out/pg_hba.conf.tmp $out/pg_hba.conf

      # Add ident mappings for root -> supabase_admin and postgres -> supabase_admin
      echo "supabase_map root supabase_admin" >> $out/pg_ident.conf
      echo "supabase_map postgres supabase_admin" >> $out/pg_ident.conf

      # Version-specific adjustments (mirroring run-server.sh.in:250-295)
      ${
        if majorVersion == "17" || majorVersion == "orioledb-17" then
          ''
            # PG 17+: remove timescaledb from shared_preload_libraries
            sed -i 's/ timescaledb,//g' $out/postgresql.conf
            # PG 17+: comment out db_user_namespace (removed in PG 17)
            sed -i 's/db_user_namespace = off/#db_user_namespace = off/g' $out/postgresql.conf
            # PG 17+: remove timescaledb and plv8 from supautils privileged_extensions
            sed -i 's/ timescaledb,//g; s/ plv8,//g;' $out/supautils.conf
          ''
        else
          ""
      }
      ${
        if majorVersion == "orioledb-17" then
          ''
            # OrioleDB: also remove pgjwt from supautils privileged_extensions
            sed -i 's/ pgjwt,//g;' $out/supautils.conf
            # OrioleDB: append orioledb to shared_preload_libraries
            sed -i "s/\(shared_preload_libraries.*\)'\(.*\)$/\1, orioledb'\2/" $out/postgresql.conf
            echo "default_table_access_method = 'orioledb'" >> $out/postgresql.conf
          ''
        else
          ""
      }
    '';

  # Create a NixOS module that provides a full Supabase-like PostgreSQL test environment
  makeSupabaseTestConfig =
    {
      majorVersion,
      postgresPort ? defaultPort,
    }:
    let
      postgresPackage = self.packages.${system}."psql_${majorVersion}/bin";
      groongaPackage = self.packages.${system}.supabase-groonga;
      processedConfig = processAnsibleConfig { inherit majorVersion; };
      dataDir = "/var/lib/postgresql/data";
      port = toString postgresPort;

      # Runs as root: ensure data directory exists with correct ownership
      preStartRootScript = pkgs.pkgsLinux.writeShellScript "postgresql-pre-start-root" ''
        set -euo pipefail
        DATA_DIR="${dataDir}"
        if [ ! -d "$DATA_DIR" ]; then
          mkdir -p -m 0700 "$DATA_DIR"
          chown postgres:postgres "$DATA_DIR"
        fi
      '';

      # Runs as postgres: initdb, config deployment, validation
      initScript = pkgs.pkgsLinux.writeShellScript "postgresql-init" ''
        set -euo pipefail
        DATA_DIR="${dataDir}"

        # Initialize database if it doesn't exist
        if [ ! -f "$DATA_DIR/PG_VERSION" ]; then
          echo "Initializing database at $DATA_DIR"
          ${postgresPackage}/bin/initdb --allow-group-access --data-checksums -U supabase_admin -D "$DATA_DIR"
        fi

        # Deploy processed config files with @dataDir@ substituted
        for f in postgresql.conf pg_hba.conf pg_ident.conf supautils.conf read-replica.conf; do
          sed "s|@dataDir@|$DATA_DIR|g" ${processedConfig}/$f > "$DATA_DIR/$f"
        done

        # Copy conf.d directory
        rm -rf "$DATA_DIR/conf.d"
        cp -r ${processedConfig}/conf.d "$DATA_DIR/conf.d"
        chmod -R u+w "$DATA_DIR/conf.d"

        # Copy extension-custom-scripts directory
        rm -rf "$DATA_DIR/extension-custom-scripts"
        cp -r ${processedConfig}/extension-custom-scripts "$DATA_DIR/extension-custom-scripts"
        chmod -R u+w "$DATA_DIR/extension-custom-scripts"

        # Validate config
        echo "Validating PostgreSQL configuration..."
        ${postgresPackage}/bin/postgres -C shared_preload_libraries -D "$DATA_DIR"
      '';

      dbInitScript = pkgs.pkgsLinux.writeShellScript "supabase-db-init" ''
        set -euo pipefail

        # Wait for PostgreSQL to be ready
        echo "Waiting for PostgreSQL to be ready..."
        for i in $(seq 1 60); do
          if ${postgresPackage}/bin/pg_isready -h localhost -p ${port} -q; then
            echo "PostgreSQL is ready"
            break
          fi
          if [ "$i" -eq 60 ]; then
            echo "PostgreSQL failed to become ready"
            exit 1
          fi
          sleep 1
        done

        PSQL="${postgresPackage}/bin/psql"

        # Create postgres role (matching run-server.sh.in)
        echo "Creating postgres role..."
        $PSQL -h localhost -p ${port} -U supabase_admin -d postgres -c "CREATE ROLE postgres SUPERUSER LOGIN;" || true
        $PSQL -h localhost -p ${port} -U supabase_admin -d postgres -c "ALTER DATABASE postgres OWNER TO postgres;" || true

        # Run init-scripts as postgres user (matching run-server.sh.in)
        for sql in ${migrationsDir}/init-scripts/*.sql; do
          echo "Running init-script: $sql"
          $PSQL -v ON_ERROR_STOP=1 -h localhost -p ${port} -U postgres -f "$sql" postgres
        done

        # Run pgbouncer auth schema
        echo "Running pgbouncer auth schema..."
        $PSQL -v ON_ERROR_STOP=1 -h localhost -p ${port} -U postgres -d postgres -f ${pgbouncerAuthSchemaSql}

        # Run stat extension
        echo "Running stat extension..."
        $PSQL -v ON_ERROR_STOP=1 -h localhost -p ${port} -U postgres -d postgres -f ${statExtensionSql}

        # Run migrations as supabase_admin (matching run-server.sh.in)
        for sql in ${migrationsDir}/migrations/*.sql; do
          echo "Running migration: $sql"
          $PSQL -v ON_ERROR_STOP=1 -h localhost -p ${port} -U supabase_admin -f "$sql" postgres
        done

        # Run postgresql schema
        echo "Running postgresql schema..."
        $PSQL -v ON_ERROR_STOP=1 -h localhost -p ${port} -U supabase_admin -f ${postgresqlSchemaSql} postgres

        echo "Database initialization complete"
      '';
    in
    { ... }:
    {
      # VM resources — sized for nested virtualisation on ephemeral CI runners
      virtualisation.memorySize = 4096;
      virtualisation.cores = 2;

      # System users
      users.users.postgres = {
        isSystemUser = true;
        group = "postgres";
        home = "/var/lib/postgresql";
        createHome = true;
      };
      users.groups.postgres = { };

      # Required directories
      systemd.tmpfiles.rules = [
        "d /var/lib/postgresql 0750 postgres postgres -"
        "d /run/postgresql 0755 postgres postgres -"
      ];

      # Locale
      i18n.defaultLocale = "en_US.UTF-8";

      # Networking
      networking.firewall.allowedTCPPorts = [ postgresPort ];

      # Make PostgreSQL available system-wide
      environment.systemPackages = [ postgresPackage ];

      # PostgreSQL service (custom, bypassing services.postgresql)
      systemd.services.postgresql = {
        description = "PostgreSQL Database Server";
        wantedBy = [ "multi-user.target" ];
        after = [ "network.target" ];

        serviceConfig = {
          Type = "notify";
          User = "postgres";
          Group = "postgres";
          ExecStartPre = [
            ("+" + preStartRootScript)
            initScript
          ];
          ExecStart = "${postgresPackage}/bin/postgres -D ${dataDir}";
          KillMode = "mixed";
          KillSignal = "SIGINT";
          TimeoutStopSec = 90;
          LimitNOFILE = 16384;
        };

        environment = {
          GRN_PLUGINS_DIR = "${groongaPackage}/lib/groonga/plugins";
          LANG = "en_US.UTF-8";
          BLACKSMITH_MIGRATION = "1";
        };
      };

      # Database initialization service (runs init-scripts and migrations)
      systemd.services.supabase-db-init = {
        description = "Supabase Database Initialization";
        wantedBy = [ "multi-user.target" ];
        after = [ "postgresql.service" ];
        requires = [ "postgresql.service" ];

        serviceConfig = {
          Type = "oneshot";
          RemainAfterExit = true;
          User = "root";
          Group = "root";
          ExecStart = dbInitScript;
        };

        environment = {
          LANG = "en_US.UTF-8";
        };
      };
    };

  # Create a specialisation configuration for pg_upgrade from one major version to another
  makeUpgradeSpecialisation =
    {
      fromMajorVersion,
      toMajorVersion,
    }:
    let
      oldPkg = self.packages.${system}."psql_${fromMajorVersion}/bin";
      newPkg = self.packages.${system}."psql_${toMajorVersion}/bin";
      groongaPackage = self.packages.${system}.supabase-groonga;
      oldDataDir = "/var/lib/postgresql/data";
      newDataDir = "/var/lib/postgresql/data-${toMajorVersion}";
      processedNewConfig = processAnsibleConfig { majorVersion = toMajorVersion; };

      migrateScript = pkgs.pkgsLinux.writeShellScript "postgresql-migrate" ''
        set -euo pipefail

        OLD_DATA="${oldDataDir}"
        NEW_DATA="${newDataDir}"

        if [ -d "$NEW_DATA" ]; then
          echo "$NEW_DATA already exists, skipping migration"
          exit 0
        fi

        echo "Starting pg_upgrade from ${fromMajorVersion} to ${toMajorVersion}"

        # Create new data directory (runs as postgres user, so ownership is automatic)
        mkdir -p -m 0700 "$NEW_DATA"

        # Initialize new cluster
        ${newPkg}/bin/initdb --allow-group-access --data-checksums -U supabase_admin -D "$NEW_DATA"

        # Deploy config files to new data directory
        for f in postgresql.conf pg_hba.conf pg_ident.conf supautils.conf read-replica.conf; do
          sed "s|@dataDir@|$NEW_DATA|g" ${processedNewConfig}/$f > "$NEW_DATA/$f"
        done

        # Copy conf.d and extension-custom-scripts
        rm -rf "$NEW_DATA/conf.d"
        cp -r ${processedNewConfig}/conf.d "$NEW_DATA/conf.d"
        chmod -R u+w "$NEW_DATA/conf.d"

        rm -rf "$NEW_DATA/extension-custom-scripts"
        cp -r ${processedNewConfig}/extension-custom-scripts "$NEW_DATA/extension-custom-scripts"
        chmod -R u+w "$NEW_DATA/extension-custom-scripts"

        # Run pg_upgrade
        # Use --username=supabase_admin because that's the bootstrap superuser
        # (from initdb -U supabase_admin) and our pg_ident.conf maps OS user
        # postgres → DB user supabase_admin (not postgres → postgres)
        cd /var/lib/postgresql
        ${newPkg}/bin/pg_upgrade \
          --username supabase_admin \
          --old-datadir "$OLD_DATA" \
          --new-datadir "$NEW_DATA" \
          --old-bindir "${oldPkg}/bin" \
          --new-bindir "${newPkg}/bin" \
          --old-options="-c config_file=$OLD_DATA/postgresql.conf" \
          --new-options="-c config_file=$NEW_DATA/postgresql.conf"

        echo "pg_upgrade completed successfully"
      '';
    in
    {
      # Migration service runs before postgresql
      systemd.services.postgresql-migrate = {
        description = "PostgreSQL Major Version Migration";
        serviceConfig = {
          Type = "oneshot";
          RemainAfterExit = true;
          User = "postgres";
          Group = "postgres";
          ExecStart = migrateScript;
        };
        environment = {
          GRN_PLUGINS_DIR = "${groongaPackage}/lib/groonga/plugins";
          LANG = "en_US.UTF-8";
        };
      };

      # Override postgresql to use new package and new data directory
      systemd.services.postgresql = {
        after = [ "postgresql-migrate.service" ];
        requires = [ "postgresql-migrate.service" ];
        serviceConfig = {
          ExecStart = lib.mkForce "${newPkg}/bin/postgres -D ${newDataDir}";
        };
        environment = {
          GRN_PLUGINS_DIR = lib.mkForce "${groongaPackage}/lib/groonga/plugins";
        };
      };

      # Disable db-init — data is migrated, not re-initialized
      systemd.services.supabase-db-init = {
        wantedBy = lib.mkForce [ ];
        serviceConfig.ExecStart = lib.mkForce "${pkgs.pkgsLinux.coreutils}/bin/true";
      };

      # Add new package to system PATH (don't mkForce — that changes /etc and
      # breaks D-Bus policy during switch-to-configuration)
      environment.systemPackages = [ newPkg ];
    };
  # Create a specialisation for OrioleDB — wipes data and reinitializes from scratch
  # (no pg_upgrade path from regular PG to OrioleDB), then runs full Supabase init
  makeOrioledbSpecialisation =
    {
      postgresPort ? defaultPort,
      extraConfig ? "",
    }:
    let
      orioledbPkg = self.packages.${system}."psql_orioledb-17/bin";
      groongaPackage = self.packages.${system}.supabase-groonga;
      newDataDir = "/var/lib/postgresql/data-orioledb-17";
      processedConfig = processAnsibleConfig { majorVersion = "orioledb-17"; };
      port = toString postgresPort;

      # Wipe existing data — no upgrade path from regular PG to OrioleDB
      migrateScript = pkgs.pkgsLinux.writeShellScript "postgresql-orioledb-migrate" ''
        set -euo pipefail
        NEW_DATA="${newDataDir}"
        if [ -d "$NEW_DATA" ]; then
          rm -rf "$NEW_DATA"
        fi
      '';

      # Runs as root: ensure data directory exists with correct ownership
      preStartRootScript = pkgs.pkgsLinux.writeShellScript "postgresql-orioledb-pre-start-root" ''
        set -euo pipefail
        DATA_DIR="${newDataDir}"
        if [ ! -d "$DATA_DIR" ]; then
          mkdir -p -m 0700 "$DATA_DIR"
          chown postgres:postgres "$DATA_DIR"
        fi
      '';

      # Runs as postgres: initdb with OrioleDB-specific args, config deployment, validation
      initScript = pkgs.pkgsLinux.writeShellScript "postgresql-orioledb-init" ''
                set -euo pipefail
                DATA_DIR="${newDataDir}"

                if [ ! -f "$DATA_DIR/PG_VERSION" ]; then
                  echo "Initializing OrioleDB database at $DATA_DIR"
                  ${orioledbPkg}/bin/initdb \
                    --allow-group-access --data-checksums \
                    --locale-provider=icu --encoding=UTF-8 --icu-locale=en_US.UTF-8 \
                    -U supabase_admin -D "$DATA_DIR"
                fi

                # Deploy processed config files with @dataDir@ substituted
                for f in postgresql.conf pg_hba.conf pg_ident.conf supautils.conf read-replica.conf; do
                  sed "s|@dataDir@|$DATA_DIR|g" ${processedConfig}/$f > "$DATA_DIR/$f"
                done

                # Append any extra configuration
                if [ -n '${extraConfig}' ]; then
                  cat >> "$DATA_DIR/postgresql.conf" << 'EXTRA_CONFIG_EOF'
        ${extraConfig}
        EXTRA_CONFIG_EOF
                fi

                # Copy conf.d directory
                rm -rf "$DATA_DIR/conf.d"
                cp -r ${processedConfig}/conf.d "$DATA_DIR/conf.d"
                chmod -R u+w "$DATA_DIR/conf.d"

                # Copy extension-custom-scripts directory
                rm -rf "$DATA_DIR/extension-custom-scripts"
                cp -r ${processedConfig}/extension-custom-scripts "$DATA_DIR/extension-custom-scripts"
                chmod -R u+w "$DATA_DIR/extension-custom-scripts"

                # Validate config
                echo "Validating PostgreSQL configuration..."
                ${orioledbPkg}/bin/postgres -C shared_preload_libraries -D "$DATA_DIR"
      '';

      # Full db init: CREATE EXTENSION orioledb first, then init-scripts + migrations
      dbInitScript = pkgs.pkgsLinux.writeShellScript "supabase-orioledb-db-init" ''
        set -euo pipefail

        echo "Waiting for PostgreSQL to be ready..."
        for i in $(seq 1 60); do
          if ${orioledbPkg}/bin/pg_isready -h localhost -p ${port} -q; then
            echo "PostgreSQL is ready"
            break
          fi
          if [ "$i" -eq 60 ]; then
            echo "PostgreSQL failed to become ready"
            exit 1
          fi
          sleep 1
        done

        PSQL="${orioledbPkg}/bin/psql"

        # Create orioledb extension first (before init-scripts, so tables use orioledb storage)
        echo "Creating orioledb extension..."
        $PSQL -h localhost -p ${port} -U supabase_admin -d postgres -c "CREATE EXTENSION orioledb CASCADE;"

        # Create postgres role (matching run-server.sh.in)
        echo "Creating postgres role..."
        $PSQL -h localhost -p ${port} -U supabase_admin -d postgres -c "CREATE ROLE postgres SUPERUSER LOGIN;" || true
        $PSQL -h localhost -p ${port} -U supabase_admin -d postgres -c "ALTER DATABASE postgres OWNER TO postgres;" || true

        # Run init-scripts as postgres user (matching run-server.sh.in)
        for sql in ${migrationsDir}/init-scripts/*.sql; do
          echo "Running init-script: $sql"
          $PSQL -v ON_ERROR_STOP=1 -h localhost -p ${port} -U postgres -f "$sql" postgres
        done

        # Run pgbouncer auth schema
        echo "Running pgbouncer auth schema..."
        $PSQL -v ON_ERROR_STOP=1 -h localhost -p ${port} -U postgres -d postgres -f ${pgbouncerAuthSchemaSql}

        # Run stat extension
        echo "Running stat extension..."
        $PSQL -v ON_ERROR_STOP=1 -h localhost -p ${port} -U postgres -d postgres -f ${statExtensionSql}

        # Run migrations as supabase_admin (matching run-server.sh.in)
        for sql in ${migrationsDir}/migrations/*.sql; do
          echo "Running migration: $sql"
          $PSQL -v ON_ERROR_STOP=1 -h localhost -p ${port} -U supabase_admin -f "$sql" postgres
        done

        # Run postgresql schema
        echo "Running postgresql schema..."
        $PSQL -v ON_ERROR_STOP=1 -h localhost -p ${port} -U supabase_admin -f ${postgresqlSchemaSql} postgres

        echo "OrioleDB database initialization complete"
      '';
    in
    {
      # Reinit service wipes data for fresh orioledb cluster
      systemd.services.postgresql-migrate = {
        description = "PostgreSQL OrioleDB Reinitialization";
        serviceConfig = {
          Type = "oneshot";
          RemainAfterExit = true;
          User = "postgres";
          Group = "postgres";
          ExecStart = migrateScript;
        };
        environment = {
          LANG = "en_US.UTF-8";
        };
      };

      # Override postgresql: new package, new data dir, new ExecStartPre for orioledb initdb
      # Restart settings match production: ansible/files/postgresql_config/postgresql.service
      systemd.services.postgresql = {
        after = [ "postgresql-migrate.service" ];
        requires = [ "postgresql-migrate.service" ];
        serviceConfig = {
          ExecStartPre = lib.mkForce [
            ("+" + preStartRootScript)
            initScript
          ];
          ExecStart = lib.mkForce "${orioledbPkg}/bin/postgres -D ${newDataDir}";
          Restart = "always";
          RestartSec = "5";
        };
        environment = {
          GRN_PLUGINS_DIR = lib.mkForce "${groongaPackage}/lib/groonga/plugins";
        };
      };

      # Override db-init with orioledb-aware version (creates orioledb ext + full init)
      systemd.services.supabase-db-init = {
        wantedBy = lib.mkForce [ "multi-user.target" ];
        serviceConfig.ExecStart = lib.mkForce dbInitScript;
      };

      # Add orioledb package to system PATH
      environment.systemPackages = [ orioledbPkg ];
    };
in
{
  inherit
    processAnsibleConfig
    makeSupabaseTestConfig
    makeUpgradeSpecialisation
    makeOrioledbSpecialisation
    expectedVersions
    defaultPort
    ;
}
