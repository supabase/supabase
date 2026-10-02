defmodule RealtimeWeb.OpenApiSchemas do
  @moduledoc """
  Provides schemas and response definitions for RealtimeWeb OpenAPI specification.
  """

  alias OpenApiSpex.Schema

  defmodule ChannelParams do
    @moduledoc false
    require OpenApiSpex

    OpenApiSpex.schema(%{
      type: :object,
      properties: %{
        name: %Schema{
          type: :string,
          description: "Channel Name",
          example: "channel-1"
        }
      }
    })

    def params, do: {"Channel Params", "application/json", __MODULE__}
  end

  defmodule TenantBatchParams do
    @moduledoc false
    require OpenApiSpex

    OpenApiSpex.schema(%{
      type: :object,
      properties: %{
        messages: %Schema{
          type: :array,
          items: %Schema{
            type: :object,
            properties: %{
              topic: %Schema{
                type: :string,
                description:
                  "Note: libraries will prepend the channel name with 'realtime:' so if you use this endpoint directly you'll need to also prepend 'realtime:' so it's captured by clients properly"
              },
              payload: %Schema{type: :object},
              event: %Schema{
                type: :string,
                description: "Name of the event being broadcast"
              },
              private: %Schema{type: :boolean}
            }
          }
        }
      }
    })

    def params, do: {"Tenant Batch Params", "application/json", __MODULE__}
  end

  defmodule BroadcastSingleJsonParams do
    @moduledoc false
    require OpenApiSpex

    OpenApiSpex.schema(%{
      type: :object,
      description: "JSON payload - any valid JSON object",
      example: %{"text" => "hello world", "user" => "alice"}
    })
  end

  defmodule BroadcastSingleBinaryParams do
    @moduledoc false
    require OpenApiSpex

    OpenApiSpex.schema(%{
      type: :string,
      format: :binary,
      description: "Binary payload - raw binary data"
    })
  end

  defmodule TenantParams do
    @moduledoc false
    require OpenApiSpex

    OpenApiSpex.schema(%{
      type: :object,
      properties: %{
        tenant: %Schema{
          type: :object,
          properties: %{
            external_id: %Schema{type: :string, description: "External ID"},
            name: %Schema{type: :string, description: "Tenant name"},
            jwt_secret: %Schema{type: :string, description: "JWT secret"},
            jwt_jwks: %Schema{
              type: :object,
              description: "JWKS for verifying JWTs",
              properties: %{
                keys: %Schema{
                  type: :array,
                  description: "Set of JWKs",
                  items: %Schema{
                    type: :object,
                    description: "JWK"
                  }
                }
              }
            },
            max_concurrent_users: %Schema{
              type: :number,
              description: "Maximum connected concurrent clients"
            },
            max_events_per_second: %Schema{
              type: :number,
              description: "Maximum events, or messages, per second"
            },
            postgres_cdc_default: %Schema{
              type: :string,
              description: "Default Postgres CDC extension"
            },
            max_bytes_per_second: %Schema{type: :number, description: "Maximum bytes per second"},
            max_channels_per_client: %Schema{
              type: :number,
              description: "Maximum channels per WebSocket connection"
            },
            max_joins_per_second: %Schema{
              type: :number,
              description: "Maximum channel joins per second"
            },
            max_presence_events_per_second: %Schema{
              type: :number,
              description: "Maximum presence events per second"
            },
            max_payload_size_in_kb: %Schema{
              type: :number,
              description: "Maximum payload size in KB"
            },
            max_client_presence_events_per_window: %Schema{
              type: :number,
              description: "Maximum client presence events (overrides environment default when set)",
              nullable: true
            },
            client_presence_window_ms: %Schema{
              type: :number,
              description: "Client presence rate limit window in milliseconds (overrides environment default when set)",
              nullable: true
            },
            presence_enabled: %Schema{
              type: :boolean,
              description: "When true, presence is enabled for clients that do not explicitly opt in"
            },
            extensions: %Schema{
              type: :array,
              items: %Schema{
                type: :object,
                properties: %{
                  type: %Schema{type: :string, description: "Postgres CDC extension type"},
                  settings: %Schema{
                    type: :object,
                    description: "Extension database configuration"
                  },
                  tenant_external_id: %Schema{type: :string, description: "Tenant external ID"}
                },
                required: [
                  :settings,
                  :tenant_external_id
                ]
              }
            }
          },
          required: [
            :external_id,
            :jwt_secret
          ]
        }
      },
      required: [:tenant],
      example: %{
        tenant: %{
          external_id: "tenant-1",
          name: "First Tenant",
          jwt_secret: "4a218613-b539-4c52-adaa-64b14b25ee88",
          max_concurrent_users: 1000,
          max_events_per_second: 1000,
          postgres_cdc_default: "postgres_cdc_rls",
          max_bytes_per_second: 1000,
          max_channels_per_client: 100,
          max_joins_per_second: 1000,
          extensions: [
            %{
              type: "postgres_cdc_rls",
              settings: %{
                "region" => "us-west-1",
                "db_host" => "db_host",
                "db_name" => "postgres",
                "db_port" => "5432",
                "db_user" => "postgres",
                "slot_name" => "supabase_realtime_replication_slot",
                "db_password" => "password",
                "publication" => "supabase_realtime",
                "poll_interval_ms" => 100,
                "poll_max_changes" => 100,
                "poll_max_record_bytes" => 1_048_576
              },
              tenant_external_id: "tenant-1"
            }
          ]
        }
      }
    })

    def params, do: {"Tenant Params", "application/json", __MODULE__}
  end

  defmodule TenantResponseValue do
    @moduledoc false
    require OpenApiSpex

    OpenApiSpex.schema(%{
      type: :object,
      properties: %{
        id: %Schema{type: :string, description: "UUID"},
        external_id: %Schema{type: :string, description: "External ID"},
        name: %Schema{type: :string, description: "Tenant name"},
        max_concurrent_users: %Schema{
          type: :number,
          description: "Maximum connected concurrent clients"
        },
        max_channels_per_client: %Schema{
          type: :number,
          description: "Maximum channels per connected client"
        },
        max_events_per_second: %Schema{
          type: :number,
          description: "Maximum number of events, or messages, that all connected clients are permitted to send"
        },
        max_joins_per_second: %Schema{
          type: :number,
          description: "Maximum number of channel joins permitted for all connected clients"
        },
        jwt_jwks: %Schema{
          type: :object,
          description: "JWKS for verifying JWTs",
          properties: %{
            keys: %Schema{
              type: :array,
              description: "Set of JWKs",
              items: %Schema{
                type: :object,
                description: "JWK"
              }
            }
          }
        },
        max_client_presence_events_per_window: %Schema{
          type: :number,
          description: "Maximum client presence events (overrides environment default when set)",
          nullable: true
        },
        client_presence_window_ms: %Schema{
          type: :number,
          description: "Client presence rate limit window in milliseconds (overrides environment default when set)",
          nullable: true
        },
        inserted_at: %Schema{type: :string, format: "date-time", description: "Insert timestamp"},
        extensions: %Schema{
          type: :array,
          items: %Schema{
            type: :object,
            properties: %{
              type: %Schema{type: :string, description: "Postgres CDC extension type"},
              settings: %Schema{type: :object, description: "Extension database configuration"},
              tenant_external_id: %Schema{type: :string, description: "Tenant external ID"},
              inserted_at: %Schema{
                type: :string,
                format: "date-time",
                description: "Insert timestamp"
              },
              updated_at: %Schema{
                type: :string,
                format: "date-time",
                description: "Update timestamp"
              }
            },
            required: [
              :settings,
              :tenant_external_id
            ]
          }
        }
      },
      required: [
        :external_id,
        :jwt_secret
      ],
      example: %{
        id: "d4448862-666f-4af2-9966-78298e8af6bf",
        external_id: "tenant-1",
        name: "First Tenant",
        max_concurrent_users: 1000,
        max_channels_per_client: 100,
        max_events_per_second: 100,
        max_joins_per_second: 100,
        inserted_at: "2023-01-01T00:00:00Z",
        extensions: [
          %{
            type: "postgres_cdc_rls",
            settings: %{
              "region" => "us-west-1",
              "db_host" => "db_host",
              "db_name" => "postgres",
              "db_port" => "5432",
              "db_user" => "postgres",
              "slot_name" => "supabase_realtime_replication_slot",
              "db_password" => "password",
              "publication" => "supabase_realtime",
              "poll_interval_ms" => 100,
              "poll_max_changes" => 100,
              "poll_max_record_bytes" => 1_048_576
            },
            tenant_external_id: "tenant-1",
            inserted_at: "2023-01-01T00:00:00Z",
            updated_at: "2023-01-01T00:00:00Z"
          }
        ]
      }
    })
  end

  defmodule ChannelResponseValue do
    @moduledoc false
    require OpenApiSpex

    OpenApiSpex.schema(%{
      type: :object,
      properties: %{
        id: %Schema{type: :integer, description: "Channel ID"},
        name: %Schema{type: :string, description: "Channel Name"},
        inserted_at: %Schema{type: :string, format: "date-time", description: "Insert timestamp"},
        updated_at: %Schema{type: :string, format: "date-time", description: "Update timestamp"}
      },
      required: [:id, :name, :inserted_at, :updated_at],
      example: %{
        id: 1,
        name: "channel-1",
        inserted_at: "2023-01-01T00:00:00Z",
        updated_at: "2023-01-01T00:00:00Z"
      }
    })
  end

  defmodule TenantHealthResponseValue do
    @moduledoc false
    require OpenApiSpex

    OpenApiSpex.schema(%{
      type: :object,
      properties: %{
        healthy: %Schema{type: :boolean, description: "Tenant is healthy or not"},
        db_connected: %Schema{
          type: :boolean,
          description: "Indicates if Realtime has an active connection to the tenant database"
        },
        replication_connected: %Schema{
          type: :boolean,
          description: "Indicates if Realtime has an active replication connection for broadcast changes"
        },
        connected_cluster: %Schema{
          type: :integer,
          description: "The count of currently connected clients for a tenant on the Realtime cluster"
        }
      },
      required: [
        :healthy,
        :db_connected,
        :replication_connected,
        :connected_cluster
      ],
      example: %{
        healthy: true,
        db_connected: true,
        replication_connected: true,
        connected_cluster: 10
      }
    })
  end

  defmodule TenantHealthResponse do
    @moduledoc false
    require OpenApiSpex

    OpenApiSpex.schema(%{
      type: :object,
      properties: %{data: TenantHealthResponseValue}
    })

    def response, do: {"Tenant Response", "application/json", __MODULE__}
  end

  defmodule MessageResponse do
    @moduledoc false
    require OpenApiSpex

    OpenApiSpex.schema(%{
      type: :object,
      properties: %{message: %Schema{type: :string, description: "Reason the request was rejected"}},
      required: [:message]
    })

    def response, do: {"Message", "application/json", __MODULE__}
  end

  defmodule TenantBulkHealthParams do
    @moduledoc false
    require OpenApiSpex

    OpenApiSpex.schema(%{
      type: :object,
      properties: %{
        refs: %Schema{
          type: :array,
          items: %Schema{type: :string},
          maxItems: 500,
          description: "Project references to look up"
        }
      },
      required: [:refs],
      example: %{refs: ["abcdefghijklmnopqrst", "tsrqponmlkjihgfedcba"]}
    })

    def params, do: {"Tenant Bulk Health Params", "application/json", __MODULE__}
  end

  defmodule TenantBulkHealthResponse do
    @moduledoc false
    require OpenApiSpex

    OpenApiSpex.schema(%{
      type: :object,
      properties: %{
        present: %Schema{
          type: :array,
          items: %Schema{type: :string},
          description: "References that have a tenant on this cluster"
        },
        missing: %Schema{
          type: :array,
          items: %Schema{type: :string},
          description: "References that do not have a tenant on this cluster"
        }
      },
      required: [:present, :missing],
      example: %{present: ["abcdefghijklmnopqrst"], missing: ["tsrqponmlkjihgfedcba"]}
    })

    def response, do: {"Tenant Bulk Health Response", "application/json", __MODULE__}
  end

  defmodule TenantResponse do
    @moduledoc false
    require OpenApiSpex

    OpenApiSpex.schema(%{
      type: :object,
      properties: %{data: TenantResponseValue}
    })

    def response, do: {"Tenant Response", "application/json", __MODULE__}
  end

  defmodule TenantResponseList do
    @moduledoc false
    require OpenApiSpex

    OpenApiSpex.schema(%{
      type: :object,
      properties: %{data: %Schema{type: :array, items: TenantResponseValue}}
    })

    def response, do: {"Tenant List Response", "application/json", __MODULE__}
  end

  defmodule ChannelResponse do
    @moduledoc false
    require OpenApiSpex

    OpenApiSpex.schema(%{
      type: :object,
      properties: %{data: ChannelResponseValue}
    })

    def response, do: {"Tenant Response", "application/json", __MODULE__}
  end

  defmodule ChannelResponseList do
    @moduledoc false
    require OpenApiSpex

    OpenApiSpex.schema(%{
      type: :object,
      properties: %{data: %Schema{type: :array, items: ChannelResponseValue}}
    })

    def response, do: {"Tenant List Response", "application/json", __MODULE__}
  end

  defmodule EmptyResponse do
    @moduledoc false
    require OpenApiSpex

    OpenApiSpex.schema(%{
      type: :string,
      default: ""
    })

    def response, do: {"Empty Response", "application/json", __MODULE__}
  end

  defmodule NotFoundResponse do
    @moduledoc false
    require OpenApiSpex

    OpenApiSpex.schema(%{
      type: :object,
      properties: %{
        error: %Schema{type: :string, default: "not found"}
      }
    })

    def response, do: {"Not Found", "application/json", __MODULE__}
  end

  defmodule ErrorResponse do
    @moduledoc false
    require OpenApiSpex

    OpenApiSpex.schema(%{
      type: :object,
      properties: %{
        error: %Schema{type: :string, default: "error message"}
      }
    })

    def response, do: {"Error", "application/json", __MODULE__}
  end

  defmodule UnauthorizedResponse do
    @moduledoc false
    require OpenApiSpex

    OpenApiSpex.schema(%{
      type: :object,
      properties: %{
        error: %Schema{type: :string, default: "unauthorized"}
      }
    })

    def response, do: {"Unauthorized", "application/json", __MODULE__}
  end

  defmodule UnprocessableEntityResponse do
    @moduledoc false
    require OpenApiSpex

    OpenApiSpex.schema(%{
      type: :object,
      properties: %{
        error: %Schema{
          type: :object,
          properties: %{
            messages: %Schema{
              type: :array,
              items: %Schema{type: :object}
            }
          }
        }
      }
    })

    def response, do: {"Unprocessable Entity", "application/json", __MODULE__}
  end

  defmodule TooManyRequestsResponse do
    @moduledoc false
    require OpenApiSpex

    OpenApiSpex.schema(%{
      type: :object,
      properties: %{
        error: %Schema{
          type: :object,
          properties: %{
            messages: %Schema{
              type: :array,
              items: %Schema{type: :object}
            }
          }
        }
      }
    })

    def response, do: {"Too Many Requests", "application/json", __MODULE__}
  end
end
