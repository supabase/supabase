defmodule Supavisor.Asserts do
  @moduledoc """
  Additional assertions useful in Supavisor tests
  """

  @doc """
  Asserts that `function` will eventually success. Fails otherwise.

  It performs `repeats` checks with `delay` milliseconds between each check.
  """
  def assert_eventually(repeats \\ 5, delay \\ 1000, function)

  def assert_eventually(0, _, _) do
    raise ExUnit.AssertionError, message: "Expected function to return truthy value"
  end

  def assert_eventually(n, delay, func) do
    if func.() do
      :ok
    else
      Process.sleep(delay)
      assert_eventually(n - 1, delay, func)
    end
  end

  @doc """
  Asserts that `function` will eventually fail. Fails otherwise.

  It performs `repeats` checks with `delay` milliseconds between each check.
  """
  def refute_eventually(repeats \\ 5, delay \\ 1000, function)

  def refute_eventually(0, _, _) do
    raise ExUnit.AssertionError, message: "Expected function to return falsey value"
  end

  def refute_eventually(n, delay, func) do
    if func.() do
      Process.sleep(delay)
      refute_eventually(n - 1, delay, func)
    else
      :ok
    end
  end

  @valid_log_levels ~w(emergency alert critical error warning warn notice info debug)a

  @doc """
  Asserts that an error struct properly supports all implemented callbacks without crashing.

  Accepts `{:error, %ErrorStruct{}}` tuples and returns them for chaining.

  ## Example

      import Supavisor.Asserts

      test "my_function returns valid error" do
        assert {:error, %Supavisor.Errors.FooError{}} = e = Supavisor.my_fun()
        assert_valid_error(e)
      end
  """
  defmacro assert_valid_error(error) do
    quote generated: true do
      value = unquote(error)

      error_struct =
        case value do
          {:error, exception} when is_exception(exception) ->
            exception

          exception when is_exception(exception) ->
            exception

          other ->
            raise ExUnit.AssertionError,
              message: "expected an exception or error tuple, got #{inspect(other)}"
        end

      module = error_struct.__struct__

      if not (Code.ensure_loaded?(module) and function_exported?(module, :error_message, 1)) do
        raise ExUnit.AssertionError,
          message:
            "expected #{inspect(module)} to implement Supavisor.Error (error_message/1 not exported)"
      end

      try do
        _ = IO.iodata_to_binary(module.error_message(error_struct))
      rescue
        ArgumentError ->
          reraise %ExUnit.AssertionError{
                    message: "expected #{inspect(module)}.error_message/1 to return valid iodata"
                  },
                  __STACKTRACE__
      end

      message = module.message(error_struct)

      if not is_binary(message) do
        raise ExUnit.AssertionError,
          message:
            "expected #{inspect(module)}.message/1 to return a binary, got: #{inspect(message)}"
      end

      if not Regex.match?(~r/^\([A-Z0-9]+\)\s/, message) do
        raise ExUnit.AssertionError,
          message:
            "expected #{inspect(module)}.message/1 to contain error code pattern (ECODE), got: #{inspect(message)}"
      end

      log_message = module.log_message(error_struct)

      if not is_nil(log_message) do
        try do
          _ = IO.iodata_to_binary(log_message)
        rescue
          ArgumentError ->
            reraise %ExUnit.AssertionError{
                      message:
                        "expected #{inspect(module)}.log_message/1 to return valid iodata or nil"
                    },
                    __STACKTRACE__
        end
      end

      log_level = module.log_level(error_struct)

      if log_level not in unquote(@valid_log_levels) do
        raise ExUnit.AssertionError,
          message:
            "expected #{inspect(module)}.log_level/1 to return a valid Logger level, got: #{inspect(log_level)}"
      end

      postgres_error = module.postgres_error(error_struct)

      case postgres_error do
        nil ->
          :ok

        %{"S" => s, "C" => c, "M" => m} when is_binary(s) and is_binary(c) and is_binary(m) ->
          :ok

        other ->
          raise ExUnit.AssertionError,
            message:
              "expected #{inspect(module)}.postgres_error/1 to return nil or a map with \"S\", \"C\", \"M\" string keys, got: #{inspect(other)}"
      end

      {:error, error_struct}
    end
  end
end
