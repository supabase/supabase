{
  lib,
  stdenv,
  fetchFromGitHub,
  cmake,
  pkg-config,
  curl,
  expat,
  libgeotiff,
  geos,
  json_c,
  libxml2,
  postgresql,
  proj,
  sqlite,
  libtiff,
  zlib,
}:

stdenv.mkDerivation rec {
  pname = "gdal";
  version = "3.8.5";

  src = fetchFromGitHub {
    owner = "OSGeo";
    repo = "gdal";
    rev = "v${version}";
    hash = "sha256-Z+mYlyOX9vJ772qwZMQfCbD/V7RL6+9JLHTzoZ55ot0=";
  };

  nativeBuildInputs = [
    cmake
    pkg-config
  ];

  buildInputs = [
    curl
    expat
    libgeotiff
    geos
    json_c
    libxml2
    postgresql
    proj
    sqlite
    libtiff
    zlib
  ];

  cmakeFlags = [
    "-DGDAL_USE_INTERNAL_LIBS=OFF"
    "-DGEOTIFF_INCLUDE_DIR=${lib.getDev libgeotiff}/include"
    "-DGEOTIFF_LIBRARY_RELEASE=${lib.getLib libgeotiff}/lib/libgeotiff${stdenv.hostPlatform.extensions.sharedLibrary}"
    "-DBUILD_PYTHON_BINDINGS=OFF"
  ]
  ++ lib.optionals (!stdenv.isDarwin) [ "-DCMAKE_SKIP_BUILD_RPATH=ON" ]
  ++ lib.optionals stdenv.isDarwin [ "-DCMAKE_BUILD_WITH_INSTALL_NAME_DIR=ON" ];

  enableParallelBuilding = true;

  meta = with lib; {
    description = "Translator library for raster geospatial data formats (PostGIS-focused build)";
    homepage = "https://www.gdal.org/";
    license = licenses.mit;
    platforms = platforms.unix;
  };
}
