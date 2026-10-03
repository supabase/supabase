[
  import_deps: [:ecto, :phoenix, :open_api_spex],
  inputs: ["*.{ex,exs}", "priv/*/seeds.exs", "{config,lib}/**/*.{ex,exs}"],
  subdirectories: ["priv/*/migrations", "test"]
]
