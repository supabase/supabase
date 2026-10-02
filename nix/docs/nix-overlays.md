Overlays are a feature of Nixpkgs that allow you to:

- Add new packages with new names to the namespace _without_ modifying upstream
  - For example, if there is a package `foobar`, you might add `foobar-1_2_3` to
    add a specific version for backwards compatibility
- Globally override _existing_ package names, in terms of other packages.
  - For example, if you want to globally override a package to enable a
    disabled-by-default feature.

First, you need to define a file for the overlay under
`/nix/overlays/`, and then import it in `nix/overlays/default.nix`. There is an
example pull request in
[#14](https://github.com/supabase/nix-postgres/issues/14) for this; an overlay
typically looks like this:

```
final: prev: {
    gdal = prev.gdalMinimal;
}
```

This says "globally override `gdal` with a different version, named
`gdalMinimal`". In this case `gdalMinimal` is a build with less features
enabled.

The most important part is that there is an equation of the form `lhs = rhs;`
&mdash; if the `lhs` refers to an existing name, it's overwritten. If it refers
to a new name, it's introduced. Overwriting an existing name acts as if you
changed the files upstream: so the above example _globally_ overrides GDAL for
anything that depends on it.

The names `final` and `prev` are used to refer to packages in terms of other
overlays. For more information about this, see the
[NixOS Wiki Page for Overlays](https://nixos.wiki/wiki/Overlays).

We also use an overlay to override the default build recipe for `postgresql_16`, and instead feed it the specially patched postgres for use with orioledb extension. This experimental variant can be built with `nix build .#psql_orioledb_16/bin`. This will build this patched version of postgres, along with all extensions and wrappers that currently are known to work with orioledb.
