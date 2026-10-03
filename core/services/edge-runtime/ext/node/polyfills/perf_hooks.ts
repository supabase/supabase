// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

// TODO(petamoriken): enable prefer-primordials for node polyfills
// deno-lint-ignore-file prefer-primordials

import { notImplemented } from "ext:deno_node/_utils.ts";
import {
  performance as shimPerformance,
  PerformanceEntry,
} from "ext:deno_web/15_performance.js";
import { EldHistogram } from "ext:core/ops";

class PerformanceObserver {
  static supportedEntryTypes: string[] = [];
  observe() {
    // todo(lucacasonato): actually implement this
  }
  disconnect() {
    // todo(lucacasonato): actually implement this
  }
}

const constants = {};

const performance:
  & Omit<
    Performance,
    "clearMeasures" | "getEntries"
  >
  & {
    eventLoopUtilization(): {
      idle: number;
      active: number;
      utilization: number;
    };
    nodeTiming: Record<string, string>;
    // deno-lint-ignore no-explicit-any
    timerify: any;
    // deno-lint-ignore no-explicit-any
    timeOrigin: any;
    // deno-lint-ignore no-explicit-any
    markResourceTiming: any;
  } = {
    clearMarks: (markName: string) => shimPerformance.clearMarks(markName),
    eventLoopUtilization: () => {
      // TODO(@marvinhagemeister): Return actual non-stubbed values
      return { idle: 0, active: 0, utilization: 0 };
    },
    mark: (markName: string) => shimPerformance.mark(markName),
    measure: (
      measureName: string,
      startMark?: string | PerformanceMeasureOptions,
      endMark?: string,
    ): PerformanceMeasure => {
      if (endMark) {
        return shimPerformance.measure(
          measureName,
          startMark as string,
          endMark,
        );
      } else {
        return shimPerformance.measure(
          measureName,
          startMark as PerformanceMeasureOptions,
        );
      }
    },
    nodeTiming: {},
    now: () => shimPerformance.now(),
    timerify: () => notImplemented("timerify from performance"),
    get timeOrigin() {
      // deno-lint-ignore no-explicit-any
      return (shimPerformance as any).timeOrigin;
    },
    getEntriesByName: (name, type) =>
      shimPerformance.getEntriesByName(name, type),
    getEntriesByType: (type) => shimPerformance.getEntriesByType(type),
    markResourceTiming: () => {},
    // @ts-ignore waiting on update in `deno`, but currently this is
    // a circular dependency
    toJSON: () => shimPerformance.toJSON(),
    addEventListener: (
      ...args: Parameters<typeof shimPerformance.addEventListener>
    ) => shimPerformance.addEventListener(...args),
    removeEventListener: (
      ...args: Parameters<typeof shimPerformance.removeEventListener>
    ) => shimPerformance.removeEventListener(...args),
    dispatchEvent: (
      ...args: Parameters<typeof shimPerformance.dispatchEvent>
    ) => shimPerformance.dispatchEvent(...args),
  };

function monitorEventLoopDelay(options = {}) {
  const { resolution = 10 } = options;

  return new EldHistogram(resolution);
}

export default {
  performance,
  PerformanceObserver,
  PerformanceEntry,
  monitorEventLoopDelay,
  constants,
};

export {
  constants,
  monitorEventLoopDelay,
  performance,
  PerformanceEntry,
  PerformanceObserver,
};
