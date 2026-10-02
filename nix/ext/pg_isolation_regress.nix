{
  lib,
  stdenv,
  postgresql,
}:

stdenv.mkDerivation {
  pname = "pg_isolation_regress";
  version = postgresql.version;

  phases = [ "installPhase" ];

  # pg_isolation_regress and its helper isolationtester are built as part of the
  # standard PostgreSQL source tree (src/test/isolation) and ship in the pgxs
  # tree. pg_isolation_regress locates isolationtester relative to its own
  # binary, so both must live in the same directory.
  installPhase = ''
    mkdir -p $out/bin
    cp ${postgresql}/lib/pgxs/src/test/isolation/pg_isolation_regress $out/bin/
    cp ${postgresql}/lib/pgxs/src/test/isolation/isolationtester $out/bin/
  '';

  meta = with lib; {
    description = "Concurrent-isolation regression testing tool for PostgreSQL";
    homepage = "https://www.postgresql.org/";
    platforms = postgresql.meta.platforms;
    license = licenses.postgresql;
  };
}
