.. tabs::

  .. group-tab:: macOS

    You can install PostgREST from the `Homebrew official repo <https://formulae.brew.sh/formula/postgrest>`_.

    .. code:: bash

      brew install postgrest

  .. group-tab:: FreeBSD

    You can install PostgREST from the `official ports <https://www.freshports.org/www/hs-postgrest>`_.

    .. code:: bash

      pkg install hs-postgrest

  .. group-tab:: Linux

    .. tabs::

      .. tab:: Arch Linux

        You can install PostgREST from the `community repo <https://archlinux.org/packages/extra/x86_64/postgrest/>`_.

        .. code:: bash

          pacman -S postgrest

      .. tab:: Nix via nixpkgs

        You can install PostgREST from nixpkgs.

        .. code:: bash

          nix-env -i postgrest

      .. tab:: Nix via flake

        You can install PostgREST via flake.

        .. code:: nix

          {
            inputs.postgrest.url = "github:postgrest/postgrest";
            # ...
          }

  .. group-tab:: Windows

    You can install PostgREST using `Chocolatey <https://community.chocolatey.org/packages/postgrest>`_ or `Scoop <https://github.com/ScoopInstaller/Scoop>`_.

    .. code:: bash

      choco install postgrest
      scoop install postgrest
