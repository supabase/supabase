defmodule Realtime.Tenants.RepoTest do
  use Realtime.DataCase, async: true

  import Ecto.Query

  alias Realtime.Api.Message
  alias Realtime.Tenants.Repo
  alias Realtime.Database

  setup do
    tenant = TestTenantDb.checkout_tenant(run_migrations: true)
    {:ok, db_conn} = Database.connect(tenant, "realtime_test", :stop)
    %{tenant: tenant, db_conn: db_conn}
  end

  describe "all/3" do
    test "fetches multiple entries and loads a given struct", %{db_conn: db_conn, tenant: tenant} do
      message_1 = message_fixture(tenant)
      message_2 = message_fixture(tenant)

      assert {:ok, res} = Repo.all(db_conn, Message, Message)
      assert Enum.sort([message_1, message_2]) == Enum.sort(res)
      assert Enum.all?(res, &(Ecto.get_meta(&1, :state) == :loaded))
    end

    test "handles exceptions", %{db_conn: db_conn} do
      Process.unlink(db_conn)
      Process.exit(db_conn, :kill)

      assert {:error, :postgrex_exception} = Repo.all(db_conn, from(c in Message), Message)
    end
  end

  describe "one/3" do
    test "fetches one entry and loads a given struct", %{db_conn: db_conn, tenant: tenant} do
      message_1 = message_fixture(tenant)
      _message_2 = message_fixture(tenant)
      query = from(c in Message, where: c.id == ^message_1.id)
      assert {:ok, ^message_1} = Repo.one(db_conn, query, Message)
      assert Ecto.get_meta(message_1, :state) == :loaded
    end

    test "raises exception on multiple results", %{db_conn: db_conn, tenant: tenant} do
      _message_1 = message_fixture(tenant)
      _message_2 = message_fixture(tenant)

      assert_raise RuntimeError, "expected at most one result but got 2 in result", fn ->
        Repo.one(db_conn, Message, Message)
      end
    end

    test "if not found, returns not found error", %{db_conn: db_conn} do
      query = from(c in Message, where: c.topic == "potato")
      assert {:error, :not_found} = Repo.one(db_conn, query, Message)
    end

    test "handles exceptions", %{db_conn: db_conn} do
      Process.unlink(db_conn)
      Process.exit(db_conn, :kill)
      query = from(c in Message, where: c.topic == "potato")
      assert {:error, :postgrex_exception} = Repo.one(db_conn, query, Message)
    end
  end

  describe "insert/3" do
    test "inserts a new entry with a given changeset and returns struct", %{db_conn: db_conn} do
      changeset = Message.changeset(%Message{}, %{topic: "foo", extension: :presence})

      assert {:ok, %Message{}} = Repo.insert(db_conn, changeset, Message)
    end

    test "returns changeset if changeset is invalid", %{db_conn: db_conn} do
      changeset = Message.changeset(%Message{}, %{})
      res = Repo.insert(db_conn, changeset, Message)
      assert {:error, %Ecto.Changeset{valid?: false}} = res
    end

    test "returns a Changeset on Changeset error", %{db_conn: db_conn} do
      changeset = Message.changeset(%Message{}, %{})

      assert {:error,
              %Ecto.Changeset{
                valid?: false,
                errors: [
                  topic: {"can't be blank", [validation: :required]},
                  extension: {"can't be blank", [validation: :required]}
                ]
              }} =
               Repo.insert(db_conn, changeset, Message)
    end

    test "handles exceptions", %{db_conn: db_conn} do
      Process.unlink(db_conn)
      Process.exit(db_conn, :kill)

      changeset = Message.changeset(%Message{}, %{topic: "foo", extension: :presence})

      assert {:error, :postgrex_exception} = Repo.insert(db_conn, changeset, Message)
    end
  end

  describe "insert/4 with returning: false" do
    test "persists the row but returns only the sent fields, not the database row", %{db_conn: db_conn} do
      changeset = Message.changeset(%Message{}, %{topic: "foo", extension: :presence})

      assert {:ok, %Message{topic: "foo", extension: :presence} = message} =
               Repo.insert(db_conn, changeset, Message, returning: false)

      # No RETURNING clause, so the struct mirrors the changeset rather than the
      # loaded row: database-generated fields are absent and it is not marked loaded.
      assert is_nil(message.id)
      assert Ecto.get_meta(message, :state) == :built

      # The row is still inserted in the database.
      assert {:ok, [%Message{topic: "foo", extension: :presence, id: id}]} = Repo.all(db_conn, Message, Message)
      refute is_nil(id)
    end

    test "returns changeset if changeset is invalid", %{db_conn: db_conn} do
      changeset = Message.changeset(%Message{}, %{})

      assert {:error, %Ecto.Changeset{valid?: false}} = Repo.insert(db_conn, changeset, Message, returning: false)
    end

    test "handles exceptions", %{db_conn: db_conn} do
      Process.unlink(db_conn)
      Process.exit(db_conn, :kill)

      changeset = Message.changeset(%Message{}, %{topic: "foo", extension: :presence})

      assert {:error, :postgrex_exception} = Repo.insert(db_conn, changeset, Message, returning: false)
    end
  end

  describe "insert_all_entries/3" do
    test "inserts a new entries with a given changeset and returns struct", %{db_conn: db_conn} do
      changeset = [
        Message.changeset(%Message{}, %{topic: random_string(), extension: :presence}),
        Message.changeset(%Message{}, %{topic: random_string(), extension: :broadcast}),
        Message.changeset(%Message{}, %{topic: random_string(), extension: :presence}),
        Message.changeset(%Message{}, %{topic: random_string(), extension: :broadcast})
      ]

      assert {:ok, results} = Repo.insert_all_entries(db_conn, changeset, Message)
      assert Enum.all?(results, fn result -> is_map(result) end)
    end

    test "with returning: false skips RETURNING and returns the applied changesets", %{db_conn: db_conn} do
      id = Ecto.UUID.generate()
      {:ok, dumped_id} = Ecto.UUID.dump(id)

      changeset = [
        Message.changeset(%Message{}, %{topic: random_string(), extension: :broadcast})
        |> Ecto.Changeset.put_change(:id, dumped_id)
      ]

      assert {:ok, [%Message{} = message]} =
               Repo.insert_all_entries(db_conn, changeset, Message, returning: false)

      # No DB round-trip for the id: it is the value we supplied, not one loaded from RETURNING.
      assert message.id == dumped_id
    end

    test "returns changeset if changeset is invalid", %{db_conn: db_conn} do
      changeset = [Message.changeset(%Message{}, %{})]
      res = Repo.insert_all_entries(db_conn, changeset, Message)
      assert {:error, [%Ecto.Changeset{valid?: false}]} = res
    end

    test "returns a Changeset on Changeset error", %{db_conn: db_conn} do
      changeset = [Message.changeset(%Message{}, %{})]

      assert {:error,
              [
                %Ecto.Changeset{
                  valid?: false,
                  errors: [
                    topic: {"can't be blank", [validation: :required]},
                    extension: {"can't be blank", [validation: :required]}
                  ]
                }
              ]} =
               Repo.insert_all_entries(db_conn, changeset, Message)
    end

    test "handles exceptions", %{db_conn: db_conn} do
      Process.unlink(db_conn)
      Process.exit(db_conn, :kill)

      changeset = [Message.changeset(%Message{}, %{topic: "foo", extension: :presence})]

      assert {:error, :postgrex_exception} = Repo.insert_all_entries(db_conn, changeset, Message)
    end
  end

  describe "del/3" do
    test "deletes all from query entry", %{db_conn: db_conn, tenant: tenant} do
      Stream.repeatedly(fn -> message_fixture(tenant) end) |> Enum.take(3)
      assert {:ok, 3} = Repo.del(db_conn, Message)
    end

    test "raises error on bad queries", %{db_conn: db_conn} do
      # wrong id type
      query = from(c in Message, where: c.id == "potato")

      assert_raise Ecto.QueryError, fn ->
        Repo.del(db_conn, query)
      end
    end

    test "handles exceptions", %{db_conn: db_conn} do
      Process.unlink(db_conn)
      Process.exit(db_conn, :kill)

      assert {:error, :postgrex_exception} = Repo.del(db_conn, Message)
    end
  end

  describe "update/3" do
    test "updates a new entry with a given changeset and returns struct", %{
      db_conn: db_conn,
      tenant: tenant
    } do
      message = message_fixture(tenant)
      changeset = Message.changeset(message, %{topic: "foo"})
      assert {:ok, %Message{}} = Repo.update(db_conn, changeset, Message)
    end

    test "returns changeset if changeset is invalid", %{db_conn: db_conn, tenant: tenant} do
      message = message_fixture(tenant)
      changeset = Message.changeset(message, %{topic: 0})
      res = Repo.update(db_conn, changeset, Message)
      assert {:error, %Ecto.Changeset{valid?: false}} = res
    end

    test "returns an Changeset on Changeset error", %{db_conn: db_conn, tenant: tenant} do
      message_to_update = message_fixture(tenant)

      changeset = Message.changeset(message_to_update, %{topic: nil})

      assert {:error,
              %Ecto.Changeset{
                valid?: false,
                errors: [topic: {"can't be blank", [validation: :required]}]
              }} = Repo.update(db_conn, changeset, Message)
    end

    test "handles exceptions", %{tenant: tenant, db_conn: db_conn} do
      changeset = Message.changeset(message_fixture(tenant), %{topic: "foo"})

      Process.unlink(db_conn)
      Process.exit(db_conn, :kill)

      assert {:error, :postgrex_exception} = Repo.update(db_conn, changeset, Message)
    end
  end
end
