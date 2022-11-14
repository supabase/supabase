import React from "react";

type Watcher<T> = {
  subscribe: (callback: (value: T, prev?: T | undefined) => void) => () => void;
  notify: (value: T) => void;
  get: () => T;
};

export function createWatcher<T>(start?: T): Watcher<T> {
  const subscriptions = new Set<(value: T, prev?: T | undefined) => void>();
  let current = start;
  return {
    subscribe(callback) {
      subscriptions.add(callback);
      if (current !== undefined) {
        callback(current);
      }
      return () => {
        subscriptions.delete(callback);
      };
    },
    notify(value: T) {
      const prev = current;
      current = value;
      subscriptions.forEach((callback) => callback(value, prev));
    },
    get() {
      return current;
    },
  };
}

export function useSubscription<T>(watcher: Watcher<T>) {
  const [value, setValue] = React.useState<T | undefined>(watcher.get());
  React.useEffect(() => {
    return watcher.subscribe((v) => setValue(v));
  }, [watcher]);
  return value;
}

export function mergeWatchers<V1, V2, R>(
  a: Watcher<V1>,
  b: Watcher<V2>,
  merger: (v1: V1 | undefined, v2: V2 | undefined) => R | undefined
): Watcher<R> {
  const result = createWatcher<R>(merger(a.get(), b.get()));
  a.subscribe((v1) => result.notify(merger(v1, b.get())));
  b.subscribe((v2) => result.notify(merger(a.get(), v2)));
  return result;
}
