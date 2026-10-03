{
  stdenv,
  postgresql,
  lib,
  bzip2,
}:
stdenv.mkDerivation {
  pname = "postgresql-${postgresql.version}-src";
  version = postgresql.version;

  src = postgresql.src;

  nativeBuildInputs = [ bzip2 ];

  phases = [
    "unpackPhase"
    "installPhase"
  ];

  installPhase = ''
    mkdir -p $out
    cp -r . $out
  '';

  meta = with lib; {
    description = "PostgreSQL 15 source files";
    homepage = "https://www.postgresql.org/";
    license = licenses.postgresql;
    inherit (platforms) all;
  };
}
