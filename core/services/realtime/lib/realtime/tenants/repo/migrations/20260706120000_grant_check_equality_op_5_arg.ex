defmodule Realtime.Tenants.Migrations.GrantCheckEqualityOp5Arg do
  @moduledoc false

  use Ecto.Migration

  def change do
    execute("""
    grant execute on function realtime.check_equality_op(realtime.equality_op, regtype, text, text, boolean)
    to postgres, anon, authenticated, service_role;
    """)
  end
end
