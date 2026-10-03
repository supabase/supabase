%{
  configs: [
    %{
      name: "default",
      files: %{
        included: ["lib/", "src/", "web/", "apps/"],
        excluded: []
      },
      plugins: [],
      requires: [],
      strict: true,
      parse_timeout: 5000,
      color: true,
      checks: %{
        disabled: [
          {Credo.Check.Design.TagTODO, []},
          {Credo.Check.Consistency.ExceptionNames, []},
          {Credo.Check.Refactor.Nesting, []},
          {Credo.Check.Refactor.CyclomaticComplexity, []},
          {Credo.Check.Readability.WithSingleClause, []},
          {Credo.Check.Readability.AliasOrder, []},
          {Credo.Check.Readability.StringSigils, []},
          {Credo.Check.Refactor.Apply, []}
        ],
        extra: [
          # The formatter isn't exact and so sometimes ends up with line length slightly
          # above 120 - not worth manually fixing imo.
          # https://elixir.hexdocs.pm/Code.html#format_string!/2-line-length
          {Credo.Check.Readability.MaxLineLength, [priority: :low, max_length: 123]},
          # Only complain about nested modules 4+ levels deep, 3 is often genuinely helpful context
          {Credo.Check.Design.AliasUsage, [if_nested_deeper_than: 3]}
        ]
      }
    }
  ]
}
