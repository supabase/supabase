{
  lib,
  stdenv,
  fetchFromGitHub,
  postgresql,
}:

stdenv.mkDerivation rec {
  pname = "pg_backtrace";
  version = "1.1";

  buildInputs = [ postgresql ];

  src = fetchFromGitHub {
    owner = "pashkinelfe";
    repo = pname;
    rev = "d100bac815a7365e199263f5b3741baf71b14c70";
    hash = "sha256-IVCL4r4oj1Ams03D8y+XCFkckPFER/W9tQ68GkWQQMY=";
  };

  makeFlags = [ "USE_PGXS=1" ];

  installPhase = ''
    mkdir -p $out/{lib,share/postgresql/extension}

    cp *${postgresql.dlSuffix}      $out/lib
    cp *.sql     $out/share/postgresql/extension
    cp *.control $out/share/postgresql/extension
  '';

  meta = with lib; {
    description = "Updated fork of pg_backtrace";
    homepage = "https://github.com/pashkinelfe/pg_backtrace";
    platforms = postgresql.meta.platforms;
    license = licenses.postgresql;
  };
}
