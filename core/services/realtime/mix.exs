defmodule Realtime.MixProject do
  use Mix.Project

  def project do
    [
      app: :realtime,
      version: "2.140.7",
      elixir: "~> 1.19",
      elixirc_paths: elixirc_paths(Mix.env()),
      compilers: [:phoenix_live_view] ++ Mix.compilers(),
      listeners: [Phoenix.CodeReloader],
      start_permanent: Mix.env() == :prod,
      aliases: aliases(),
      deps: deps(),
      dialyzer: dialyzer(),
      test_coverage: [tool: ExCoveralls],
      hex: [
        # Can be overridden via `HEX_COOLDOWN=0d` should you want to, see DEVELOPERS.md#dependency-cooldown
        cooldown: "7d",
        # These are all cowlib, have no released fixes as of now but also shouldn't impact us.
        ignore_advisories: ["CVE-2026-43969", "CVE-2026-43966", "CVE-2026-43971"]
      ],
      releases: [
        realtime: [
          # This will ensure that if opentelemetry terminates, even abnormally, our application will not be terminated.
          applications: [
            opentelemetry_exporter: :permanent,
            opentelemetry: :temporary
          ]
        ]
      ]
    ]
  end

  defp dialyzer do
    [
      plt_add_apps: [:mix],
      plt_core_path: "priv/plts",
      plt_file: {:no_warn, "priv/plts/dialyzer.plt"},
      # Warn if an ignore filter on dialyzer_ignore is not unused
      list_unused_filters: true
    ]
  end

  # Configuration for the OTP application.
  #
  # Type `mix help compile.app` for more information.
  def application do
    [
      mod: {Realtime.Application, []},
      extra_applications: [:logger, :runtime_tools, :prom_ex, :mix, :os_mon]
    ]
  end

  # Specifies which paths to compile per environment.
  defp elixirc_paths(:test), do: ["lib", "test/support"]
  defp elixirc_paths(_), do: ["lib"]

  # Specifies your project dependencies.
  #
  # Type `mix help deps` for examples and options.
  defp deps do
    [
      phoenix_dep(),
      {:phoenix_ecto, "~> 4.7.0"},
      {:ecto_sql, "~> 3.11"},
      {:ecto_psql_extras, "~> 0.8"},
      {:postgrex, "~> 0.22"},
      {:db_connection, "~> 2.10"},
      {:phoenix_html, "~> 3.2"},
      {:phoenix_live_view, "~> 1.0"},
      {:phoenix_live_reload, "~> 1.2", only: :dev},
      {:phoenix_live_dashboard, "~> 0.7"},
      {:phoenix_view, "~> 2.0"},
      {:esbuild, "~> 0.4", runtime: Mix.env() == :dev},
      {:tailwind, "~> 0.1", runtime: Mix.env() == :dev},
      {:heroicons,
       github: "tailwindlabs/heroicons", tag: "v2.1.1", sparse: "optimized", app: false, compile: false, depth: 1},
      {:telemetry_metrics, "~> 1.0"},
      {:telemetry_poller, "~> 1.0"},
      {:gettext, "~> 1.0"},
      {:jason, "~> 1.3"},
      {:plug_cowboy, "~> 2.8"},
      {:libcluster, "~> 3.3"},
      {:libcluster_postgres, "~> 0.2"},
      {:uuid, "~> 1.1"},
      {:prom_ex, "~> 1.10"},
      # `peep` 4.4.0 doesn't seem backwards compatible for us, tests fail not knowing a struct we use:  `Peep.Persistent`
      # likely, as it's a record now: https://github.com/rkallos/peep/pull/64/changes#diff-e4d3a94d15db756ca760129d7f80f6794e0a0b3b3967591fc42537f348526b6c
      {:peep, "~> 4.3.1"},
      {:joken, "~> 2.6"},
      {:nimble_zta, "~> 0.1"},
      {:ex_json_schema, "~> 0.11"},
      {:recon, "~> 2.5"},
      {:mint, "~> 1.4"},
      {:logflare_logger_backend, "~> 0.11"},
      {:syn, "~> 3.3"},
      {:forum, path: "./forum"},
      {:cachex, "~> 4.0"},
      {:open_api_spex, "~> 3.16"},
      {:corsica, "~> 2.0"},
      {:observer_cli, "~> 2.0"},
      {:opentelemetry_exporter, "~> 1.10"},
      {:opentelemetry, "~> 1.7"},
      {:opentelemetry_api, "~> 1.5"},
      {:opentelemetry_phoenix, "~> 2.0"},
      {:opentelemetry_cowboy, "~> 1.0"},
      {:opentelemetry_ecto, "~> 1.2"},
      {:gen_rpc, git: "https://github.com/emqx/gen_rpc.git", tag: "3.6.1"},
      # gen_rpc uses a git dependency
      {:snabbkaffe, "~> 1.0", override: true},
      {:req, "~> 0.7.4"},
      {:mimic, "~> 2.0", only: :test},
      {:floki, ">= 0.30.0", only: :test},
      {:lazy_html, ">= 0.1.0", only: :test},
      {:mint_web_socket, "~> 1.0", only: :test},
      {:postgres_replication, git: "https://github.com/filipecabaco/postgres_replication.git", only: :test},
      {:benchee, "~> 1.5.1", only: [:dev, :test]},
      {:excoveralls, "~> 0.18", only: [:dev, :test], runtime: false},
      {:ex_crap, "~> 0.1", only: [:dev, :test], runtime: false},
      {:sobelow, "~> 0.13", only: [:dev, :test], runtime: false},
      {:credo, "~> 1.7", only: [:dev, :test], runtime: false},
      {:dialyxir, "~> 1.4", only: :dev, runtime: false},
      {:poolboy, "~> 1.5", only: :test},
      {:mix_test_watch, "~> 1.0", only: [:dev, :test], runtime: false},
      {:wait_for_it, "~> 2.6", only: [:dev, :test]}
    ]
  end

  defp phoenix_dep do
    if path = System.get_env("PHOENIX_PATH") do
      {:phoenix, path: path, override: true}
    else
      # Phoenix 1.8.3 introduces a bugfix/regression as previous versions allowed missing `join_ref`
      # This would break some SDK clients.
      # Wait until they are fixed + some grace period to upgrade.
      # We're running phoenix 1.8.11 from a fork here with the bugfix removed as to give us some
      # more lenience to update while resolving the CVEs.
      # REAL-981
      {:phoenix, "~> 1.8", github: "supabase/phoenix", branch: "v1.8-no-drop-missing-join-refs", override: true}
    end
  end

  # Aliases are shortcuts or tasks specific to the current project.
  # For example, to install project dependencies and perform other setup tasks, run:
  #
  #     $ mix setup
  #
  # See the documentation for `Mix` for more info on aliases.
  defp aliases do
    [
      # Databases, migrations and the seed tenant come from `mise run db-start`.
      setup: ["deps.get", "cmd npm install --prefix assets"],
      "ecto.setup": ["ecto.create", "ecto.migrate", "seed"],
      "ecto.reset": ["ecto.drop", "ecto.setup"],
      seed: ["run priv/repo/dev_seeds.exs"],
      "test.setup": [
        "cmd epmd -daemon",
        &start_distribution/1,
        "ecto.create --quiet",
        "ecto.migrate"
      ],
      test: ["test.setup", "test"],
      "test.partitioned": ["test.setup", "test --partitions 4"],
      "crap.ci": ["compile", &merge_coverdata/1, "crap"],
      "assets.deploy": ["esbuild default --minify", "tailwind default --minify", "phx.digest"]
    ]
  end

  defp start_distribution(_args) do
    name = Application.fetch_env!(:realtime, :test_node_name)

    case :net_kernel.start([name, :longnames]) do
      {:ok, _pid} -> :ok
      {:error, {:already_started, _pid}} -> :ok
      {:error, reason} -> Mix.raise("could not start distribution as #{name}: #{inspect(reason)}")
    end
  end

  defp merge_coverdata(_args) do
    File.mkdir_p!("cover")
    :cover.start()

    "coverage/**/*.coverdata"
    |> Path.wildcard()
    |> Enum.each(&:cover.import(String.to_charlist(&1)))

    :cover.export(~c"cover/default.coverdata")
  end
end
