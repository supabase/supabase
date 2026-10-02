{ inputs, self, ... }:
{
  flake = {
    darwinConfigurations = {
      darwin-nixostest = inputs.nix-darwin.lib.darwinSystem {
        specialArgs = { inherit self; };
        modules = [ ./hosts/darwin-nixostest/darwin-configuration.nix ];
      };
    };
  };
}
