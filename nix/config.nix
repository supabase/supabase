{ lib, ... }:
let
  postgresqlDefaults = lib.types.submodule {
    options = {
      port = lib.mkOption {
        type = lib.types.str;
        default = "5435";
      };
      host = lib.mkOption {
        type = lib.types.str;
        default = "localhost";
      };
      superuser = lib.mkOption {
        type = lib.types.str;
        default = "supabase_admin";
      };
    };
  };
  postgresqlVersion = lib.types.submodule {
    options = {
      version = lib.mkOption { type = lib.types.str; };
      hash = lib.mkOption { type = lib.types.str; };
      revision = lib.mkOption {
        type = lib.types.nullOr lib.types.str;
        default = null;
      };
    };
  };
  supabaseSubmodule = lib.types.submodule {
    options = {
      defaults = lib.mkOption { type = postgresqlDefaults; };
      supportedPostgresVersions = lib.mkOption {
        type = lib.types.attrsOf (lib.types.attrsOf postgresqlVersion);
        default = { };
      };
    };
  };
in
{
  flake = {
    options = {
      supabase = lib.mkOption { type = supabaseSubmodule; };
    };
    config.supabase = {
      defaults = { };
      supportedPostgresVersions = {
        postgres = {
          "15" = {
            version = "15.19";
            hash = "sha256-4aZKh6RrgluIwILkUYFhpHqrU8RWlJZPi6HfKPeFn4k=";
          };
          "17" = {
            version = "17.11";
            hash = "sha256-3Sfys8Wec+0UqjMkkBJCv2mgMqY0eAXydOYmAyLUKXk=";
          };
        };
        orioledb = {
          "17" = {
            version = "17_22";
            hash = "sha256-B3ibVCa7dSdrrR6VyhuJ36Hp/lqmxmH5gauZpc9ylkA=";
          };
        };
      };
    };
  };
}
