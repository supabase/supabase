{
  lib,
  nix-eval-jobs,
  python3Packages,
}:
let
  pname = "github-matrix";

  github-action-utils = python3Packages.buildPythonPackage rec {
    pname = "github-action-utils";
    version = "1.1.0";
    pyproject = true;

    src = python3Packages.fetchPypi {
      inherit pname version;
      sha256 = "0q9xrb4jcvbn6954lvpn85gva1yc885ykdqb2q2410cxp280v94a";
    };

    build-system = with python3Packages; [ setuptools ];

    meta = with lib; {
      description = "Collection of Python functions for GitHub Action Workflow Commands";
      homepage = "https://github.com/saadmk11/github-action-utils";
      license = licenses.mit;
    };
  };
in

python3Packages.buildPythonApplication {
  inherit pname;
  version = "0.1.0";
  pyproject = false;

  src = ./.;

  propagatedBuildInputs = [
    github-action-utils
    python3Packages.result
  ];

  makeWrapperArgs = [ "--suffix PATH : ${lib.makeBinPath [ nix-eval-jobs ]}" ];

  nativeCheckInputs = with python3Packages; [
    pytestCheckHook
    pytest-mypy
  ];

  installPhase = ''
    install -Dm755 github_matrix.py "$out/bin/${pname}"
  '';
}
