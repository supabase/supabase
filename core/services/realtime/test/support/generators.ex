defmodule Generators do
  @moduledoc """
  Data genarators for tests.
  """

  alias Realtime.Api.Tenant
  alias Realtime.Crypto
  alias Realtime.Database
  alias Realtime.Env
  alias Realtime.Extensions
  alias Realtime.Integration.WebsocketClient
  alias Realtime.Repo

  @spec tenant_fixture(map()) :: Realtime.Api.Tenant.t()
  def tenant_fixture(override \\ %{}) do
    create_attrs = %{
      "external_id" => random_string(),
      "name" => "tenant",
      "extensions" => [
        %{
          "type" => "postgres_cdc_rls",
          "settings" => %{
            "db_host" => "127.0.0.1",
            "db_name" => "postgres",
            "db_user" => System.get_env("DB_USER", "supabase_admin"),
            "db_password" => "postgres",
            "db_port" => "#{override[:port] || Env.unused_port()}",
            "poll_interval_ms" => 10,
            "poll_max_changes" => 100,
            "poll_max_record_bytes" => 1_048_576,
            "region" => "us-east-1",
            "publication" => "supabase_realtime_test",
            "ssl_enforced" => false
          }
        }
      ],
      "postgres_cdc_default" => "postgres_cdc_rls",
      "jwt_secret" => "new secret",
      "jwt_jwks" => nil,
      "max_presence_events_per_second" => 50,
      "max_payload_size_in_kb" => 3000
    }

    override = override |> Enum.map(fn {k, v} -> {"#{k}", v} end) |> Map.new()
    {:ok, tenant} = create_attrs |> Map.merge(override) |> Realtime.Api.create_tenant()

    tenant
  end

  @spec message_fixture(Realtime.Api.Tenant.t()) :: any()
  def message_fixture(tenant, override \\ %{}) do
    {:ok, db_conn} = Database.connect(tenant, "realtime_test", :stop)
    Realtime.Tenants.create_messages_partitions(db_conn)

    create_attrs = %{
      "topic" => random_string(),
      "extension" => Enum.random([:presence, :broadcast])
    }

    override = override |> Enum.map(fn {k, v} -> {"#{k}", v} end) |> Map.new()

    {:ok, channel} =
      create_attrs
      |> Map.merge(override)
      |> TenantConnection.create_message(db_conn)

    Process.exit(db_conn, :normal)
    channel
  end

  def random_string(length \\ 20) do
    length |> :crypto.strong_rand_bytes() |> Base.encode32() |> String.downcase()
  end

  def clean_table(db_conn, schema, table) do
    Database.transaction(db_conn, fn transaction_conn ->
      %{rows: rows} =
        Postgrex.query!(
          transaction_conn,
          "SELECT policyname FROM pg_policies WHERE schemaname = '#{schema}' and tablename = '#{table}'",
          []
        )

      rows
      |> List.flatten()
      |> Enum.each(fn name ->
        Postgrex.query!(
          transaction_conn,
          "DROP POLICY IF EXISTS \"#{name}\" ON #{schema}.#{table}",
          []
        )
      end)

      Postgrex.query!(transaction_conn, "TRUNCATE TABLE #{schema}.#{table} CASCADE", [])
    end)
  end

  def create_messages_partitions(db_conn, start_date, end_date) do
    Enum.each(Date.range(start_date, end_date), fn date ->
      partition_name = "messages_#{date |> Date.to_iso8601() |> String.replace("-", "_")}"
      start_timestamp = Date.to_string(date)
      end_timestamp = Date.to_string(Date.add(date, 1))

      Postgrex.query!(
        db_conn,
        """
        CREATE TABLE IF NOT EXISTS realtime.#{partition_name}
        PARTITION OF realtime.messages
        FOR VALUES FROM ('#{start_timestamp}') TO ('#{end_timestamp}');
        """,
        []
      )
    end)
  end

  @doc """
  Creates support RLS policies given a name and params to be used by the policies
  Supported:
  * read_all_topic - Sets read all topic policy for authenticated role
  * write_all_topic - Sets write all topic policy for authenticated role
  * read_topic - Sets read channel policy for authenticated role
  * write_topic - Sets write channel policy for authenticated role
  * read_broadcast - Sets read broadcast policy for authenticated role
  * write_broadcast - Sets write broadcast policy for authenticated role
  """
  def create_rls_policies(conn, policies, params) do
    query = """
    CREATE OR REPLACE FUNCTION test_log_error() RETURNS boolean AS $$
    BEGIN
    RAISE EXCEPTION 'test error';
    RETURN TRUE;
    END$$ LANGUAGE plpgsql;
    """

    Postgrex.query!(conn, query, [])

    Enum.each(policies, fn policy ->
      query = policy_query(policy, params)
      Postgrex.query!(conn, query, [])
    end)
  end

  def policy_query(query, params \\ nil)

  def policy_query(:authenticated_all_topic_read, _) do
    """
    CREATE POLICY "authenticated_all_topic_read"
    ON realtime.messages FOR SELECT
    TO authenticated
    USING ( true );
    """
  end

  def policy_query(:authenticated_all_topic_insert, _) do
    """
    CREATE POLICY "authenticated_all_topic_write"
    ON realtime.messages FOR INSERT
    TO authenticated
    WITH CHECK ( true );
    """
  end

  def policy_query(:authenticated_read_matching_user_sub, %{sub: sub}) do
    """
    CREATE POLICY "authenticated_read_topic_has_user_sub"
    ON realtime.messages FOR SELECT
    TO authenticated
    USING (((SELECT auth.uid() AS uid)::text) = '#{sub}')
    """
  end

  def policy_query(:read_matching_user_role, %{role: role}) do
    """
    CREATE POLICY "authenticated_read_topic_has_user_role"
    ON realtime.messages FOR SELECT
    USING (((SELECT auth.role())::text) = '#{role}')
    """
  end

  def policy_query(:authenticated_write_matching_user_sub, %{sub: sub}) do
    """
    CREATE POLICY "authenticated_write_topic_has_user_sub"
    ON realtime.messages FOR INSERT
    TO authenticated
    WITH CHECK (((SELECT auth.uid() AS uid)::text) = '#{sub}')
    """
  end

  def policy_query(:write_matching_user_role, %{role: role}) do
    """
    CREATE POLICY "authenticated_write_topic_has_user_role"
    ON realtime.messages FOR INSERT
    WITH CHECK (((SELECT auth.role())::text) = '#{role}')
    """
  end

  def policy_query(:authenticated_read_broadcast, %{topic: name}) do
    """
    CREATE POLICY "authenticated_read_broadcast_#{name}"
    ON realtime.messages FOR SELECT
    TO authenticated
    USING ( realtime.topic() = '#{name}' AND realtime.messages.extension = 'broadcast' );
    """
  end

  def policy_query(:authenticated_write_broadcast, %{topic: name}) do
    """
    CREATE POLICY "authenticated_write_broadcast_#{name}"
    ON realtime.messages FOR INSERT
    TO authenticated
    WITH CHECK ( realtime.topic() = '#{name}' AND realtime.messages.extension = 'broadcast');
    """
  end

  def policy_query(:authenticated_write_persistence, %{topic: name}) do
    """
    CREATE POLICY "authenticated_write_persistence_#{name}"
    ON realtime.messages FOR INSERT
    TO authenticated
    WITH CHECK ( realtime.topic() = '#{name}' AND realtime.messages.extension = 'persistence');
    """
  end

  def policy_query(:authenticated_read_presence, %{topic: name}) do
    """
    CREATE POLICY "authenticated_read_presence_#{name}"
    ON realtime.messages FOR SELECT
    TO authenticated
    USING ( realtime.topic() = '#{name}' AND realtime.messages.extension = 'presence' );
    """
  end

  def policy_query(:authenticated_write_presence, %{topic: name}) do
    """
    CREATE POLICY "authenticated_write_presence_#{name}"
    ON realtime.messages FOR INSERT
    TO authenticated
    WITH CHECK ( realtime.topic() = '#{name}' AND realtime.messages.extension = 'presence' );
    """
  end

  def policy_query(:authenticated_read_presence_for_sub, %{topic: name, sub: sub}) do
    """
    CREATE POLICY "authenticated_read_presence_for_sub_#{name}"
    ON realtime.messages FOR SELECT
    TO authenticated
    USING (
      realtime.topic() = '#{name}'
      AND realtime.messages.extension = 'presence'
      AND ((SELECT auth.uid())::text) = '#{sub}'
    );
    """
  end

  def policy_query(:authenticated_read_broadcast_and_presence, %{topic: name}) do
    """
    CREATE POLICY "authenticated_read_presence_#{name}"
    ON realtime.messages FOR SELECT
    TO authenticated
    USING ( realtime.topic() = '#{name}' AND realtime.messages.extension IN ('presence', 'broadcast') );
    """
  end

  def policy_query(:authenticated_write_broadcast_and_presence, %{topic: name}) do
    """
    CREATE POLICY "authenticated_write_presence_#{name}"
    ON realtime.messages FOR INSERT
    TO authenticated
    WITH CHECK ( realtime.topic() = '#{name}' AND realtime.messages.extension IN ('presence', 'broadcast') );
    """
  end

  def policy_query(:authenticated_read_presence_based_on_claim, %{topic: name}) do
    """
    CREATE POLICY "authenticated_read_presence_claim_#{name}"
    ON realtime.messages FOR SELECT
    TO authenticated
    USING (
      realtime.topic() = '#{name}'
      AND realtime.messages.extension = 'presence'
      AND coalesce(((current_setting('request.jwt.claims', true))::jsonb ->> 'presence_read')::boolean, false)
    );
    """
  end

  def policy_query(:authenticated_read_broadcast_based_on_claim, %{topic: name}) do
    """
    CREATE POLICY "authenticated_read_broadcast_claim_#{name}"
    ON realtime.messages FOR SELECT
    TO authenticated
    USING (
      realtime.topic() = '#{name}'
      AND realtime.messages.extension = 'broadcast'
      AND coalesce(((current_setting('request.jwt.claims', true))::jsonb ->> 'broadcast_read')::boolean, false)
    );
    """
  end

  def policy_query(:broken_read_presence, _) do
    """
    CREATE POLICY "authenticated_read_presence"
    ON realtime.messages FOR SELECT
    TO authenticated
    USING (  (SELECT test_log_error())  );
    """
  end

  def policy_query(:broken_write_presence, _) do
    """
    CREATE POLICY "authenticated_write_presence"
    ON realtime.messages FOR INSERT
    TO authenticated
    WITH CHECK ( (SELECT test_log_error()) );
    """
  end

  @spec generate_jwt_token(Tenant.t() | binary()) :: Joken.sign_result()
  def generate_jwt_token(secret_or_tenant) do
    claims = %{role: "authenticated", exp: System.system_time(:second) + 100_000}
    generate_jwt_token(secret_or_tenant, claims)
  end

  @spec generate_jwt_token(Tenant.t() | binary(), map()) :: Joken.sign_result()
  def generate_jwt_token(%Tenant{} = tenant, claims) do
    secret = Crypto.decrypt!(tenant.jwt_secret)
    generate_jwt_token(secret, claims)
  end

  def generate_jwt_token(secret, claims) when is_binary(secret) do
    signer = Joken.Signer.create("HS256", secret)
    {:ok, claims} = Joken.generate_claims(%{}, claims)
    {:ok, jwt, _} = Joken.encode_and_sign(claims, signer)
    jwt
  end

  defp test_port do
    :realtime
    |> Application.get_env(RealtimeWeb.Endpoint, %{})
    |> get_in([:http, :port]) || 4002
  end

  def get_connection(tenant, serializer \\ Phoenix.Socket.V1.JSONSerializer, opts \\ []) do
    params = Keyword.get(opts, :params, %{log_level: :warning})
    claims = Keyword.get(opts, :claims, %{})
    role = Keyword.get(opts, :role, "anon")

    params = Enum.reduce(params, "", fn {k, v}, acc -> "#{acc}&#{k}=#{v}" end)
    uri = "#{uri(tenant, serializer)}&#{params}"

    with {:ok, token} <- token_valid(tenant, role, claims),
         {:ok, socket} <- WebsocketClient.connect(self(), uri, serializer, [{"x-api-key", token}]) do
      {socket, token}
    end
  end

  def uri(tenant, serializer, port \\ nil),
    do: "ws://#{tenant.external_id}.localhost:#{port || test_port()}/socket/websocket?vsn=#{vsn(serializer)}"

  defp vsn(Phoenix.Socket.V1.JSONSerializer), do: "1.0.0"
  defp vsn(RealtimeWeb.Socket.V2Serializer), do: "2.0.0"

  @spec token_valid(Tenant.t(), binary(), map()) :: {:ok, binary()}
  def token_valid(tenant, role, claims \\ %{}), do: generate_token(tenant, Map.put(claims, :role, role))
  @spec token_no_role(Tenant.t()) :: {:ok, binary()}
  def token_no_role(tenant), do: generate_token(tenant)

  @spec generate_token(Tenant.t() | binary(), map()) :: {:ok, binary()}
  def generate_token(tenant, claims \\ %{}) do
    claims =
      Map.merge(
        %{ref: "127.0.0.1", iat: System.system_time(:second), exp: System.system_time(:second) + 604_800},
        claims
      )

    {:ok, generate_jwt_token(tenant, claims)}
  end

  @doc """
  The settings keys an extension type stores encrypted, read from the extension's own
  `db_settings/0` so tests stay in step when a key is added or dropped.
  """
  @spec encrypted_settings_keys(binary()) :: [binary()]
  def encrypted_settings_keys(type \\ "postgres_cdc_rls") do
    for {field, _checker, true} <- Extensions.db_settings(type).required, do: field
  end

  @doc """
  Rewrites a tenant's jwt_secret and every encrypted setting with the legacy AES-128-ECB cipher and
  clears `gcm_migrated_at`, putting it back in the state it had before the GCM rollout. Returns the
  tenant with its extensions reloaded.
  """
  @spec rewind_to_legacy_encryption(Tenant.t()) :: Tenant.t()
  def rewind_to_legacy_encryption(tenant) do
    {:ok, tenant} =
      tenant
      |> Ecto.Changeset.change(%{jwt_secret: to_legacy_cipher(tenant.jwt_secret), gcm_migrated_at: nil})
      |> Repo.update()

    %{tenant | extensions: Enum.map(tenant.extensions, &rewind_settings/1)}
  end

  defp rewind_settings(extension) do
    settings =
      for key <- encrypted_settings_keys(extension.type),
          is_binary(extension.settings[key]),
          reduce: extension.settings do
        acc -> Map.put(acc, key, to_legacy_cipher(extension.settings[key]))
      end

    {:ok, extension} = extension |> Ecto.Changeset.change(%{settings: settings}) |> Repo.update()
    extension
  end

  defp to_legacy_cipher(nil), do: nil
  defp to_legacy_cipher(ciphertext), do: ciphertext |> Crypto.decrypt!() |> Crypto.encrypt!(cipher: :ecb)
end
