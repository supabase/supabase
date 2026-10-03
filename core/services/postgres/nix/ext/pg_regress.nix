{
  lib,
  stdenv,
  postgresql,
}:

stdenv.mkDerivation {
  pname = "pg_regress";
  version = postgresql.version;

  phases = [ "installPhase" ];

  installPhase = ''
    mkdir -p $out/bin
    cp ${postgresql}/lib/pgxs/src/test/regress/pg_regress $out/bin/
  '';

  meta = with lib; {
    description = "Regression testing tool for PostgreSQL";
    homepage = "https://www.postgresql.org/";
    platforms = postgresql.meta.platforms;
    license = licenses.postgresql;
  };
}
