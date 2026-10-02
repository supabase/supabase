_: super: {
  buildToolbox = super.callPackage ./build-toolbox.nix { };
  checkedShellScript = super.callPackage ./checked-shell-script.nix { };

  # Use the `gitignoreSource` function from Hercules-CI.
  # This function is useful for filtering which files are added to the Nix store.
  # See: https://github.com/hercules-ci/gitignore.nix

  # To update to a newer revision, the simplest way is to add a new commit hash
  # from GitHub under `rev` and to then add the hash that Nix suggests on first
  # use.
  gitignoreSource =
    let
      gitignoreSrc = super.fetchFromGitHub {
        owner = "hercules-ci";
        repo = "gitignore";
        rev = "a20de23b925fd8264fd7fad6454652e142fd7f73";
        sha256 = "sha256-8DFJjXG8zqoONA1vXtgeKXy68KdJL5UaXR8NtVMUbx8=";
      };
    in
    (super.callPackage gitignoreSrc { }).gitignoreSource;
}
