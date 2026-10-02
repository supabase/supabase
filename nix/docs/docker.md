Docker images are pushed to `ghcr.io` on every commit. Try the following:

```
docker run --rm -it ghcr.io/supabase/nix-postgres-15:latest
```

Every Docker image that is built on every push is given a tag that exactly
corresponds to a Git commit in the repository &mdash; for example commit
[d3e0c39d34e1bb4d37e058175a7bc376620f6868](https://github.com/supabase/nix-postgres/commit/d3e0c39d34e1bb4d37e058175a7bc376620f6868)
in this repository has a tag in the container registry which can be used to pull
exactly that version.

This just starts the server. Client container images are not provided; you can
use `nix run` for that, as outlined [here](./start-client-server.md).
