{
  lib,
  stdenv,
  fetchurl,
  openssl,
  libevent,
  c-ares,
  pkg-config,
  systemd,
  nixosTests,
  pandoc,
  python3,
}:

stdenv.mkDerivation rec {
  pname = "pgbouncer";
  version = "1.25.1";

  src = fetchurl {
    url = "https://www.pgbouncer.org/downloads/files/${version}/${pname}-${version}.tar.gz";
    hash = "sha256-blZq6S/j739qG54m1gSffXyjnEDinns49tVQCuFdhGU=";
  };

  nativeBuildInputs = [
    pkg-config
    pandoc
    python3
  ];
  buildInputs = [
    libevent
    openssl
    c-ares
  ]
  ++ lib.optional stdenv.hostPlatform.isLinux systemd;
  enableParallelBuilding = true;
  configureFlags = lib.optional stdenv.hostPlatform.isLinux "--with-systemd";

  passthru.tests = {
    pgbouncer = nixosTests.pgbouncer;
  };

  meta = with lib; {
    homepage = "https://www.pgbouncer.org/";
    mainProgram = "pgbouncer";
    description = "Lightweight connection pooler for PostgreSQL";
    changelog = "https://github.com/pgbouncer/pgbouncer/releases/tag/pgbouncer_${
      replaceStrings [ "." ] [ "_" ] version
    }";
    license = licenses.isc;
    platforms = platforms.all;
  };
}
