{
  lib,
  stdenv,
  fetchurl,
  mecab,
}:

stdenv.mkDerivation rec {
  pname = "mecab-naist-jdic";
  version = "0.6.3b-20111013";

  src = fetchurl {
    url = "https://github.com/supabase/mecab-naist-jdic/raw/main/mecab-naist-jdic-${version}.tar.gz";
    sha256 = "sha256-yzdwDcmne5U/K/OxW0nP7NZ4SFMKLPirywm1lMpWKMw=";
  };

  buildInputs = [ mecab ];

  configureFlags = [ "--with-charset=utf8" ];

  buildPhase = ''
    runHook preBuild
    make
    ${mecab}/libexec/mecab/mecab-dict-index -d . -o . -f UTF-8 -t utf-8
    runHook postBuild
  '';

  installPhase = ''
    runHook preInstall

    mkdir -p $out/lib/mecab/dic/naist-jdic
    cp *.dic *.bin *.def $out/lib/mecab/dic/naist-jdic/

    runHook postInstall
  '';

  meta = with lib; {
    description = "Naist Japanese Dictionary for MeCab";
    homepage = "https://taku910.github.io/mecab/";
    license = licenses.gpl2;
    platforms = platforms.unix;
  };
}
