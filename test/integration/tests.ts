import { RealtimeClient } from "npm:@supabase/supabase-js@latest";
import { sleep } from "https://deno.land/x/sleep/mod.ts";
import { describe, it } from "jsr:@std/testing/bdd";
import { assertEquals } from "jsr:@std/assert";
import { deadline } from "jsr:@std/async/deadline";

const withDeadline = <Fn extends (...args: never[]) => Promise<unknown>>(fn: Fn, ms: number): Fn =>
  ((...args) => deadline(fn(...args), ms)) as Fn;

const url = "http://realtime-dev.localhost:4100/socket";
const serviceRoleKey = "TEST_JWT_REDACTED"
const apiKey = "TEST_JWT_REDACTED";

const realtimeV1 = { vsn: '1.0.0', params: { apikey: apiKey } , heartbeatIntervalMs: 5000, timeout: 5000 };
const realtimeV2 = { vsn: '2.0.0', params: { apikey: apiKey } , heartbeatIntervalMs: 5000, timeout: 5000 };
const realtimeServiceRole = { vsn: '2.0.0', logger: console.log, params: { apikey: serviceRoleKey } , heartbeatIntervalMs: 5000, timeout: 5000 };

let clientV1: RealtimeClient | null;
let clientV2: RealtimeClient | null;

describe("broadcast extension", { sanitizeOps: false, sanitizeResources: false }, () => {
  it("users with different versions can receive self broadcast", withDeadline(async () => {
    clientV1 = new RealtimeClient(url, realtimeV1)
    clientV2 = new RealtimeClient(url, realtimeV2)
    let resultV1 = null;
    let resultV2 = null;
    let event = crypto.randomUUID();
    let topic = "topic:" + crypto.randomUUID();
    let expectedPayload = { message: crypto.randomUUID() };
    const config = { config: { broadcast: { ack: true, self: true } } };

    const channelV1 = clientV1
      .channel(topic, config)
      .on("broadcast", { event }, ({ payload }) => (resultV1 = payload))
      .subscribe();

    const channelV2 = clientV2
      .channel(topic, config)
      .on("broadcast", { event }, ({ payload }) => (resultV2 = payload))
      .subscribe();

    while (channelV1.state != "joined" || channelV2.state != "joined") await sleep(0.2);

    // Send from V1 client - both should receive
    await channelV1.send({
      type: "broadcast",
      event,
      payload: expectedPayload,
    });

    while (resultV1 == null || resultV2 == null) await sleep(0.2);

    assertEquals(resultV1, expectedPayload);
    assertEquals(resultV2, expectedPayload);

    // Reset results for second test
    resultV1 = null;
    resultV2 = null;
    let expectedPayload2 = { message: crypto.randomUUID() };

    // Send from V2 client - both should receive
    await channelV2.send({
      type: "broadcast",
      event,
      payload: expectedPayload2,
    });

    while (resultV1 == null || resultV2 == null) await sleep(0.2);

    assertEquals(resultV1, expectedPayload2);
    assertEquals(resultV2, expectedPayload2);

    await channelV1.unsubscribe();
    await channelV2.unsubscribe();

    await stopClient(clientV1);
    await stopClient(clientV2);
    clientV1 = null;
    clientV2 = null;
  }, 5000));

  it("v2 can send/receive binary payload", withDeadline(async () => {
    clientV2 = new RealtimeClient(url, realtimeV2)
    let result = null;
    let event = crypto.randomUUID();
    let topic = "topic:" + crypto.randomUUID();
    const expectedPayload = new ArrayBuffer(2);
    const uint8 = new Uint8Array(expectedPayload); // View the buffer as unsigned 8-bit integers
    uint8[0] = 125;
    uint8[1] = 255;

    const config = { config: { broadcast: { ack: true, self: true } } };

    const channelV2 = clientV2
      .channel(topic, config)
      .on("broadcast", { event }, ({ payload }) => (result = payload))
      .subscribe();

    while (channelV2.state != "joined") await sleep(0.2);

    await channelV2.send({
      type: "broadcast",
      event,
      payload: expectedPayload,
    });

    while (result == null) await sleep(0.2);

    assertEquals(result, expectedPayload);

    await channelV2.unsubscribe();

    await stopClient(clientV2);
    clientV2 = null;
  }, 5000));

  it("users with different versions can receive broadcasts from endpoint", withDeadline(async () => {
    clientV1 = new RealtimeClient(url, realtimeV1)
    clientV2 = new RealtimeClient(url, realtimeV2)
    let resultV1 = null;
    let resultV2 = null;
    let event = crypto.randomUUID();
    let topic = "topic:" + crypto.randomUUID();
    let expectedPayload = { message: crypto.randomUUID() };
    const config = { config: { broadcast: { ack: true, self: true } } };

    const channelV1 = clientV1
      .channel(topic, config)
      .on("broadcast", { event }, ({ payload }) => (resultV1 = payload))
      .subscribe();

    const channelV2 = clientV2
      .channel(topic, config)
      .on("broadcast", { event }, ({ payload }) => (resultV2 = payload))
      .subscribe();

    while (channelV1.state != "joined" || channelV2.state != "joined") await sleep(0.2);

    // Send from unsubscribed channel - both should receive
    new RealtimeClient(url, realtimeServiceRole).channel(topic, config).httpSend(event, expectedPayload);

    while (resultV1 == null || resultV2 == null) await sleep(0.2);

    assertEquals(resultV1, expectedPayload);
    assertEquals(resultV2, expectedPayload);

    await channelV1.unsubscribe();
    await channelV2.unsubscribe();

    await stopClient(clientV1);
    await stopClient(clientV2);
    clientV1 = null;
    clientV2 = null;
  }, 5000));
});

// describe("presence extension", () => {
//   it("user is able to receive presence updates", async () => {
//     let result: any = [];
//     let error = null;
//     let topic = "topic:" + crypto.randomUUID();
//     let keyV1 = "key V1";
//     let keyV2 = "key V2";
//
//     const configV1 = { config: { presence: { keyV1 } } };
//     const configV2 = { config: { presence: { keyV1 } } };
//
//     const channelV1 = clientV1
//       .channel(topic, configV1)
//       .on("presence", { event: "join" }, ({ key, newPresences }) =>
//         result.push({ key, newPresences })
//       )
//       .subscribe();
//
//     const channelV2 = clientV2
//       .channel(topic, configV2)
//       .on("presence", { event: "join" }, ({ key, newPresences }) =>
//         result.push({ key, newPresences })
//       )
//       .subscribe();
//
//     while (channelV1.state != "joined" || channelV2.state != "joined") await sleep(0.2);
//
//     const resV1 = await channelV1.track({ key: keyV1 });
//     const resV2 = await channelV2.track({ key: keyV2 });
//
//     if (resV1 == "timed out" || resV2 == "timed out") error = resV1 || resV2;
//
//     sleep(2.2);
//
//     // FIXME write assertions
//     console.log(result)
//     let presences = result[0].newPresences[0];
//     assertEquals(result[0].key, keyV1);
//     assertEquals(presences.message, message);
//     assertEquals(error, null);
//   });
// });

async function stopClient(client: RealtimeClient | null) {
  if (client) {
    await client.removeAllChannels();
  }
}
