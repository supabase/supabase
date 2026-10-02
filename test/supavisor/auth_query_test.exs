defmodule Supavisor.AuthQueryTest do
  use ExUnit.Case, async: true

  import Supavisor.Asserts

  alias Supavisor.AuthQuery
  alias Supavisor.Errors.AuthQueryError

  defp start_conn do
    db_conf = Application.get_env(:supavisor, Supavisor.Repo)

    {:ok, conn} =
      Postgrex.start_link(
        hostname: db_conf[:hostname],
        port: db_conf[:port],
        database: db_conf[:database],
        password: db_conf[:password],
        username: db_conf[:username]
      )

    conn
  end

  describe "parse_secret/2" do
    test "parses SCRAM-SHA-256 secrets correctly" do
      encoded_stored_key = Base.encode64("storedKey")
      encoded_server_key = Base.encode64("serverKey")
      encoded_salt = Base.encode64("salt")
      secret = "SCRAM-SHA-256$4000:#{encoded_salt}$#{encoded_stored_key}:#{encoded_server_key}"
      user = "user@example.com"

      assert {:ok,
              %Supavisor.Secrets.SASLSecrets{
                digest: "SCRAM-SHA-256",
                iterations: 4000,
                salt: "salt",
                stored_key: "storedKey",
                server_key: "serverKey",
                client_key: nil,
                user: ^user
              }} = AuthQuery.parse_secret(secret, user)
    end

    test "rejects md5 secrets" do
      assert {:error,
              %Supavisor.Errors.AuthQueryError{
                reason: :md5_not_supported,
                details: nil,
                code: "EAUTHQUERY"
              }} =
               AuthQuery.parse_secret("md5supersecret", "user")
    end

    test "returns error for unsupported secret format" do
      assert {:error, %AuthQueryError{reason: :unsupported_secret_format}} =
               result = AuthQuery.parse_secret("unsupported_secret", "user")

      assert_valid_error(result)
    end

    test "accepts SCRAM secrets at the iteration limit" do
      secret =
        "SCRAM-SHA-256$32768:#{Base.encode64("salt")}$#{Base.encode64("storedKey")}:#{Base.encode64("serverKey")}"

      assert {:ok, %Supavisor.Secrets.SASLSecrets{iterations: 32_768}} =
               AuthQuery.parse_secret(secret, "user")
    end

    test "rejects SCRAM secrets above the iteration limit" do
      secret =
        "SCRAM-SHA-256$32769:#{Base.encode64("salt")}$#{Base.encode64("storedKey")}:#{Base.encode64("serverKey")}"

      assert {:error,
              %AuthQueryError{
                reason: :too_many_iterations,
                details: "32769 exceeds the maximum of 32768"
              }} =
               result = AuthQuery.parse_secret(secret, "user")

      assert Exception.message(elem(result, 1)) =~
               "SCRAM secret iteration count 32769 exceeds the maximum of 32768"

      assert_valid_error(result)
    end

    test "returns error for malformed SCRAM secret" do
      assert {:error, %AuthQueryError{reason: :parse_error}} =
               result = AuthQuery.parse_secret("SCRAM-SHA-256$malformed", "user")

      assert_valid_error(result)
    end
  end

  describe "fetch_user_secret/3" do
    test "returns error when auth_query is nil" do
      assert {:error, %AuthQueryError{reason: :no_auth_query}} =
               result = AuthQuery.fetch_user_secret(self(), nil, "user")

      assert_valid_error(result)
    end

    test "fetches SCRAM secret successfully" do
      conn = start_conn()
      auth_query = "SELECT rolname, rolpassword FROM pg_authid WHERE rolname=$1"

      assert {:ok, %Supavisor.Secrets.SASLSecrets{user: "postgres"}} =
               AuthQuery.fetch_user_secret(conn, auth_query, "postgres")

      GenServer.stop(conn)
    end

    test "returns user_not_found for non-existent user" do
      conn = start_conn()
      auth_query = "SELECT rolname, rolpassword FROM pg_authid WHERE rolname=$1"

      assert {:error, %AuthQueryError{reason: :user_not_found}} =
               result = AuthQuery.fetch_user_secret(conn, auth_query, "nonexistent_user_xyz")

      assert_valid_error(result)
      GenServer.stop(conn)
    end

    test "returns query_failed for invalid query" do
      conn = start_conn()

      assert {:error, %AuthQueryError{reason: :query_failed, details: %Postgrex.Error{}}} =
               result =
               AuthQuery.fetch_user_secret(
                 conn,
                 "SELECT * FROM nonexistent_table WHERE u=$1",
                 "user"
               )

      assert_valid_error(result)
      GenServer.stop(conn)
    end

    test "returns wrong_format when query returns wrong number of columns" do
      conn = start_conn()

      assert {:error, %AuthQueryError{reason: :wrong_format}} =
               result =
               AuthQuery.fetch_user_secret(
                 conn,
                 "SELECT rolname, rolpassword, rolsuper FROM pg_authid WHERE rolname=$1",
                 "postgres"
               )

      assert_valid_error(result)
      GenServer.stop(conn)
    end

    test "returns query_failed for unreachable database" do
      {:ok, conn} =
        Postgrex.start_link(
          hostname: "invalid.nonexistent.host",
          port: 5432,
          database: "test"
        )

      assert {:error, %AuthQueryError{reason: :query_failed}} =
               result =
               AuthQuery.fetch_user_secret(
                 conn,
                 "SELECT rolname, rolpassword FROM pg_authid WHERE rolname=$1",
                 "user"
               )

      assert_valid_error(result)
      GenServer.stop(conn)
    end
  end
end
