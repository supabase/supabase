with import <nixpkgs>{};
stdenvNoCC.mkDerivation {
    name = "build-env";
    nativeBuildInputs = [
        # Supabase
        supabase-cli

        # Build Tools
        nodejs
    ];
}
