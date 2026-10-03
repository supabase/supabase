{ inputs, ... }:
{
  imports = [ inputs.treefmt-nix.flakeModule ];
  perSystem = {
    treefmt = {
      programs = {
        deadnix.enable = true;
        gofmt.enable = true;
        nixfmt.enable = true;
        packer.enable = true;
        ruff-format.enable = true;
        shfmt.enable = true;
        shfmt.indent_size = null; # use shfmt's default width (tab)
      };

      settings = {
        global.excludes = [
          "*.sum"
          "vendor/*"
        ];
      };
    };
  };
}
