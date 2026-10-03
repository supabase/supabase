{
  lib,
  stdenv,
  cmake,
  fetchurl,
  kytea,
  msgpack-c,
  mecab,
  pkg-config,
  rapidjson,
  xxHash,
  zstd,
  makeWrapper,
  suggestSupport ? false,
  zeromq,
  libevent,
  lz4Support ? false,
  lz4,
  zlibSupport ? true,
  zlib,
  mecab-naist-jdic,
}:
stdenv.mkDerivation (finalAttrs: {
  pname = "supabase-groonga";
  version = "14.0.5";
  src = fetchurl {
    url = "https://packages.groonga.org/source/groonga/groonga-${finalAttrs.version}.tar.gz";
    hash = "sha256-y4UGnv8kK0z+br8wXpPf57NMXkdEJHcLCuTvYiubnIc=";
  };
  patches = [
    ./fix-cmake-install-path.patch
    ./do-not-use-vendored-libraries.patch
  ];
  nativeBuildInputs = [
    cmake
    pkg-config
    makeWrapper
  ];
  buildInputs = [
    rapidjson
    xxHash
    zstd
    mecab
    kytea
    msgpack-c
  ]
  ++ lib.optionals lz4Support [ lz4 ]
  ++ lib.optional zlibSupport [ zlib ]
  ++ lib.optionals suggestSupport [
    zeromq
    libevent
  ];
  cmakeFlags = [
    "-DWITH_MECAB=ON"
    "-DMECAB_DICDIR=${mecab-naist-jdic}/lib/mecab/dic/naist-jdic"
    "-DMECAB_CONFIG=${mecab}/bin/mecab-config"
    "-DENABLE_MECAB_TOKENIZER=ON"
    "-DMECAB_INCLUDE_DIR=${mecab}/include"
    "-DMECAB_LIBRARY=${mecab}/lib/libmecab.so"
    "-DGROONGA_ENABLE_TOKENIZER_MECAB=YES"
    "-DGRN_WITH_MECAB=YES"
  ];
  preConfigure = ''
    export MECAB_DICDIR=${mecab-naist-jdic}/lib/mecab/dic/naist-jdic
    echo "MeCab dictionary directory is: $MECAB_DICDIR"
  '';
  buildPhase = ''
    cmake --build . -- VERBOSE=1
    grep -i mecab CMakeCache.txt || (echo "MeCab not detected in CMake cache" && exit 1)
    echo "CMake cache contents related to MeCab:"
    grep -i mecab CMakeCache.txt
  '';

  # installPhase = ''
  #   mkdir -p $out/bin $out/lib/groonga/plugins
  #   cp -r lib/groonga/plugins/* $out/lib/groonga/plugins
  #   cp -r bin/* $out/bin
  #   echo "Installed Groonga plugins:"
  #   ls -l $out/lib/groonga/plugins
  # '';

  postInstall = ''
    echo "Searching for MeCab-related files:"
    find $out -name "*mecab*"

    echo "Checking Groonga plugins directory:"
    ls -l $out/lib/groonga/plugins

    echo "Wrapping Groonga binary:"
    wrapProgram $out/bin/groonga \
      --set GRN_PLUGINS_DIR $out/lib/groonga/plugins 

  '';
  env.NIX_CFLAGS_COMPILE = lib.optionalString zlibSupport "-I${zlib.dev}/include";

  meta = with lib; {
    homepage = "https://groonga.org/";
    description = "Open-source fulltext search engine and column store";
    license = licenses.lgpl21;
    platforms = platforms.all;
    longDescription = ''
      Groonga is an open-source fulltext search engine and column store.
      It lets you write high-performance applications that requires fulltext search.
    '';
  };
})
