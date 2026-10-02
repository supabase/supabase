defmodule SupavisorWeb.OpenApiSchemas do
  @moduledoc """
  Providing schemas and response definitions for the OpenAPI specification of the SupavisorWeb
  """
  alias OpenApiSpex.Schema

  defmodule User do
    @moduledoc false
    require OpenApiSpex

    OpenApiSpex.schema(%{
      type: :object,
      properties: %{
        id: %Schema{type: :string, format: :binary_id, readOnly: true},
        tenant_external_id: %Schema{type: :string, description: "External Tenant ID"},
        db_user_alias: %Schema{type: :string, description: "Database user alias"},
        db_user: %Schema{type: :string, description: "Database user"},
        db_password: %Schema{type: :string, description: "Database password"},
        pool_size: %Schema{type: :integer, description: "Pool size"},
        mode_type: %Schema{type: :string, description: "Pooling mode type"},
        max_clients: %Schema{type: :integer, description: "Max clients count", nullable: true},
        pool_checkout_timeout: %Schema{type: :integer, description: "Pool checkout timeout"},
        is_manager: %Schema{
          type: :boolean,
          description: "The users who can be used for internal needs"
        },
        inserted_at: %Schema{type: :string, format: :date_time, readOnly: true},
        updated_at: %Schema{type: :string, format: :date_time, readOnly: true}
      },
      required: [
        :db_user,
        :db_password,
        :pool_size
      ],
      example: %{
        id: "b1024a4c-4eb4-4c64-8f49-c8a46c2b2e16",
        external_id: "dev_tenant",
        db_user_alias: "postgres",
        db_user: "postgres",
        db_password: "postgres",
        pool_size: 10,
        is_manager: false,
        max_clients: 25_000,
        mode_type: "transaction",
        inserted_at: "2023-03-27T12:00:00Z",
        updated_at: "2023-03-27T12:00:00Z"
      }
    })

    def response, do: {"User Response", "application/json", __MODULE__}
  end

  defmodule Tenant do
    @moduledoc false
    require OpenApiSpex

    OpenApiSpex.schema(%{
      type: :object,
      properties: %{
        id: %Schema{type: :string, format: :binary_id, readOnly: true},
        external_id: %Schema{type: :string, description: "External ID"},
        db_host: %Schema{type: :string, description: "Database host"},
        db_port: %Schema{type: :integer, description: "Database port"},
        db_database: %Schema{type: :string, description: "Database name"},
        ip_version: %Schema{type: :string, description: "auto"},
        require_user: %Schema{type: :boolean, description: false},
        sni_hostname: %Schema{type: :string, description: "your.domain.com", nullable: true},
        upstream_ssl: %Schema{type: :boolean, description: true},
        upstream_verify: %Schema{type: :string, description: "none", nullable: true},
        enforce_ssl: %Schema{type: :boolean, description: false},
        allow_list: %Schema{
          type: :array,
          description: "List of CIDR addresses",
          items: %Schema{type: :string}
        },
        auth_query: %Schema{
          type: :string,
          description: "SELECT rolname, rolpassword FROM pg_authid WHERE rolname=$1",
          nullable: true
        },
        users: %Schema{type: :array, items: User},
        banned_at: %Schema{
          type: :string,
          format: :date_time,
          description: "Ban timestamp",
          nullable: true
        },
        ban_reason: %Schema{type: :string, description: "Reason for ban", nullable: true},
        banned_until: %Schema{
          type: :string,
          format: :date_time,
          description: "Ban expiry timestamp",
          nullable: true
        },
        inserted_at: %Schema{type: :string, format: :date_time, readOnly: true},
        updated_at: %Schema{type: :string, format: :date_time, readOnly: true}
      },
      required: [
        :db_host,
        :db_port,
        :db_database,
        :users
      ],
      example: %{
        id: "b1024a4c-4eb4-4c64-8f49-c8a46c2b2e16",
        external_id: "dev_tenant",
        db_host: "localhost",
        db_port: 5432,
        db_database: "postgres",
        inserted_at: "2023-03-27T12:00:00Z",
        updated_at: "2023-03-27T12:00:00Z",
        allow_list: ["0.0.0.0/0", "::/0"],
        banned_at: "2026-01-01T00:00:00Z",
        ban_reason: "abuse",
        banned_until: "2926-04-01T00:00:00Z",
        users: [
          %{
            id: "b1024a4c-4eb4-4c64-8f49-c8a46c2b2e16",
            external_id: "dev_tenant",
            db_user_alias: "postgres",
            db_user: "postgres",
            db_password: "postgres",
            pool_size: 10,
            max_clients: 25_000,
            pool_checkout_timeout: 1000,
            is_manager: false,
            mode_type: "transaction",
            inserted_at: "2023-03-27T12:00:00Z",
            updated_at: "2023-03-27T12:00:00Z"
          }
        ]
      }
    })

    def response, do: {"Tenant Response", "application/json", __MODULE__}
  end

  defmodule TenantData do
    @moduledoc false
    require OpenApiSpex

    OpenApiSpex.schema(%{type: :object, properties: %{data: Tenant}, required: [:data]})

    def response, do: {"Tenant Show Response", "application/json", __MODULE__}
  end

  defmodule TenantList do
    @moduledoc false
    require OpenApiSpex

    OpenApiSpex.schema(%{type: :array, items: Tenant})
    def response, do: {"Tenant List Response", "application/json", __MODULE__}
  end

  defmodule TenantCreate do
    @moduledoc false
    require OpenApiSpex

    OpenApiSpex.schema(%{
      type: :object,
      properties: %{
        tenant: %Schema{
          type: :object,
          properties: %{
            id: %Schema{type: :string, format: :binary_id, readOnly: true},
            external_id: %Schema{type: :string, description: "External ID"},
            db_host: %Schema{type: :string, description: "Database host"},
            db_port: %Schema{type: :integer, description: "Database port"},
            db_database: %Schema{type: :string, description: "Database name"},
            ip_version: %Schema{type: :string, description: "auto"},
            require_user: %Schema{type: :boolean, description: false},
            sni_hostname: %Schema{type: :string, description: "your.domain.com"},
            upstream_ssl: %Schema{type: :boolean, description: true},
            upstream_verify: %Schema{type: :string, description: "none"},
            enforce_ssl: %Schema{type: :boolean, description: false},
            auth_query: %Schema{
              type: :string,
              description: "SELECT rolname, rolpassword FROM pg_authid WHERE rolname=$1"
            },
            users: %Schema{type: :array, items: User},
            inserted_at: %Schema{type: :string, format: :date_time, readOnly: true},
            updated_at: %Schema{type: :string, format: :date_time, readOnly: true},
            allow_list: %Schema{
              type: :array,
              description: "List of CIDR addresses",
              default: ["0.0.0.0/0", "::/0"]
            }
          },
          required: [
            :db_host,
            :db_port,
            :db_database,
            :users,
            :require_user
          ],
          example: %{
            db_host: "localhost",
            db_port: 5432,
            db_database: "postgres",
            ip_version: "auto",
            enforce_ssl: false,
            require_user: true,
            allow_list: ["0.0.0.0/0", "::/0"],
            users: [
              %{
                db_user: "postgres",
                db_password: "postgres",
                pool_size: 10,
                mode_type: "transaction",
                max_clients: 25_000,
                pool_checkout_timeout: 1000
              }
            ]
          }
        }
      },
      required: [:tenant]
    })

    def params, do: {"Tenant Create Params", "application/json", __MODULE__}
  end

  defmodule Created do
    @moduledoc false
    def response(schema), do: {"Created Response", "application/json", schema}
  end

  defmodule Empty do
    @moduledoc false
    require OpenApiSpex
    OpenApiSpex.schema(%{})

    def response, do: {"", "application/json", __MODULE__}
  end

  defmodule NotFound do
    @moduledoc false
    require OpenApiSpex
    OpenApiSpex.schema(%{})

    def response, do: {"Not found", "application/json", __MODULE__}
  end

  defmodule BadRequest do
    @moduledoc false
    require OpenApiSpex
    OpenApiSpex.schema(%{})

    def response, do: {"Bad request", "application/json", __MODULE__}
  end

  defmodule ServiceUnavailable do
    @moduledoc false
    require OpenApiSpex

    OpenApiSpex.schema(%{
      type: :object,
      properties: %{
        status: %Schema{
          type: :string,
          description: "Supavisor health status",
          default: "unhealthy"
        },
        timestamp: %Schema{
          type: :string,
          format: :date_time,
          description: "Timestamp of the health check"
        },
        failed_checks: %Schema{
          type: :array,
          items: %Schema{type: :string},
          description: "List of failed health check names"
        }
      }
    })

    def response, do: {"Service Unavailable", "application/json", __MODULE__}
  end

  defmodule UnprocessablyEntity do
    @moduledoc false
    require OpenApiSpex
    OpenApiSpex.schema(%{})

    def response, do: {"Unprocessable Entity", "application/json", __MODULE__}
  end

  defmodule UserCredentialsUpdate do
    @moduledoc false
    require OpenApiSpex

    OpenApiSpex.schema(%{
      type: :object,
      properties: %{
        db_user: %Schema{type: :string, description: "Database user"},
        db_password: %Schema{type: :string, description: "Database password"}
      },
      required: [:db_user, :db_password],
      example: %{
        db_user: "postgres",
        db_password: "new_password"
      }
    })

    def params, do: {"User Credentials Update Params", "application/json", __MODULE__}
  end

  defmodule NetworkBan do
    @moduledoc false
    require OpenApiSpex

    OpenApiSpex.schema(%{
      type: :object,
      properties: %{
        banned_address: %Schema{
          type: :string,
          description: "Banned IP address",
          example: "192.168.1.100"
        },
        banned_until: %Schema{
          type: :integer,
          minimum: 0,
          description: "Unix timestamp (seconds) when the ban expires"
        }
      },
      required: [:banned_address, :banned_until],
      example: %{
        banned_address: "192.168.1.100",
        banned_until: 1_706_549_400
      }
    })

    def response, do: {"Network Ban Response", "application/json", __MODULE__}
  end

  defmodule NetworkBanList do
    @moduledoc false
    require OpenApiSpex

    OpenApiSpex.schema(%{
      type: :object,
      properties: %{
        banned_ipv4_addresses: %Schema{
          type: :array,
          items: NetworkBan,
          description: "List of IP addresses banned due to authentication errors"
        }
      },
      required: [:banned_ipv4_addresses],
      example: %{
        banned_ipv4_addresses: [
          %{
            banned_address: "192.168.1.100",
            banned_until: 1_706_549_400
          },
          %{
            banned_address: "10.0.0.50",
            banned_until: 1_706_549_500
          }
        ]
      }
    })

    def response, do: {"Network Ban List Response", "application/json", __MODULE__}
  end

  defmodule ClearNetworkBans do
    @moduledoc false
    require OpenApiSpex

    OpenApiSpex.schema(%{
      type: :object,
      properties: %{
        ipv4_addresses: %Schema{
          type: :array,
          items: %Schema{type: :string},
          description: "List of IPv4 addresses to unban",
          example: ["192.168.1.100", "10.0.0.50"]
        }
      },
      required: [:ipv4_addresses],
      example: %{
        ipv4_addresses: ["192.168.1.100", "10.0.0.50"]
      }
    })

    def params, do: {"Clear Network Ban Params", "application/json", __MODULE__}
  end

  defmodule RebalanceParams do
    @moduledoc false
    require OpenApiSpex

    OpenApiSpex.schema(%{
      type: :object,
      properties: %{
        dry_run: %Schema{
          type: :boolean,
          description: "Only list the pools that would be moved",
          default: false
        },
        max_concurrency: %Schema{
          type: :integer,
          minimum: 1,
          description: "Pools stopped at the same time on each node",
          default: 100
        }
      },
      example: %{dry_run: true, max_concurrency: 100}
    })

    def params, do: {"Rebalance Params", "application/json", __MODULE__}
  end

  defmodule RebalanceMove do
    @moduledoc false
    require OpenApiSpex

    OpenApiSpex.schema(%{
      type: :object,
      properties: %{
        tenant: %Schema{type: :string, description: "External ID"},
        user: %Schema{type: :string, description: "Database user"},
        mode: %Schema{type: :string, description: "Pooling mode"},
        database: %Schema{type: :string, description: "Database name"},
        from_node: %Schema{type: :string, description: "Node the pool is moved from"},
        to_node: %Schema{type: :string, description: "Node the pool is moved to"}
      },
      required: [:tenant, :user, :mode, :database, :from_node, :to_node]
    })
  end

  defmodule Rebalance do
    @moduledoc false
    require OpenApiSpex

    OpenApiSpex.schema(%{
      type: :object,
      properties: %{
        moves: %Schema{type: :array, items: RebalanceMove},
        errors: %Schema{
          type: :object,
          additionalProperties: %Schema{type: :string},
          description: "Nodes that failed to rebalance, with the error"
        }
      },
      required: [:moves, :errors],
      example: %{
        moves: [
          %{
            tenant: "dev_tenant",
            user: "postgres",
            mode: "transaction",
            database: "postgres",
            from_node: "supavisor@10.0.0.1",
            to_node: "supavisor@10.0.0.2"
          }
        ],
        errors: %{}
      }
    })

    def response, do: {"Rebalance Response", "application/json", __MODULE__}
  end

  defmodule ToggleTenantBan do
    @moduledoc false
    require OpenApiSpex

    OpenApiSpex.schema(%{
      type: :object,
      properties: %{
        banned: %Schema{
          type: :boolean,
          description: "Set to true to ban the tenant, false to unban"
        },
        ban_reason: %Schema{
          type: :string,
          description: "Reason for the ban (required when banned is true)"
        },
        banned_until: %Schema{
          type: :string,
          format: :date_time,
          description: "Optional ban expiry timestamp"
        }
      },
      required: [:banned],
      example: %{
        banned: true,
        ban_reason: "Acceptable use policy violation",
        banned_until: "2026-01-01T00:00:00Z"
      }
    })

    def params, do: {"ToggleTenant Ban Params", "application/json", __MODULE__}
  end
end
