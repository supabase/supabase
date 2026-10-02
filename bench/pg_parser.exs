alias Supavisor.PgParser, as: Parser

Benchee.run(%{
  "statement_types/1" => fn ->
    Parser.statement_types("insert into table1 values ('a', 'b')")
  end
})
