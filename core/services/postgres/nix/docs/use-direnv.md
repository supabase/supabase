Have you ever used a tool like `pip`'s `bin/activate` script, or `rbenv`? These
tools populate your shell environment with the right tools and scripts and
dependencies (e.g. `PYTHONPATH`) to run your software.

What if I told you there was a magical tool that worked like that, and could do
it for arbitrary languages and tools?

That tool is called **[direnv](https://direnv.net)**.

## Install direnv and use it in your shell

First, install `direnv`:

```
$ nix profile install nixpkgs#direnv
```

```
$ which direnv
/home/austin/.nix-profile/bin/direnv
```

Now, you need to activate it in your shell by hooking into it. If you're using
**Bash**, try putting this in your `.bashrc` and starting up a new interactive
shell:

```
eval "$(direnv hook bash)"
```

Not using bash? Check the
[direnv hook documentation](https://direnv.net/docs/hook.html) for more.

## Set up `nix-postgres`

Let's go back to the `nix-postgres` source code.

```
cd $HOME/tmp-nix-postgres
```

Now, normally, direnv is going to look for a file called `.envrc` and load that
if it exists. But to be polite, we don't do that by default; we keep a file
named `.envrc.recommended` in the repository instead, and encourage people to do
this:

```
echo "source_env .envrc.recommended" >> .envrc
```

All this says is "Load the code from `.envrc.recommended` directly", just like a
normal bash script using `source`. The idea of this pattern is to allow users to
have their own customized `.envrc` and piggyback on the committed code for
utility &mdash; and `.envrc` is `.gitignore`'d, so you can put e.g. secret
tokens inside without fear of committing them.

Run the above command, and then...

## What just happened?

Oops, a big red error appeared?

```
$ echo "source_env .envrc.recommended" >> .envrc
direnv: error /home/austin/work/nix-postgres/.envrc is blocked. Run `direnv allow` to approve its content
```

What happened? By default, as a security measure, `direnv` _does not_ load or
execute any code from an `.envrc` file, and instead it MUST be allowed
explicitly.

## `direnv allow`

Our `.envrc.recommended` file will integrate with Nix directly. So run
`direnv allow`, and you'll suddenly see the following:

```
$ direnv allow
direnv: loading ~/work/nix-postgres/.envrc
direnv: loading ~/work/nix-postgres/.envrc.recommended
direnv: loading https://raw.githubusercontent.com/nix-community/nix-direnv/2.3.0/direnvrc (sha256-Dmd+j63L84wuzgyjITIfSxSD57Tx7v51DMxVZOsiUD8=)
direnv: using flake
direnv: nix-direnv: renewed cache
direnv: export +AR +AS +CC +CONFIG_SHELL +CXX +DETERMINISTIC_BUILD +HOST_PATH +IN_NIX_SHELL +LD +NIX_BINTOOLS +NIX_BINTOOLS_WRAPPER_TARGET_HOST_x86_64_unknown_linux_gnu +NIX_BUILD_CORES +NIX_CC +NIX_CC_WRAPPER_TARGET_HOST_x86_64_unknown_linux_gnu +NIX_CFLAGS_COMPILE +NIX_ENFORCE_NO_NATIVE +NIX_HARDENING_ENABLE +NIX_LDFLAGS +NIX_STORE +NM +OBJCOPY +OBJDUMP +PYTHONHASHSEED +PYTHONNOUSERSITE +PYTHONPATH +RANLIB +READELF +SIZE +SOURCE_DATE_EPOCH +STRINGS +STRIP +_PYTHON_HOST_PLATFORM +_PYTHON_SYSCONFIGDATA_NAME +__structuredAttrs +buildInputs +buildPhase +builder +cmakeFlags +configureFlags +depsBuildBuild +depsBuildBuildPropagated +depsBuildTarget +depsBuildTargetPropagated +depsHostHost +depsHostHostPropagated +depsTargetTarget +depsTargetTargetPropagated +doCheck +doInstallCheck +dontAddDisableDepTrack +mesonFlags +name +nativeBuildInputs +out +outputs +patches +phases +preferLocalBuild +propagatedBuildInputs +propagatedNativeBuildInputs +shell +shellHook +stdenv +strictDeps +system ~PATH ~XDG_DATA_DIRS
```

What just happened is that we populated the ambient shell environment with tools
specified inside of `flake.nix` &mdash; we'll cover Flakes later. But for now,
your tools are provisioned!


## The power of `direnv`

`direnv` with Nix is a frighteningly good development combination for many
purposes. This is its main power: you can use it to create on-demand developer
shells for any language, tool, or environment, and all you need to do is `cd` to
the right directory.

This is the power of `direnv`: your projects always, on demand, will have the
right tools configured and available, no matter if you last worked on them a day
ago or a year ago, or it was done by your teammate, or you have a brand new
computer that you've never programmed on.
