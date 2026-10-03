defmodule Realtime.Tenants.Connect.PiperTest do
  use ExUnit.Case, async: true

  import ExUnit.CaptureLog

  alias Realtime.Tenants.Connect.Piper

  defmodule Piper1 do
    @behaviour Piper
    def run(acc), do: {:ok, Map.put(acc, :piper1, "Piper1")}
  end

  defmodule Piper2 do
    @behaviour Piper
    def run(acc), do: Map.get(acc, :piper1) && {:ok, Map.put(acc, :piper2, "Piper2")}
  end

  defmodule Piper3 do
    @behaviour Piper
    def run(acc), do: Map.get(acc, :piper2) && {:ok, Map.put(acc, :piper3, "Piper3")}
  end

  defmodule PiperErr do
    @behaviour Piper
    def run(_acc), do: {:error, "PiperErr"}
  end

  defmodule PiperBadReturn do
    @behaviour Piper
    def run(_acc), do: nil
  end

  defmodule PiperException do
    @behaviour Piper
    def run(_acc), do: raise("PiperException")
  end

  @pipeline [__MODULE__.Piper1, __MODULE__.Piper2, __MODULE__.Piper3]
  test "runs pipeline as expected and accumlates outputs" do
    assert {:ok,
            %{
              piper1: "Piper1",
              piper2: "Piper2",
              piper3: "Piper3",
              initial: "state"
            }} = Piper.run(@pipeline, %{initial: "state"})
  end

  test "runs pipeline and handles error" do
    assert {:error, "PiperErr"} =
             Piper.run(@pipeline ++ [__MODULE__.PiperErr], %{
               initial: "state"
             })
  end

  test "runs pipeline and handles bad return with raise" do
    assert_raise ArgumentError, fn ->
      Piper.run(@pipeline ++ [__MODULE__.PiperBadReturn], %{})
    end
  end

  test "on pipeline job function, raises exception" do
    assert_raise RuntimeError, fn ->
      Piper.run(@pipeline ++ [__MODULE__.PiperException], %{})
    end
  end

  test "logs pipe execution times" do
    assert capture_log(fn ->
             assert {:error, "PiperErr"} =
                      Piper.run([__MODULE__.PiperErr], %{initial: "state"})
           end) =~ "Realtime.Tenants.Connect.PiperTest.PiperErr failed in "
  end
end
