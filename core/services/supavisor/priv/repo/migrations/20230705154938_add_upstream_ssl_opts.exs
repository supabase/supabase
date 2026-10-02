defmodule Supavisor.Repo.Migrations.AddUpstreamSslOpts do
  use Ecto.Migration

  def up do
    alter table("tenants", prefix: "_supavisor") do
      add(:upstream_ssl, :boolean, null: false, default: false)
      add(:upstream_verify, :string, null: true)
      add(:upstream_tls_ca, :binary, null: true)
    end

    create(
      constraint(
        "tenants",
        :upstream_verify_values,
        check: "upstream_verify IN ('none', 'peer')",
        prefix: "_supavisor"
      )
    )

    upstream_constraints = """
    (upstream_ssl = false AND upstream_verify IS NULL) OR (upstream_ssl = true AND upstream_verify IS NOT NULL)
    """

    create(
      constraint("tenants", :upstream_constraints,
        check: upstream_constraints,
        prefix: "_supavisor"
      )
    )
  end

  def down do
    alter table("tenants", prefix: "_supavisor") do
      remove(:upstream_ssl)
      remove(:upstream_verify)
      remove(:upstream_tls_ca_encrypted)
    end

    drop(constraint("tenants", "upstream_verify_values", prefix: "_supavisor"))
    drop(constraint("tenants", "upstream_constraints", prefix: "_supavisor"))
  end
end
