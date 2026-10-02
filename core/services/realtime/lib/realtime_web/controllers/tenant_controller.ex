defmodule RealtimeWeb.TenantController do
  use RealtimeWeb, :controller
  use OpenApiSpex.ControllerSpecs

  use Realtime.Logs

  import Realtime.Logs

  alias Realtime.Api
  alias Realtime.Api.Tenant
  alias Realtime.Database
  alias Realtime.PostgresCdc
  alias Realtime.Tenants
  alias Realtime.Tenants.Cache
  alias Realtime.Tenants.Connect
  alias Realtime.Tenants.Migrations
  alias RealtimeWeb.OpenApiSchemas.EmptyResponse
  alias RealtimeWeb.OpenApiSchemas.ErrorResponse
  alias RealtimeWeb.OpenApiSchemas.MessageResponse
  alias RealtimeWeb.OpenApiSchemas.NotFoundResponse
  alias RealtimeWeb.OpenApiSchemas.TenantBulkHealthParams
  alias RealtimeWeb.OpenApiSchemas.TenantBulkHealthResponse
  alias RealtimeWeb.OpenApiSchemas.TenantHealthResponse
  alias RealtimeWeb.OpenApiSchemas.TenantParams
  alias RealtimeWeb.OpenApiSchemas.TenantResponse
  alias RealtimeWeb.OpenApiSchemas.TenantResponseList
  alias RealtimeWeb.OpenApiSchemas.UnauthorizedResponse
  alias RealtimeWeb.UserSocket

  @stop_timeout 10_000
  @max_refs 500

  action_fallback(RealtimeWeb.FallbackController)

  plug :set_observability_attributes when action in [:show, :edit, :update, :delete, :reload, :shutdown, :health]

  operation(:index,
    summary: "List tenants",
    parameters: [
      authorization: [
        in: :header,
        name: "Authorization",
        schema: %OpenApiSpex.Schema{type: :string},
        required: true,
        example:
          "Bearer TEST_JWT_REDACTED"
      ]
    ],
    responses: %{
      200 => TenantResponseList.response(),
      403 => EmptyResponse.response()
    }
  )

  def index(conn, _params) do
    tenants = Api.list_tenants()
    render(conn, "index.json", tenants: tenants)
  end

  operation(:show,
    summary: "Fetch tenant",
    parameters: [
      token: [
        in: :header,
        name: "Authorization",
        schema: %OpenApiSpex.Schema{type: :string},
        required: true,
        example:
          "Bearer TEST_JWT_REDACTED"
      ],
      tenant_id: [in: :path, description: "Tenant ID", type: :string]
    ],
    responses: %{
      200 => TenantResponse.response(),
      403 => EmptyResponse.response(),
      404 => NotFoundResponse.response()
    }
  )

  def show(conn, %{"tenant_id" => id}) do
    tenant = Api.get_tenant_by_external_id(id)

    case tenant do
      %Tenant{} = tenant -> render(conn, "show.json", tenant: tenant)
      nil -> {:error, :not_found}
    end
  end

  operation(:create,
    summary: "Create or update tenant",
    parameters: [
      token: [
        in: :header,
        name: "Authorization",
        schema: %OpenApiSpex.Schema{type: :string},
        required: true,
        example:
          "Bearer TEST_JWT_REDACTED"
      ]
    ],
    request_body: TenantParams.params(),
    responses: %{
      200 => TenantResponse.response(),
      403 => EmptyResponse.response()
    }
  )

  @spec create(any(), map()) :: any()
  def create(conn, %{"tenant" => params}) do
    external_id = Map.get(params, "external_id")

    case Tenant.changeset(%Tenant{}, params) do
      %{valid?: true} -> update(conn, %{"tenant_id" => external_id, "tenant" => params})
      changeset -> changeset
    end
  end

  operation(:update,
    summary: "Create or update tenant",
    parameters: [
      token: [
        in: :header,
        name: "Authorization",
        schema: %OpenApiSpex.Schema{type: :string},
        required: true,
        example:
          "Bearer TEST_JWT_REDACTED"
      ],
      tenant_id: [in: :path, description: "Tenant ID", type: :string]
    ],
    request_body: TenantParams.params(),
    responses: %{
      200 => TenantResponse.response(),
      403 => EmptyResponse.response()
    }
  )

  def update(conn, %{"tenant_id" => external_id, "tenant" => tenant_params}) do
    tenant_params = translate_postgres_changes_pool(tenant_params)
    tenant = Api.get_tenant_by_external_id(external_id, use_replica?: false)

    case tenant do
      nil ->
        tenant_params = tenant_params |> Map.put("external_id", external_id) |> Map.put("name", external_id)

        extensions =
          Enum.reduce(tenant_params["extensions"], [], fn
            %{"type" => type, "settings" => settings}, acc -> [%{"type" => type, "settings" => settings} | acc]
            _e, acc -> acc
          end)

        with {:ok, %Tenant{} = tenant} <- Api.create_tenant(%{tenant_params | "extensions" => extensions}),
             res when res in [:ok, :noop] <- Migrations.run_migrations(tenant) do
          Logger.metadata(external_id: tenant.external_id, project: tenant.external_id)

          conn
          |> put_status(:created)
          |> put_resp_header("location", Routes.tenant_path(conn, :show, tenant))
          |> render("show.json", tenant: tenant)
        end

      tenant ->
        with {:ok, %Tenant{} = tenant} <- Api.update_tenant_by_external_id(tenant.external_id, tenant_params) do
          conn
          |> put_status(:ok)
          |> put_resp_header("location", Routes.tenant_path(conn, :show, tenant))
          |> render("show.json", tenant: tenant)
        end
    end
  end

  operation(:delete,
    summary: "Delete tenant",
    parameters: [
      token: [
        in: :header,
        name: "Authorization",
        schema: %OpenApiSpex.Schema{type: :string},
        required: true,
        example:
          "Bearer TEST_JWT_REDACTED"
      ],
      tenant_id: [in: :path, description: "Tenant ID", type: :string]
    ],
    responses: %{
      204 => EmptyResponse.response(),
      403 => UnauthorizedResponse.response(),
      500 => ErrorResponse.response()
    }
  )

  def delete(conn, %{"tenant_id" => tenant_id}) do
    stop_all_timeout = Enum.count(PostgresCdc.available_drivers()) * 1_000

    with %Tenant{} = tenant <- Api.get_tenant_by_external_id(tenant_id, use_replica?: false),
         _ <- RealtimeWeb.UserSocket.disconnect(tenant_id),
         true <- Api.delete_tenant_by_external_id(tenant_id),
         :ok <- Cache.distributed_invalidate_tenant_cache(tenant_id),
         :ok <- Connect.shutdown(tenant_id),
         :ok <- PostgresCdc.stop_all(tenant, stop_all_timeout),
         :ok <- Database.replication_slot_teardown(tenant) do
      send_resp(conn, 204, "")
    else
      nil ->
        send_resp(conn, 204, "")

      err ->
        log_error("UnableToDeleteTenant", err)
        conn |> put_status(500) |> json(err) |> halt()
    end
  end

  operation(:reload,
    summary: "Reload tenant",
    parameters: [
      token: [
        in: :header,
        name: "Authorization",
        schema: %OpenApiSpex.Schema{type: :string},
        required: true,
        example:
          "Bearer TEST_JWT_REDACTED"
      ],
      tenant_id: [in: :path, description: "Tenant ID", type: :string]
    ],
    responses: %{
      204 => EmptyResponse.response(),
      403 => EmptyResponse.response(),
      404 => NotFoundResponse.response()
    }
  )

  def reload(conn, %{"tenant_id" => tenant_id}) do
    case Api.get_tenant_by_external_id(tenant_id, use_replica?: false) do
      nil ->
        {:error, :not_found}

      tenant ->
        PostgresCdc.stop_all(tenant, @stop_timeout)
        Connect.shutdown(tenant.external_id)
        UserSocket.disconnect(tenant.external_id)
        send_resp(conn, 204, "")
    end
  end

  operation(:shutdown,
    summary: "Shutdowns the Connect module for a tenant",
    parameters: [
      token: [
        in: :header,
        name: "Authorization",
        schema: %OpenApiSpex.Schema{type: :string},
        required: true,
        example:
          "Bearer TEST_JWT_REDACTED"
      ],
      tenant_id: [in: :path, description: "Tenant ID", type: :string]
    ],
    responses: %{
      204 => EmptyResponse.response(),
      403 => EmptyResponse.response(),
      404 => NotFoundResponse.response()
    }
  )

  def shutdown(conn, %{"tenant_id" => tenant_id}) do
    case Api.get_tenant_by_external_id(tenant_id, use_replica?: false) do
      nil ->
        {:error, :not_found}

      tenant ->
        Connect.shutdown(tenant.external_id)
        send_resp(conn, 204, "")
    end
  end

  operation(:health,
    summary: "Tenant health",
    parameters: [
      token: [
        in: :header,
        name: "Authorization",
        schema: %OpenApiSpex.Schema{type: :string},
        required: true,
        example:
          "Bearer TEST_JWT_REDACTED"
      ],
      tenant_id: [in: :path, description: "Tenant ID", type: :string]
    ],
    responses: %{
      200 => TenantHealthResponse.response(),
      403 => EmptyResponse.response(),
      404 => NotFoundResponse.response()
    }
  )

  def health(conn, %{"tenant_id" => tenant_id}) do
    case Tenants.health_check(tenant_id) do
      {:ok, response} -> json(conn, %{data: response})
      {:error, %{healthy: false} = response} -> json(conn, %{data: response})
      {:error, :tenant_not_found} -> {:error, :not_found}
    end
  end

  operation(:bulk_health,
    summary: "Bulk tenant presence",
    description: "Check if given references are present in our cluster",
    parameters: [
      token: [
        in: :header,
        name: "Authorization",
        schema: %OpenApiSpex.Schema{type: :string},
        required: true,
        example:
          "Bearer TEST_JWT_REDACTED"
      ]
    ],
    request_body: TenantBulkHealthParams.params(),
    responses: %{
      200 => TenantBulkHealthResponse.response(),
      403 => EmptyResponse.response(),
      422 => MessageResponse.response(),
      503 => MessageResponse.response()
    }
  )

  def bulk_health(conn, %{"refs" => refs}) when is_list(refs) do
    with :ok <- all_binary?(refs),
         :ok <- within_ref_limit?(refs),
         refs = Enum.uniq(refs),
         existing when is_list(existing) <- Api.list_existing_external_ids(refs) do
      existing = MapSet.new(existing)
      {present, missing} = Enum.split_with(refs, &MapSet.member?(existing, &1))
      json(conn, %{present: present, missing: missing})
    else
      {:error, status, reason} ->
        {:error, status, reason}

      {:error, e} ->
        log_error("BulkTenantHealthFailed", e)
        {:error, :service_unavailable, "unable to reach the tenants database"}
    end
  end

  def bulk_health(_conn, _params), do: {:error, :unprocessable_entity, "refs is required"}

  defp all_binary?(refs) do
    if Enum.all?(refs, &is_binary/1),
      do: :ok,
      else: {:error, :unprocessable_entity, "refs must be a list of strings"}
  end

  defp within_ref_limit?(refs) do
    if length(refs) < @max_refs,
      do: :ok,
      else: {:error, :unprocessable_entity, "refs exceeds the maximum of #{@max_refs}"}
  end

  # `postgres_changes_pool` is the public facing name for this setting to make it more explicit on intent
  defp translate_postgres_changes_pool(%{"extensions" => extensions} = params) when is_list(extensions),
    do: %{params | "extensions" => Enum.map(extensions, &translate_extension_pool/1)}

  defp translate_postgres_changes_pool(params), do: params

  defp translate_extension_pool(%{"settings" => %{"postgres_changes_pool" => pool} = settings} = extension) do
    settings = settings |> Map.delete("postgres_changes_pool") |> Map.put("subcriber_pool_size", pool)
    %{extension | "settings" => settings}
  end

  defp translate_extension_pool(extension), do: extension

  defp set_observability_attributes(conn, _opts) do
    tenant_id = conn.path_params["tenant_id"]
    OpenTelemetry.Tracer.set_attributes(external_id: tenant_id)
    Logger.metadata(external_id: tenant_id, project: tenant_id)

    conn
  end
end
