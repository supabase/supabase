defmodule RealtimeWeb.Channels.Payloads.JoinTest do
  use ExUnit.Case, async: true

  import Generators

  alias RealtimeWeb.Channels.Payloads.Join
  alias RealtimeWeb.Channels.Payloads.Config
  alias RealtimeWeb.Channels.Payloads.Broadcast
  alias RealtimeWeb.Channels.Payloads.Broadcast.Replay
  alias RealtimeWeb.Channels.Payloads.Presence
  alias RealtimeWeb.Channels.Payloads.PostgresChange
  alias RealtimeWeb.Channels.Payloads.PostgresChangesOptions

  describe "validate/1" do
    test "valid payload allows join" do
      key = random_string()
      access_token = random_string()

      config = %{
        "config" => %{
          "private" => false,
          "broadcast" => %{"ack" => false, "self" => false, "replay" => %{"since" => 1, "limit" => 10}},
          "presence" => %{"enabled" => true, "key" => key},
          "postgres_changes" => [
            %{"event" => "INSERT", "schema" => "public", "table" => "users", "filter" => "id=eq.1"},
            %{"event" => "DELETE", "schema" => "public", "table" => "users", "filter" => "id=eq.2"},
            %{"event" => "UPDATE", "schema" => "public", "table" => "users", "filter" => "id=eq.3"}
          ]
        },
        "access_token" => access_token
      }

      assert {:ok, %Join{config: config, access_token: ^access_token}} = Join.validate(config)

      assert %Config{
               private: false,
               broadcast: broadcast,
               presence: presence,
               postgres_changes: postgres_changes
             } = config

      assert %Broadcast{ack: false, self: false, replay: replay} = broadcast
      assert %Presence{enabled: true, key: ^key} = presence
      assert %Replay{since: 1, limit: 10} = replay

      assert [
               %PostgresChange{event: "INSERT", schema: "public", table: "users", filter: "id=eq.1"},
               %PostgresChange{event: "DELETE", schema: "public", table: "users", filter: "id=eq.2"},
               %PostgresChange{event: "UPDATE", schema: "public", table: "users", filter: "id=eq.3"}
             ] = postgres_changes
    end

    test "presence key as default" do
      config = %{"config" => %{"presence" => %{"enabled" => true}}}

      assert {:ok, %Join{config: %Config{presence: %Presence{}}} = join} = Join.validate(config)

      key = Join.presence_key(join)
      assert key != ""
      assert is_binary(key)
    end

    test "presence key can be number" do
      config = %{"config" => %{"presence" => %{"enabled" => true, "key" => 123}}}

      assert {:ok, %Join{config: %Config{presence: %Presence{key: key}}}} = Join.validate(config)

      assert key == 123
    end

    test "invalid replay" do
      config = %{"config" => %{"broadcast" => %{"replay" => 123}}}

      assert {
               :error,
               :invalid_join_payload,
               %{config: %{broadcast: %{replay: ["unable to parse, expected a map"]}}}
             } =
               Join.validate(config)
    end

    test "missing enabled presence defaults to false" do
      config = %{"config" => %{"presence" => %{}}}

      assert {:ok, %Join{config: %Config{presence: %Presence{enabled: false}}}} = Join.validate(config)
    end

    test "invalid payload returns errors" do
      config = %{"config" => ["test"]}

      assert {:error, :invalid_join_payload, %{config: error}} = Join.validate(config)
      assert error == ["unable to parse, expected a map"]
    end

    test "invalid nested configurations returns errors" do
      config = %{
        "config" => %{
          "broadcast" => %{"ack" => "test"},
          "presence" => %{"enabled" => "test"},
          "postgres_changes" => %{"event" => "test"}
        },
        "access_token" => true,
        "user_token" => true
      }

      assert {:error, :invalid_join_payload, errors} = Join.validate(config)

      assert errors == %{
               config: %{
                 broadcast: %{ack: ["unable to parse, expected boolean"]},
                 presence: %{enabled: ["unable to parse, expected boolean"]},
                 postgres_changes: ["unable to parse, expected an array of maps"]
               },
               access_token: ["unable to parse, expected string"],
               user_token: ["unable to parse, expected string"]
             }
    end

    test "handles postgres changes with nil value in array as empty array" do
      config = %{"config" => %{"postgres_changes" => [nil]}}

      assert {:ok, %Join{config: %Config{postgres_changes: []}}} = Join.validate(config)
    end

    test "handles postgres changes as nil as empty array" do
      config = %{"config" => %{"postgres_changes" => nil}}

      assert {:ok, %Join{config: %Config{postgres_changes: []}}} = Join.validate(config)
    end

    test "accepts string 'true' for boolean fields" do
      config = %{
        "config" => %{
          "private" => "true",
          "broadcast" => %{"ack" => "true", "self" => "true"},
          "presence" => %{"enabled" => "true"}
        }
      }

      assert {:ok, %Join{config: config_result}} = Join.validate(config)

      assert %Config{
               private: true,
               broadcast: %Broadcast{ack: true, self: true},
               presence: %Presence{enabled: true}
             } = config_result
    end

    test "accepts string 'True' for boolean fields" do
      config = %{
        "config" => %{
          "private" => "True",
          "broadcast" => %{"ack" => "True", "self" => "True"},
          "presence" => %{"enabled" => "True"}
        }
      }

      assert {:ok, %Join{config: config_result}} = Join.validate(config)

      assert %Config{
               private: true,
               broadcast: %Broadcast{ack: true, self: true},
               presence: %Presence{enabled: true}
             } = config_result
    end

    test "accepts string 'false' for boolean fields" do
      config = %{
        "config" => %{
          "private" => "false",
          "broadcast" => %{"ack" => "false", "self" => "false"},
          "presence" => %{"enabled" => "false"}
        }
      }

      assert {:ok, %Join{config: config_result}} = Join.validate(config)

      assert %Config{
               private: false,
               broadcast: %Broadcast{ack: false, self: false},
               presence: %Presence{enabled: false}
             } = config_result
    end

    test "accepts string 'False' for boolean fields" do
      config = %{
        "config" => %{
          "private" => "False",
          "broadcast" => %{"ack" => "False", "self" => "False"},
          "presence" => %{"enabled" => "False"}
        }
      }

      assert {:ok, %Join{config: config_result}} = Join.validate(config)

      assert %Config{
               private: false,
               broadcast: %Broadcast{ack: false, self: false},
               presence: %Presence{enabled: false}
             } = config_result
    end

    test "rejects invalid boolean strings" do
      config = %{
        "config" => %{
          "private" => "yes",
          "broadcast" => %{"ack" => "a", "self" => "b"},
          "presence" => %{"enabled" => "no"}
        }
      }

      assert {:error, :invalid_join_payload, errors} = Join.validate(config)

      assert errors == %{
               config: %{
                 private: ["unable to parse, expected boolean"],
                 broadcast: %{
                   ack: ["unable to parse, expected boolean"],
                   self: ["unable to parse, expected boolean"]
                 },
                 presence: %{enabled: ["unable to parse, expected boolean"]}
               }
             }
    end
  end

  describe "presence_enabled?/1" do
    test "returns enabled value from config" do
      join = %Join{config: %Config{presence: %Presence{enabled: false}}}
      refute Join.presence_enabled?(join)

      join = %Join{config: %Config{presence: %Presence{enabled: true}}}
      assert Join.presence_enabled?(join)
    end

    test "defaults to false when config is nil" do
      refute Join.presence_enabled?(%Join{config: nil})
    end

    test "defaults to false for non-Join struct" do
      refute Join.presence_enabled?(nil)
    end
  end

  describe "presence_key/1" do
    test "returns UUID when key is empty string" do
      join = %Join{config: %Config{presence: %Presence{key: ""}}}
      key = Join.presence_key(join)
      assert is_binary(key)
      assert key != ""
    end

    test "returns the configured key" do
      join = %Join{config: %Config{presence: %Presence{key: "my_key"}}}
      assert Join.presence_key(join) == "my_key"
    end

    test "returns UUID for non-matching struct" do
      key = Join.presence_key(%Join{config: nil})
      assert is_binary(key)
      assert key != ""
    end
  end

  describe "ack_broadcast?/1" do
    test "returns ack value from config" do
      join = %Join{config: %Config{broadcast: %Broadcast{ack: true}}}
      assert Join.ack_broadcast?(join)

      join = %Join{config: %Config{broadcast: %Broadcast{ack: false}}}
      refute Join.ack_broadcast?(join)
    end

    test "defaults to false when config is nil" do
      refute Join.ack_broadcast?(%Join{config: nil})
    end
  end

  describe "self_broadcast?/1" do
    test "returns self value from config" do
      join = %Join{config: %Config{broadcast: %Broadcast{self: true}}}
      assert Join.self_broadcast?(join)

      join = %Join{config: %Config{broadcast: %Broadcast{self: false}}}
      refute Join.self_broadcast?(join)
    end

    test "defaults to false when config is nil" do
      refute Join.self_broadcast?(%Join{config: nil})
    end
  end

  describe "private?/1" do
    test "returns private value from config" do
      join = %Join{config: %Config{private: true}}
      assert Join.private?(join)

      join = %Join{config: %Config{private: false}}
      refute Join.private?(join)
    end

    test "defaults to false when config is nil" do
      refute Join.private?(%Join{config: nil})
    end
  end

  describe "postgres_changes_options" do
    test "parses wait and timeout" do
      config = %{"config" => %{"postgres_changes_options" => %{"wait" => true, "timeout" => 10_000}}}

      assert {:ok, %Join{config: %Config{postgres_changes_options: options}} = join} = Join.validate(config)
      assert %PostgresChangesOptions{wait: true, timeout: 10_000} = options
      assert Join.postgres_changes_wait_timeout(join) == 10_000
    end

    test "does not wait when not asked to" do
      for config <- [%{"config" => %{}}, %{"config" => %{"postgres_changes_options" => %{}}}] do
        assert {:ok, join} = Join.validate(config)
        assert Join.postgres_changes_wait_timeout(join) == nil
      end
    end

    test "accepts string booleans for wait and defaults the timeout" do
      config = %{"config" => %{"postgres_changes_options" => %{"wait" => "true"}}}

      assert {:ok, join} = Join.validate(config)
      assert Join.postgres_changes_wait_timeout(join) == 15_000
    end

    test "clamps the timeout to the server maximum" do
      max = Application.fetch_env!(:realtime, :postgres_changes_wait_max_timeout)
      config = %{"config" => %{"postgres_changes_options" => %{"wait" => true, "timeout" => max * 10}}}

      assert {:ok, join} = Join.validate(config)
      assert Join.postgres_changes_wait_timeout(join) == max
    end

    test "invalid timeout returns errors" do
      config = %{"config" => %{"postgres_changes_options" => %{"timeout" => "soon"}}}

      assert {:error, :invalid_join_payload, errors} = Join.validate(config)
      assert errors == %{config: %{postgres_changes_options: %{timeout: ["unable to parse, expected integer"]}}}
    end

    test "non positive timeout returns errors" do
      config = %{"config" => %{"postgres_changes_options" => %{"timeout" => 0}}}

      assert {:error, :invalid_join_payload, %{config: %{postgres_changes_options: %{timeout: [_]}}}} =
               Join.validate(config)
    end

    test "non map options returns errors" do
      config = %{"config" => %{"postgres_changes_options" => 123}}

      assert {:error, :invalid_join_payload, errors} = Join.validate(config)
      assert errors == %{config: %{postgres_changes_options: ["unable to parse, expected a map"]}}
    end
  end

  describe "error_message/2" do
    test "returns message with type when type is present" do
      assert Join.error_message(:field, type: :string) == "unable to parse, expected string"
    end

    test "returns generic message when type is not present" do
      assert Join.error_message(:field, []) == "unable to parse"
    end
  end
end
