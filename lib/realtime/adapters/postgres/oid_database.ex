# CREDITS
# This file draws heavily from https://github.com/cainophile/pgoutput_decoder
# License: https://github.com/cainophile/pgoutput_decoder/blob/master/LICENSE

# Lifted from epgsql (src/epgsql_binary.erl), this module licensed under
# 3-clause BSD found here: https://raw.githubusercontent.com/epgsql/epgsql/devel/LICENSE

# https://github.com/brianc/node-pg-types/blob/master/lib/builtins.js
# MIT License (MIT)

#  Following query was used to generate this file:
#  SELECT json_object_agg(UPPER(PT.typname), PT.oid::int4 ORDER BY pt.oid)
#  FROM pg_type PT
#  WHERE typnamespace = (SELECT pgn.oid FROM pg_namespace pgn WHERE nspname = 'pg_catalog') -- Take only builting Postgres types with stable OID (extension types are not guaranteed to be stable)
#  AND typtype = 'b' -- Only basic types
#  AND typisdefined -- Ignore undefined types

defmodule Realtime.Adapters.Postgres.OidDatabase do
  @moduledoc "This module maps a numeric PostgreSQL type ID to a descriptive string."

  @doc """
  Maps a numeric PostgreSQL type ID to a descriptive string.

  ## Examples

      iex> name_for_type_id(1700)
      "numeric"

      iex> name_for_type_id(25)
      "text"

      iex> name_for_type_id(3802)
      "jsonb"

  """
  def name_for_type_id(type_id) do
    case type_id do
      16 -> "bool"
      17 -> "bytea"
      18 -> "char"
      19 -> "name"
      20 -> "int8"
      21 -> "int2"
      22 -> "int2vector"
      23 -> "int4"
      24 -> "regproc"
      25 -> "text"
      26 -> "oid"
      27 -> "tid"
      28 -> "xid"
      29 -> "cid"
      30 -> "oidvector"
      114 -> "json"
      142 -> "xml"
      143 -> "_xml"
      194 -> "pg_node_tree"
      199 -> "_json"
      210 -> "smgr"
      600 -> "point"
      601 -> "lseg"
      602 -> "path"
      603 -> "box"
      604 -> "polygon"
      628 -> "line"
      629 -> "_line"
      650 -> "cidr"
      651 -> "_cidr"
      700 -> "float4"
      701 -> "float8"
      702 -> "abstime"
      703 -> "reltime"
      704 -> "tinterval"
      718 -> "circle"
      719 -> "_circle"
      774 -> "macaddr8"
      775 -> "_macaddr8"
      790 -> "money"
      791 -> "_money"
      829 -> "macaddr"
      869 -> "inet"
      1000 -> "_bool"
      1001 -> "_bytea"
      1002 -> "_char"
      1003 -> "_name"
      1005 -> "_int2"
      1006 -> "_int2vector"
      1007 -> "_int4"
      1008 -> "_regproc"
      1009 -> "_text"
      1010 -> "_tid"
      1011 -> "_xid"
      1012 -> "_cid"
      1013 -> "_oidvector"
      1014 -> "_bpchar"
      1015 -> "_varchar"
      1016 -> "_int8"
      1017 -> "_point"
      1018 -> "_lseg"
      1019 -> "_path"
      1020 -> "_box"
      1021 -> "_float4"
      1022 -> "_float8"
      1023 -> "_abstime"
      1024 -> "_reltime"
      1025 -> "_tinterval"
      1027 -> "_polygon"
      1028 -> "_oid"
      1033 -> "aclitem"
      1034 -> "_aclitem"
      1040 -> "_macaddr"
      1041 -> "_inet"
      1042 -> "bpchar"
      1043 -> "varchar"
      1082 -> "date"
      1083 -> "time"
      1114 -> "timestamp"
      1115 -> "_timestamp"
      1182 -> "_date"
      1183 -> "_time"
      1184 -> "timestamptz"
      1185 -> "_timestamptz"
      1186 -> "interval"
      1187 -> "_interval"
      1231 -> "_numeric"
      1263 -> "_cstring"
      1266 -> "timetz"
      1270 -> "_timetz"
      1560 -> "bit"
      1561 -> "_bit"
      1562 -> "varbit"
      1563 -> "_varbit"
      1700 -> "numeric"
      1790 -> "refcursor"
      2201 -> "_refcursor"
      2202 -> "regprocedure"
      2203 -> "regoper"
      2204 -> "regoperator"
      2205 -> "regclass"
      2206 -> "regtype"
      2207 -> "_regprocedure"
      2208 -> "_regoper"
      2209 -> "_regoperator"
      2210 -> "_regclass"
      2211 -> "_regtype"
      2949 -> "_txid_snapshot"
      2950 -> "uuid"
      2951 -> "_uuid"
      2970 -> "txid_snapshot"
      3220 -> "pg_lsn"
      3221 -> "_pg_lsn"
      3361 -> "pg_ndistinct"
      3402 -> "pg_dependencies"
      3614 -> "tsvector"
      3615 -> "tsquery"
      3642 -> "gtsvector"
      3643 -> "_tsvector"
      3644 -> "_gtsvector"
      3645 -> "_tsquery"
      3734 -> "regconfig"
      3735 -> "_regconfig"
      3769 -> "regdictionary"
      3770 -> "_regdictionary"
      3802 -> "jsonb"
      3807 -> "_jsonb"
      3905 -> "_int4range"
      3907 -> "_numrange"
      3909 -> "_tsrange"
      3911 -> "_tstzrange"
      3913 -> "_daterange"
      3927 -> "_int8range"
      4089 -> "regnamespace"
      4090 -> "_regnamespace"
      4096 -> "regrole"
      4097 -> "_regrole"
      _ -> type_id
    end
  end
end
