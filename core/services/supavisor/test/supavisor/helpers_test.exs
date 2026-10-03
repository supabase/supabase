defmodule Supavisor.HelpersTest do
  use ExUnit.Case, async: true
  use ExUnitProperties

  @subject Supavisor.Helpers

  describe "validate_name/1" do
    test "Prisma migration databases are accepted" do
      assert @subject.validate_name(
               "prisma_migrate_shadow_db_dfe467a1-f7e4-4c27-87de-a930270f4622"
             )
    end

    property "ASCII strings with length within 1..63 are valid" do
      check all name <- string(:ascii, min_length: 1, max_length: 63) do
        assert @subject.validate_name(name)
      end
    end

    property "string that is longer that 63 characters is invalid" do
      check all name <- string(:printable, min_length: 64) do
        refute @subject.validate_name(name)
      end
    end

    property "printable strings with at most 63 *bytes* are valid" do
      check all name <- string(:printable, min_length: 1, max_length: 63) do
        # It is defined in weird way, as it is hard to generate strings with at
        # most 63 bytes, but that test is functionally equivalend
        assert @subject.validate_name(name) == byte_size(name) < 64
      end
    end

    property "non-printable strings are invalid" do
      check all prefix <- string(:utf8), suffix <- string(:utf8) do
        refute @subject.validate_name(prefix <> <<0>>)
        refute @subject.validate_name(<<0>> <> suffix)
        refute @subject.validate_name(prefix <> <<0>> <> suffix)

        refute @subject.validate_name(prefix <> <<0x10>>)
        refute @subject.validate_name(<<0x10>> <> suffix)
        refute @subject.validate_name(prefix <> <<0x10>> <> suffix)
      end
    end
  end

  describe "set_min_heap_size/1" do
    test "sets min heap size to configured value" do
      expected_words = Supavisor.Helpers.mb_to_words(100)
      parent = self()

      pid =
        spawn_link(fn ->
          Supavisor.Helpers.set_min_heap_size(100)
          send(parent, {self(), :done})
          Process.sleep(:infinity)
        end)

      receive do
        {^pid, :done} ->
          :ok
      after
        1000 ->
          flunk("Process did not finish setting min heap size in time")
      end

      {:min_heap_size, new_min_heap_words} = Process.info(pid, :min_heap_size)

      # Erlang rounds up to next valid heap size, so check it's at least expected
      assert new_min_heap_words >= expected_words
    end
  end

  describe "detect_ip_version/1" do
    test "IPv4 literal is detected" do
      assert @subject.detect_ip_version("127.0.0.1") == :inet
    end

    test "IPv6 literal is detected" do
      assert @subject.detect_ip_version("::1") == :inet6
      assert @subject.detect_ip_version("2406:da12:5ca:b700:451c:8500:ef25:2c7e") == :inet6
    end

    test "a real hostname still works" do
      # "localhost" isn't a literal address, so this exercises the unchanged
      # fallback branch. It should resolve locally without real DNS traffic
      # and must return one of the two valid families.
      assert @subject.detect_ip_version("localhost") in [:inet, :inet6]
    end
  end
end

defmodule Supavisor.HelpersJitAuthTest do
  use ExUnit.Case, async: true

  @subject Supavisor.Helpers

  describe "check_user_has_jit_role/4" do
    test "returns {:ok, true} when user has role" do
      Req.Test.stub(TestStubReq, fn conn ->
        Plug.Conn.put_status(conn, 200)
        |> Req.Test.json(%{
          "user_role" => %{"role" => "postgres"}
        })
      end)

      assert {:ok, true} =
               @subject.check_user_has_jit_role(
                 "https://fake.url",
                 "fake-token",
                 "postgres",
                 "10.0.0.1",
                 plug: {Req.Test, TestStubReq}
               )
    end

    test "returns {:error, :unauthorized_or_forbidden} when 401 or 403" do
      Req.Test.stub(TestStubReq, fn conn ->
        Plug.Conn.put_status(conn, 401)
        |> Req.Test.json(%{
          "message" => "unauthorized"
        })
      end)

      assert {:error, :unauthorized_or_forbidden} =
               @subject.check_user_has_jit_role(
                 "https://fake.url",
                 "fake-token",
                 "postgres",
                 "10.0.0.1",
                 plug: {Req.Test, TestStubReq}
               )

      Req.Test.stub(TestStubReq, fn conn ->
        Plug.Conn.put_status(conn, 403)
        |> Req.Test.json(%{
          "message" => "unauthorized"
        })
      end)

      assert {:error, :unauthorized_or_forbidden} =
               @subject.check_user_has_jit_role(
                 "https://fake.url",
                 "fake-token",
                 "postgres",
                 "10.0.0.1",
                 plug: {Req.Test, TestStubReq}
               )
    end

    test "returns {:error, {:unexpected_status, status}} on all other status" do
      Req.Test.stub(TestStubReq, fn conn ->
        Plug.Conn.put_status(conn, 500)
        |> Req.Test.json(%{
          "message" => "internal server error"
        })
      end)

      assert {:error, {:unexpected_status, 500}} =
               @subject.check_user_has_jit_role(
                 "https://fake.url",
                 "fake-token",
                 "postgres",
                 "10.0.0.1",
                 plug: {Req.Test, TestStubReq}
               )
    end
  end
end
