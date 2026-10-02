defmodule Supavisor.TelemetryHelper do
  @moduledoc """
  Helper module for telemetry testing that can be loaded on peer nodes.
  """

  def handle_event([:supavisor, :client, :network, :stat], measurement, meta, {pid, ref}) do
    send(pid, {ref, {:client_network, measurement, meta}, Node.self()})
  end

  def handle_event([:supavisor, :db, :network, :stat], measurement, meta, {pid, ref}) do
    send(pid, {ref, {:db_network, measurement, meta}, Node.self()})
  end

  def handle_event([:supavisor, :client, :query, :stop], measurement, meta, {pid, ref}) do
    send(pid, {ref, {:client_query, measurement, meta}, Node.self()})
  end

  def handle_event([:supavisor, :client_handler, :state], measurement, meta, {pid, ref}) do
    send(pid, {ref, {:client_handler_state, measurement, meta}, Node.self()})
  end
end
