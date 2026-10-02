{
  pkgs,
  lib,
  stdenv,
}:

stdenv.mkDerivation {
  pname = "http-mock-server";
  version = "1.0.0";

  src = ../tests/http-mock-server.py;

  nativeBuildInputs = with pkgs; [
    python3
    makeWrapper
  ];

  dontUnpack = true;

  installPhase = ''
    mkdir -p $out/bin
    cp $src $out/bin/http-mock-server.py
    chmod +x $out/bin/http-mock-server.py

    # Create a wrapper script
    makeWrapper ${pkgs.python3}/bin/python3 $out/bin/http-mock-server \
      --add-flags "$out/bin/http-mock-server.py"
  '';

  meta = with lib; {
    description = "Simple HTTP mock server for testing";
    license = licenses.mit;
    platforms = platforms.all;
  };
}
