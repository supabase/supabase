{ ... }:
{
  perSystem =
    { pkgs, ... }:
    {
      packages = {
        update-ansible-artifacts = pkgs.callPackage ./update-ansible-artifacts { };
      };
    };
}
