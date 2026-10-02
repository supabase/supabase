{
  lib,
  stdenv,
  fetchFromGitHub,
  postgresql,
}:

stdenv.mkDerivation rec {
  pname = "supautils";
  name = pname;
  version = "3.4.4";

  buildInputs = [ postgresql ];

  separateDebugInfo = true;

  # dlopen'd into postgres, which already links these libs
  NIX_DONT_SET_RPATH = stdenv.isLinux;

  src = fetchFromGitHub {
    owner = "supabase";
    repo = pname;
    rev = "refs/tags/v${version}";
    hash = "sha256-Wsou5U7/Tuwj2E6aPEmlHg7uz7kGyBOGrb7UkjfEo9U=";
  };

  patches = [ ./patches/supautils-strtol-glibc-compat.patch ];

  installPhase = ''
    mkdir -p $out/lib

    install -D *${postgresql.dlSuffix} -t $out/lib
  '';

  meta = with lib; {
    description = "PostgreSQL extension for enhanced security";
    homepage = "https://github.com/supabase/${pname}";
    platforms = postgresql.meta.platforms;
    license = licenses.postgresql;
  };
}
