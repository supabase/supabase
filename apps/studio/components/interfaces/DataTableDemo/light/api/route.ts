import { InfiniteQueryResponse } from "@/app/infinite/query-options";
import type {
  BaseChartSchema,
  FacetMetadataSchema,
} from "@/app/infinite/schema";
import { differenceInMinutes, subDays } from "date-fns";
import type { NextRequest } from "next/server";
import SuperJSON from "superjson";
import type { ColumnType } from "../columns";
import { searchParamsCache } from "../search-params";

type _TemporalFacetsType = {
  facet: string;
  // REMINDER: some values need to be parsed as int
  value: string;
  count: number;
};

const PAGE_SIZE = 100;
const VERCEL_EDGE_PING_URL = "https://light.openstatus.dev";

export async function GET(req: NextRequest) {
  const cookieList = req.cookies.getAll();
  const tbEndpoint =
    cookieList.find((cookie) => cookie.name === "tb_endpoint")?.value ||
    VERCEL_EDGE_PING_URL;

  // TODO: we could use a POST request to avoid this
  const _search: Map<string, string> = new Map();
  req.nextUrl.searchParams.forEach((value, key) => _search.set(key, value));

  const search = searchParamsCache.parse(Object.fromEntries(_search));

  const baseParams = new URLSearchParams({
    ...(search.level?.length && { levels: search.level.join(",") }),
    ...(search.status?.length && { statuses: search.status.join(",") }),
    ...(search.method?.length && { methods: search.method.join(",") }),
    ...(search.region?.length && { regions: search.region.join(",") }),
    ...(search.latency?.length && {
      latencyStart: search.latency[0].toString(),
      latencyEnd: search.latency[search.latency.length - 1].toString(),
    }),
    ...(search.timestamp?.length && {
      timestampStart: search.timestamp[0].getTime().toString(),
      timestampEnd: search.timestamp[search.timestamp.length - 1]
        .getTime()
        .toString(),
    }),
  });

  const searchParams = new URLSearchParams(baseParams);
  const facetsParams = new URLSearchParams(baseParams);
  const statsParams = new URLSearchParams(baseParams);

  // NOTE: search params for get request
  searchParams.set("pageSize", PAGE_SIZE.toString());

  if (
    search.cursor &&
    search.timestamp?.length &&
    search.cursor.getTime() <=
      search.timestamp[search.timestamp.length - 1].getTime()
  ) {
    searchParams.set("timestampEnd", search.cursor.getTime().toString());
  } else if (!search.timestamp?.length) {
    searchParams.set("timestampEnd", search.cursor.getTime().toString());
  }

  // NOTE: stats params for get request
  if (search.timestamp?.length) {
    statsParams.set(
      "interval",
      evaluateInterval(search.timestamp)?.toString() ?? "1440",
    );
  } else {
    statsParams.set(
      "timestampStart",
      subDays(new Date(), 30).getTime().toString(),
    );
    statsParams.set("timestampEnd", new Date().getTime().toString());
    statsParams.set("interval", "1440");
  }

  // TODO: too many requests, especially when scrolling as stats/facets are not cached and are only needed for initial load
  const [dataRes, chartRes, facetsRes] = await Promise.all([
    fetch(`${tbEndpoint}/api/get?${searchParams.toString()}`),
    // TODO: we are missing filter in both, the stats and the facets - nothing urgent
    fetch(`${tbEndpoint}/api/stats?${statsParams.toString()}`),
    fetch(`${tbEndpoint}/api/facets?${facetsParams.toString()}`),
  ]);

  // TODO: we should not return empty data, but we need to handle the error case - ok for now
  if (!dataRes.ok || !chartRes.ok || !facetsRes.ok) {
    return Response.json(
      SuperJSON.stringify({
        data: [],
        prevCursor: null,
        nextCursor: null,
        meta: {
          chartData: [],
          facets: {},
          totalRowCount: 0,
          filterRowCount: 0,
        },
      } satisfies InfiniteQueryResponse<ColumnType[]>),
    );
  }

  // FIXME: too lazy for zod right now
  const { data, rows_before_limit_at_least: filterRowCount } =
    (await dataRes.json()) as {
      data: ColumnType[];
      // NOTE: automatically added by tb when using LIMIT
      rows_before_limit_at_least: number;
      // ... tb response values
    };
  const { data: chartData } = (await chartRes.json()) as {
    data: BaseChartSchema[];
  };
  const { data: _facets } = (await facetsRes.json()) as {
    data: _TemporalFacetsType[];
  };

  const facets = transformFacets(_facets);

  const lastTimestamp = data[data.length - 1]?.timestamp;
  const isLastPage = lastTimestamp && filterRowCount <= PAGE_SIZE;

  return Response.json(
    SuperJSON.stringify({
      data,
      prevCursor: null,
      nextCursor: isLastPage ? null : lastTimestamp - 1,
      meta: {
        chartData,
        facets,
        totalRowCount: facets["level"]?.total ?? 0,
        filterRowCount,
      },
    } satisfies InfiniteQueryResponse<ColumnType[]>),
  );
}

/** ---------- UTILS ---------- */

function transformFacets(
  facets: _TemporalFacetsType[],
): Record<string, FacetMetadataSchema> {
  return facets.reduce(
    (acc, curr) => {
      const facet = acc[curr.facet] ?? {
        rows: [],
        total: 0,
      };
      if (curr.facet === "status") {
        facet.rows.push({
          value: parseInt(curr.value),
          total: curr.count,
        });
        // REMINDER: fugly but works and not many status codes so no performance hit
        facet.rows.sort((a, b) => a.value - b.value);
        facet.total += curr.count;
      } else if (curr.facet === "latency") {
        facet.rows.push({
          value: parseInt(curr.value),
          total: curr.count,
        });
        facet.total += curr.count;
        facet.min = Math.min(facet.min ?? 0, parseInt(curr.value));
        facet.max = Math.max(facet.max ?? 0, parseInt(curr.value));
      } else {
        facet.rows.push({
          value: curr.value,
          total: curr.count,
        });
        facet.total += curr.count;
      }

      acc[curr.facet] = facet;
      return acc;
    },
    {} as Record<string, FacetMetadataSchema>,
  );
}

function evaluateInterval(dates: Date[] | null): number | null {
  if (!dates) return null;
  if (dates.length < 1 || dates.length > 3) return null;

  const timeDiffInMinutes = Math.abs(differenceInMinutes(dates[0], dates[1]));

  if (timeDiffInMinutes < 60) return 1;
  // 2h
  if (timeDiffInMinutes < 120) return 5;
  // 4h
  if (timeDiffInMinutes < 240) return 10;
  // 8h
  if (timeDiffInMinutes < 480) return 30;
  // 12h
  if (timeDiffInMinutes < 1440) return 60;
  // 24h
  if (timeDiffInMinutes < 2880) return 60;
  // 48h
  if (timeDiffInMinutes < 5760) return 120;
  // 2d
  if (timeDiffInMinutes < 11520) return 240;
  // 4d
  if (timeDiffInMinutes < 23040) return 480;
  // 8d
  if (timeDiffInMinutes < 46080) return 1440;
  // 16d
  if (timeDiffInMinutes < 92160) return 1440;
  // 32d
  if (timeDiffInMinutes < 184320) return 2880;
  // 64d
  if (timeDiffInMinutes < 368640) return 5760;
  // 128d
  if (timeDiffInMinutes < 737280) return 11520;
  // 256d
  if (timeDiffInMinutes < 1474560) return 23040;
  // 512d
  return 46080;
}
