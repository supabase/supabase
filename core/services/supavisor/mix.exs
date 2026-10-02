defmodule Supavisor.MixProject do
  use Mix.Project

  def project do
    [
      app: :supavisor,
      version: version(),
      elixir: "~> 1.14",
      elixirc_paths: elixirc_paths(Mix.env()),
      start_permanent: Mix.env() == :prod,
      aliases: aliases(),
      deps: deps(),
      releases: releases(),
      dialyzer: [plt_add_apps: [:mix]],
      test_coverage: [tool: ExCoveralls],
      preferred_cli_env: [
        coveralls: :test,
        "coveralls.html": :test,
        "coveralls.github": :test,
        "coveralls.lcov": :test
      ]
    ]
  end

  # Configuration for the OTP application.
  #
  # Type `mix help compile.app` for more information.
  def application do
    [
      mod: {Supavisor.Application, []},
      extra_applications:
        [:logger, :runtime_tools, :os_mon, :ssl] ++ extra_applications(Mix.env())
    ]
  end

  defp extra_applications(:dev), do: [:wx, :observer]
  defp extra_applications(_), do: []

  # Specifies which paths to compile per environment.
  defp elixirc_paths(:test), do: ["lib", "test/support"]
  defp elixirc_paths(_), do: ["lib"]

  # Specifies your project dependencies.
  #
  # Type `mix help deps` for examples and options.
  defp deps do
    [
      {:phoenix, "~> 1.7.2"},
      {:phoenix_ecto, "~> 4.4"},
      {:ecto_sql, "~> 3.10"},
      {:postgrex,
       github: "elixir-ecto/postgrex",
       ref: "0f92ae39c8f43b6cf39a46ab1142f6fc09be40fe",
       override: true},
      {:phoenix_view, "~> 2.0.2"},
      {:phoenix_live_view, "~> 1.0"},
      {:phoenix_live_dashboard, "~> 0.7"},
      {:telemetry_poller, "~> 1.0"},
      {:peep, "~> 4.4.0", override: true},
      {:plug_cowboy, "~> 2.5"},
      {:joken, "~> 2.6.0"},
      {:cloak_ecto, "~> 1.3.0"},
      {:req, "~> 0.6.1"},
      {:prom_ex, "~> 1.10"},
      {:open_api_spex, "~> 3.16"},
      {:libcluster, "~> 3.5"},
      {:logflare_logger_backend, github: "Logflare/logflare_logger_backend", tag: "v0.11.4"},
      {:distillery, "~> 2.1"},
      {:cachex, "~> 3.6"},
      {:inet_cidr, "~> 1.0.0"},
      {:observer_cli, "~> 1.7"},
      {:recon, "~> 2.5"},

      # pooller
      # {:poolboy, "~> 1.5.2"},
      {:poolboy, git: "https://github.com/supabase/poolboy", tag: "v0.0.4"},
      {:syn, "~> 3.3"},
      {:pgo, "~> 0.13"},
      {:pg_saslprep,
       github: "v0idpwn/pg_saslprep", ref: "455e2e50757e8e5e091c00be4c1b9818612e3ca2"},
      {:rustler, "~> 0.36.1"},
      {:ranch, "~> 2.0", override: true},

      # Linting
      {:credo, "~> 1.7", only: [:dev, :test], runtime: false},
      {:dialyxir, "~> 1.4", only: [:dev, :test], runtime: false},
      {:sobelow, ">= 0.0.0", only: [:dev, :test], runtime: false},
      {:mix_audit, "~> 2.1", only: [:dev, :test], runtime: false},

      # Benchmarking and performance
      {:benchee, "~> 1.3", only: :dev},
      {:eflambe, "~> 0.3.1", only: :dev},

      # Test utilities
      {:excoveralls, ">= 0.0.0", only: [:dev, :test]},
      {:stream_data, "~> 1.0", only: [:dev, :test]},
      # Override needed due to eflambe
      {:meck, "~> 1.0", only: [:dev, :test], override: true},
      {:tidewave, "~> 0.9.1", only: [:dev]}
    ]
  end

  def releases do
    [
      supavisor: [
        steps: [:assemble, &upgrade/1, :tar],
        include_erts: System.get_env("INCLUDE_ERTS", "true") == "true",
        cookie: System.get_env("RELEASE_COOKIE", Base.url_encode64(:crypto.strong_rand_bytes(30)))
      ]
    ]
  end

  # Aliases are shortcuts or tasks specific to the current project.
  # For example, to install project dependencies and perform other setup tasks, run:
  #
  #     $ mix setup
  #
  # See the documentation for `Mix` for more info on aliases.
  defp aliases do
    [
      setup: ["deps.get", "ecto.setup"],
      "ecto.setup": ["ecto.create", "ecto.migrate", "run priv/repo/seeds.exs"],
      "ecto.reset": ["ecto.drop", "ecto.setup"],
      # test: ["ecto.create --quiet", "ecto.migrate --quiet", "test"]
      test: [
        "ecto.create",
        "run priv/repo/seeds_before_migration.exs",
        "ecto.migrate --prefix _supavisor --log-migrator-sql",
        "run priv/repo/seeds_after_migration.exs",
        "test"
      ]
    ]
  end

  defp upgrade(release) do
    from = System.get_env("UPGRADE_FROM", "")

    if from != "" do
      vsn = release.version
      path = Path.join([release.path, "releases", "supavisor-#{vsn}.rel"])
      rel_content = File.read!(Path.join(release.version_path, "supavisor.rel"))
      :ok = File.write!(path, rel_content)

      # Copy any hand-written appups from relups/<from>-<vsn>/appups/, then
      # generate the supavisor appup if it isn't among them.
      appups_path = Path.join(["relups", "#{from}-#{vsn}", "appups"])

      copied =
        if File.dir?(appups_path) do
          IO.puts("Using existing appups from #{appups_path}")

          appups_path
          |> File.ls!()
          |> Enum.map(fn appup ->
            [app, version] =
              appup
              |> String.trim_trailing(".appup")
              |> String.split("-", parts: 2)

            file_path = Path.join(appups_path, appup)

            destination =
              Path.join([
                release.path,
                "lib",
                "#{app}-#{version}",
                "ebin",
                "#{app}.appup"
              ])

            IO.puts("Copying #{file_path} to #{destination}")
            File.copy(file_path, destination)
            app
          end)
        else
          []
        end

      if "supavisor" not in copied do
        Mix.Task.run("supavisor.gen.appup", ["--from=" <> from, "--to=" <> vsn])
      end

      Mix.Task.run("supavisor.gen.relup", ["--from=" <> from, "--to=" <> vsn])
    end

    release
  end

  defp version, do: File.read!("./VERSION") |> String.trim()
end
