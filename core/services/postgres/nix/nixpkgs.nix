{ self, inputs, ... }:
{
  perSystem =
    { system, ... }:
    {
      _module.args.pkgs = import inputs.nixpkgs {
        inherit system;
        config.allowUnfree = true;
        permittedInsecurePackages = [ "v8-9.7.106.18" ];
        overlays = [
          (import inputs.rust-overlay)
          self.overlays.default
          (
            let
              # Provide older versions of packages required by some extensions
              oldstable = import inputs.nixpkgs-oldstable {
                inherit system;
                config.allowUnfree = true;
              };
            in
            _final: _prev: {
              curl_8_6 = oldstable.curl;
              v8_oldstable = oldstable.v8;
            }
          )
          inputs.devshell.overlays.default
        ];
      };
    };
}
