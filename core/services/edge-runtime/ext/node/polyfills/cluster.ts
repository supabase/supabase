// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent and Node contributors. All rights reserved. MIT license.

import { notImplemented } from "ext:deno_node/_utils.ts";
import { EventEmitter } from "node:events";

/** A Worker object contains all public information and method about a worker.
 * In the primary it can be obtained using cluster.workers. In a worker it can
 * be obtained using cluster.worker.
 */
export class Worker {
  constructor() {
    notImplemented("cluster.Worker.prototype.constructor");
  }
}
/** Calls .disconnect() on each worker in cluster.workers. */
export function disconnect() {
  notImplemented("cluster.disconnect");
}
/** Spawn a new worker process. */
// deno-lint-ignore no-explicit-any
export function fork(_env?: any): Worker {
  notImplemented("cluster.fork");
}
/** True if the process is a primary. This is determined by
 * the process.env.NODE_UNIQUE_ID. If process.env.NODE_UNIQUE_ID is undefined,
 * then isPrimary is true. */
// TODO(@marvinhagemeister): Replace this with an env check once
// we properly set NODE_UNIQUE_ID
export const isPrimary = true;
/** True if the process is not a primary (it is the negation of
 * cluster.isPrimary). */
export const isWorker = false;
/** Deprecated alias for cluster.isPrimary. details. */
export const isMaster = isPrimary;
/** The scheduling policy, either cluster.SCHED_RR for round-robin or
 * cluster.SCHED_NONE to leave it to the operating system. This is a global
 * setting and effectively frozen once either the first worker is spawned, or
 * .setupPrimary() is called, whichever comes first. */
export const schedulingPolicy = undefined;
/** The settings object */
export const settings = {};
/** setupPrimary is used to change the default 'fork' behavior. Once called,
 * the settings will be present in cluster.settings. */
export function setupPrimary() {
  notImplemented("cluster.setupPrimary");
}
/** Deprecated alias for .setupPrimary(). */
export const setupMaster = setupPrimary;
/** A reference to the current worker object. Not available in the primary
 * process. */
export const worker = undefined;
/** A hash that stores the active worker objects, keyed by id field. Makes it
 * easy to loop through all the workers. It is only available in the primary
 * process. */
export const workers = {};

export const SCHED_NONE = 1;
export const SCHED_RR = 2;

const cluster = new EventEmitter() as EventEmitter & {
  isWorker: boolean;
  isMaster: boolean;
  isPrimary: boolean;
  Worker: Worker;
  workers: Record<string, Worker>;
  settings: Record<string, unknown>;
  // deno-lint-ignore no-explicit-any
  setupPrimary(options?: any): void;
  // deno-lint-ignore no-explicit-any
  setupMaster(options?: any): void;
  // deno-lint-ignore no-explicit-any
  fork(env: any): Worker;
  // deno-lint-ignore no-explicit-any
  disconnect(cb: any): void;
  SCHED_NONE: 1;
  SCHED_RR: 2;
};
cluster.isWorker = isWorker;
cluster.isMaster = isMaster;
cluster.isPrimary = isPrimary;
cluster.Worker = Worker;
cluster.workers = workers;
cluster.settings = {};
cluster.setupPrimary = setupPrimary;
cluster.setupMaster = setupMaster;
cluster.fork = fork;
cluster.disconnect = disconnect;
cluster.SCHED_NONE = SCHED_NONE;
cluster.SCHED_RR = SCHED_RR;

export default cluster;
