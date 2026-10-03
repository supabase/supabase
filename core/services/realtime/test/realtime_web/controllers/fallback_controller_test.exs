defmodule RealtimeWeb.FallbackControllerTest do
  use RealtimeWeb.ConnCase, async: true

  import ExUnit.CaptureLog

  alias RealtimeWeb.FallbackController

  describe "call/2" do
    test "returns 404 with not found message", %{conn: conn} do
      conn = FallbackController.call(conn, {:error, :not_found})

      assert json_response(conn, 404) == %{"message" => "not found"}
    end

    test "returns 422 with changeset errors", %{conn: conn} do
      changeset =
        {%{}, %{name: :string}}
        |> Ecto.Changeset.cast(%{name: 123}, [:name])

      conn = FallbackController.call(conn, {:error, changeset})

      assert %{"errors" => _} = json_response(conn, 422)
    end

    test "returns custom status with message", %{conn: conn} do
      conn = FallbackController.call(conn, {:error, :bad_request, "invalid input"})

      assert json_response(conn, 400) == %{"message" => "invalid input"}
    end

    test "does not log UnprocessableEntity for non-422 statuses", %{conn: conn} do
      log =
        capture_log(fn ->
          conn = FallbackController.call(conn, {:error, :forbidden, "Tenant is suspended"})

          assert json_response(conn, 403) == %{"message" => "Tenant is suspended"}
        end)

      refute log =~ "UnprocessableEntity"
    end

    test "logs UnprocessableEntity for 422 status with message", %{conn: conn} do
      log =
        capture_log(fn ->
          conn = FallbackController.call(conn, {:error, :unprocessable_entity, "invalid input"})

          assert json_response(conn, 422) == %{"message" => "invalid input"}
        end)

      assert log =~ "UnprocessableEntity: invalid input"
    end

    test "returns 401 for generic error tuple", %{conn: conn} do
      conn = FallbackController.call(conn, {:error, "something went wrong"})

      assert json_response(conn, 401) == %{"message" => "Unauthorized"}
    end

    test "returns 422 for bare invalid changeset", %{conn: conn} do
      changeset =
        {%{}, %{name: :string}}
        |> Ecto.Changeset.cast(%{name: 123}, [:name])
        |> Map.put(:valid?, false)

      conn = FallbackController.call(conn, changeset)

      assert %{"errors" => _} = json_response(conn, 422)
    end

    test "returns 422 for unknown error format", %{conn: conn} do
      conn = FallbackController.call(conn, :unexpected_value)

      assert json_response(conn, 422) == %{"message" => "Unknown error"}
    end
  end
end
