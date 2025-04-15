import { getQueryClient } from "@/providers/get-query-client";
import { SearchParams } from "nuqs";
import * as React from "react";
import { Client } from "./client";
import { dataOptions } from "./query-options";
import { searchParamsCache } from "./search-params";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const search = searchParamsCache.parse(await searchParams);
  const queryClient = getQueryClient();
  await queryClient.prefetchInfiniteQuery(dataOptions(search));

  return <Client />;
}
