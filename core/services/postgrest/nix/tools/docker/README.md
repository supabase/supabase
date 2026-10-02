# Docker image built with Nix

In order to build an optimal PostgREST Docker image, we create the image from
scratch (i.e., without a parent image like `debian` or `alpine`), and only
include the file that is essential for running PostgREST: the static
PostgREST binary.

This is similar to what you would get with the following `Dockerfile`:

```Dockerfile
# `scratch` is a minimal, reserved image in Docker, see
# https://docs.docker.com/develop/develop-images/baseimages/ . It essentially
# means "don't use a parent image and start with an empty one".
FROM scratch

# The static PostgREST executable has no runtime dependencies, so it's all we
# need to include for running the application.
ADD /absolute/path/to/postgrest /bin/postgrest

EXPOSE 3000

# This is the user id that Docker will run our image under by default. Note
# that we don't actually add the user to `/etc/passwd` or `/etc/shadow`. This
# means that tools like whoami would not work properly, but we don't include
# those in the image anyway. Not adding the user has the benefit that the image
# can be run under any user you specify.
USER 1000

CMD [ "/bin/postgrest" ]
```

# Building the Docker image with Nix

As we are building the static PostgREST executable with Nix and that's the main
input to the Docker file, we can also create the Docker image directly with Nix
using the [`dockerTools`
utilities](https://nixos.org/nixpkgs/manual/#sec-pkgs-dockerTools). Those
utilities don't actually use `Dockerfiles` or Docker to build Docker images,
but create them directly by putting together the required `json` and `tar`
files that make up an image. This is more efficient, does not rely on Docker or
root permissions and results in fully reproducible builds. See
[`nix/docker/default.nix`](./default.nix) for details how the image is built.

# Building and loading the image

The Nix expression provides a helper script `postgrest-docker-load` that loads
the optimized image into your local Docker instance (using `docker load -i
<image file>` under the hood). You can use it by running:

```
# Running from the root directory of the repository:

# Build the `docker` attribute from `default.nix`, the result will be symlinked
# to `result`:
nix-build -A docker

# Run the loading script:
result/bin/postgrest-docker-load
```

The Docker image built with Nix always has the name "postgrest:latest" when
loaded.

# Inspecting the optimized image

The image does not come with the usual utilities like `bash` and `ls`.

You can, however, explore the `tar` file of the image by saving it with `docker
save postgrest:latest > image.tar`.

[Dive](https://github.com/wagoodman/dive) is also useful for looking at the
contents of the image:

```
┃ ● Layers ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │ Current Layer Contents ├────────────────────────────────────────────────────────────────────────────────
Cmp   Size  Command                                                                                        Permission     UID:GID       Size  Filetree
     14 MB  FROM 20ee65c811575d2                                                                           dr-xr-xr-x         0:0      14 MB  ├── bin
                                                                                                           -r-xr-xr-x         0:0      14 MB  │   └── postgrest
│ Layer Details ├───────────────────────────────────────────────────────────────────────────────────────── drwxr-xr-x         0:0      783 B  ├── etc
                                                                                                           -r--r--r--         0:0      783 B  │   └── postgrest.conf
Tags:   (unavailable)                                                                                      dr-xr-xr-x         0:0      23 kB  └── nix
Id:     20ee65c811575d206eb673e1887e7f7e6b7ccde902a63ccb924c5faa50b32cee                                   dr-xr-xr-x         0:0      23 kB      └── store
Digest: sha256:ece77302b83fd38fb54395dabc10c2eba06fc1d1933801d36cc2c4732d9c8f38                            dr-xr-xr-x         0:0      23 kB          └── s440jbrn94wmpzy7f8yfsp6jr2shllw5-openssl-1.1.1g-etc
Command:                                                                                                   dr-xr-xr-x         0:0      23 kB              └── etc
                                                                                                           dr-xr-xr-x         0:0      23 kB                  └── ssl
                                                                                                           -r--r--r--         0:0      412 B                      ├── ct_log_list.cnf
│ Image Details ├───────────────────────────────────────────────────────────────────────────────────────── -r--r--r--         0:0      412 B                      ├── ct_log_list.cnf.dist
                                                                                                           dr-xr-xr-x         0:0        0 B                      ├── engines-1.1
                                                                                                           -r--r--r--         0:0      11 kB                      ├── openssl.cnf
Total Image size: 14 MB                                                                                    -r--r--r--         0:0      11 kB                      └── openssl.cnf.dist
Potential wasted space: 0 B
Image efficiency score: 100 %

Count   Total Space  Path
```

# Deriving from the optimized image

Since the docker image is minimal, it does not contain a shell or other utilities.
To derive a non-minimal image, you can do the following:

```Dockerfile
# derive from any base image you want
FROM alpine:latest

# copy PostgREST over
COPY --from=postgrest/postgrest /bin/postgrest /bin

# add your other stuff
```
