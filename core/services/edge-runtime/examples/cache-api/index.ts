// Try to get data from the cache, but fall back to fetching it live.
async function getData() {
  const cacheVersion = 1;
  const cacheName = `myapp-${cacheVersion}`;
  const url = "https://jsonplaceholder.typicode.com/todos/1";
  let cachedData = await getCachedData(cacheName, url);

  return cachedData;
}

// Get data from the cache.
async function getCachedData(cacheName, url) {
  const cache = await caches.open(cacheName);

  const maybeCached = await cache.match(url);
  if (maybeCached) return maybeCached;

  console.log("Not found in cache, fetching");
  const response = await fetch(url);
  await cache.put(url, response.clone());

  return response;
}

Deno.serve(async () => {
  const response = await getData();

  const result = await response.json();

  console.log("Result: ", result);

  return Response.json(result);
});
