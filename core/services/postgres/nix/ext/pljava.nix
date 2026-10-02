{
  stdenv,
  lib,
  fetchFromGitHub,
  openssl,
  openjdk,
  maven,
  postgresql,
  libkrb5,
  makeWrapper,
  gcc,
  pkg-config,
  which,
}:

maven.buildMavenPackage rec {
  pname = "pljava";

  version = "1.6.7";

  src = fetchFromGitHub {
    owner = "tada";
    repo = "pljava";
    rev = "V1_6_7";
    sha256 = "sha256-M17adSLsw47KZ2BoUwxyWkXKRD8TcexDAy61Yfw4fNU=";
  };

  mvnParameters = "clean install -Dmaven.test.skip -DskipTests -Dmaven.javadoc.skip=true";
  mvnHash = "sha256-lcxRduh/nKcPL6YQIVTsNH0L4ga0LgJpQKgX5IPkRzs=";

  nativeBuildInputs = [
    makeWrapper
    maven
    openjdk
    postgresql
    openssl
    postgresql
    gcc
    libkrb5
    pkg-config
  ];
  buildInputs = [
    stdenv.cc.cc.lib
    which
  ];
  buildPhase = ''
    export PATH=$(lib.makeBinPath [ postgresql ]):$PATH

  '';
  buildOffline = true;

  installPhase = ''
    mkdir -p $out/pljavabuild
    cp -r *   $out/pljavabuild
    mkdir -p $out/share/postgresql/extension/pljava
    mkdir -p $out/share/postgresql/pljava
    mkdir -p $out/lib
    mkdir -p $out/etc
    java -Dpgconfig=${postgresql}/bin/pg_config \
      -Dpgconfig.sharedir=$out/share \
      -Dpgconfig.sysconfdir=$out/etc/pljava.policy \
      -Dpgconfig.pkglibdir=$out/lib \
      -jar $out/pljavabuild/pljava-packaging/target/pljava-pg15.jar
    cp $out/share/pljava/* $out/share/postgresql/extension/pljava
    cp $out/share/pljava/* $out/share/postgresql/pljava
    cp $out/share/extension/*.control $out/share/postgresql/extension
    rm -r $out/pljavabuild
  '';

  meta = with lib; {
    description = "PL/Java extension for PostgreSQL";
    homepage = "https://github.com/tada/pljava";
    license = licenses.bsd3;
  };
}
