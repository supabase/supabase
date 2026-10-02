defmodule Realtime.Tracing do
  defmacro __using__(_opts) do
    quote do
      # Use Record module to extract fields of the Span record from the opentelemetry dependency.
      require Record
      @span_fields Record.extract(:span, from: "deps/opentelemetry/include/otel_span.hrl")
      @status_fields Record.extract(:status, from: "deps/opentelemetry_api/include/opentelemetry.hrl")
      @attributes_fields Record.extract(:attributes, from: "deps/opentelemetry_api/src/otel_attributes.erl")
      # Define macros for otel stuff
      Record.defrecordp(:span, @span_fields)
      Record.defrecordp(:status, @status_fields)
      Record.defrecordp(:attributes, @attributes_fields)
    end
  end
end
