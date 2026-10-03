# Dev container for supabase/realtime, aiming for parity with the production image - bump both together.
#
# Plain Debian rather than an elixir/OTP image, so mise.toml and mise.lock stay the single
# source of tool versions and the workflow is identical inside and outside the container.
FROM debian:trixie-20260713-slim

ENV DEBIAN_FRONTEND=noninteractive

# We need to build erlang/OTP from source as no Debian target is published.
# inotify-tools backs Phoenix live reload
# sudo is for post-create's chown
# procps supplies the `ps` the VS Code server probes with
RUN apt-get update && apt-get install -y --no-install-recommends \
      build-essential autoconf libncurses-dev libssl-dev \
      ca-certificates curl git inotify-tools locales openssh-client \
      postgresql-client procps sudo zsh \
    && rm -rf /var/lib/apt/lists/*

# Elixir warns and can misbehave when the VM's native name encoding is not utf8, which is
# what a non-UTF-8 locale leaves it as.
RUN sed -i '/en_US.UTF-8/s/^# //g' /etc/locale.gen && locale-gen
ENV LANG=en_US.UTF-8 LANGUAGE=en_US:en LC_ALL=en_US.UTF-8

# Non-root: the workspace is bind-mounted, so files must not end up root-owned.
ARG USERNAME=vscode
ARG USER_UID=1000
ARG USER_GID=1000
RUN groupadd --gid $USER_GID $USERNAME \
    && useradd --uid $USER_UID --gid $USER_GID -m -s /bin/zsh $USERNAME \
    && echo "$USERNAME ALL=(root) NOPASSWD:ALL" > /etc/sudoers.d/$USERNAME \
    && chmod 0440 /etc/sudoers.d/$USERNAME

# mise lives outside $HOME so a home-directory volume cannot shadow the installs. Shims -
# not `mise activate` - are what put tools on PATH: `devcontainer exec` probes with a
# login-interactive shell, so .bashrc loads and activate prepends the raw tool bin dirs
# ahead of /mise/shims, while its hook-env never fires because no prompt is drawn. That
# yields activate's PATH without activate's [env], and mix boots without
# METRICS_JWT_SECRET. Shims also need the config trusted - see devcontainer.json.
# Installs and shims are shared; the cache stays per-user. Root uses these shims too, so a
# feature running `npm install -g` would otherwise bake a root-owned cache into the image and
# `mise install` as vscode dies from then on with "failed to update lockfiles: Permission denied".
ENV MISE_DATA_DIR=/mise \
    MISE_CONFIG_DIR=/mise \
    MISE_INSTALL_PATH=/usr/local/bin/mise \
    PATH=/mise/shims:$PATH
RUN curl -fsSL https://mise.run | sh \
    && mkdir -p /mise \
    && chown -R $USER_UID:$USER_GID /mise

# ENV does not survive *login* shells: Debian's /etc/profile assigns PATH outright rather
# than defaulting it, so `bash -l` drops the shims. VS Code patches /etc/profile at container
# start and hides this; `devcontainer exec`, plain `docker run` and CI get no such fixup.
RUN printf 'PATH=/mise/shims:$PATH\n' > /etc/profile.d/00-mise-shims.sh

# zsh does not need the profile.d fixup above: /etc/zsh/zprofile ships empty on Debian and
# /etc/zsh/zshenv only overwrites PATH when it is unset or the bare "/bin:/usr/bin" default, so
# the shims dir survives both login and interactive zsh unmolested (verified in an isolated
# container). Only the git/command completion below is zsh-specific.
USER $USERNAME

# The zsh package ships completion functions (e.g. _git) but nothing wires them up by default,
# so a bare new shell has no tab-completion until compinit runs once.
RUN printf 'autoload -Uz compinit\ncompinit\n' > /home/$USERNAME/.zshrc

# Production containers carry no wx/ODBC/Java either, so skip them and save build time.
ENV KERL_CONFIGURE_OPTIONS="--without-javac --without-wx --without-odbc --without-observer --without-debugger --without-et"

# Only these two files, so the expensive `mise install` below stays cached against the
# toolchain definition rather than every source edit. Do not add MISE_LOCKFILE=false: a build
# cannot write back to its context, so there is no lockfile here worth protecting, and an
# unlocked resolve bakes a different node patch than mise.lock pins - mise.toml says only
# "24" - which every container start then re-downloads.
COPY --chown=$USER_UID:$USER_GID mise.toml mise.lock /tmp/toolchain/
RUN cd /tmp/toolchain \
    # Only this copy - the workspace mise.toml does not exist at build time.
    && mise trust \
    && mise install \
    && mise exec -- mix local.hex --force \
    && mise exec -- mix local.rebar --force \
    # Also record them as *global* versions: shims resolve from the mise.toml in scope, so
    # anything running outside the workspace - devcontainer features doing `npm install -g`
    # at build time - otherwise dies with "No version is set for shim". Read back from the
    # locked resolve so they cannot drift from mise.lock.
    && for tool in erlang elixir node supabase; do \
         mise use -g "${tool}@$(mise current ${tool})"; \
       done \
    # Only test/e2e/.tool-versions asks for bun, and .dockerignore keeps /test/ out of the
    # build context, so `mise run e2e` fails on a missing tool without this. It pins nothing
    # ("bun latest"); if upstream moves past this build, mise fetches the newer one on use.
    && mise use -g bun@latest \
    # The kerl source tree alone is ~790MB, none of it needed at runtime.
    && rm -rf /tmp/toolchain "$HOME/.cache/mise"
