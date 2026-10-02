Deno.serve(async () => {
  let passed = false;
  try {
    const tcpConn = await Deno.connect({ hostname: "deno.land", port: 443 });
    const tlsConn = await Deno.startTls(tcpConn, {
      hostname: "foo.land",
      caCerts: [`-----BEGIN CERTIFICATE-----
MIIDIzCCAgugAwIBAgIJAMKPPW4tsOymMA0GCSqGSIb3DQEBCwUAMCcxCzAJBgNV
BAYTAlVTMRgwFgYDVQQDDA9FeGFtcGxlLVJvb3QtQ0EwIBcNMTkxMDIxMTYyODIy
WhgPMjExODA5MjcxNjI4MjJaMCcxCzAJBgNVBAYTAlVTMRgwFgYDVQQDDA9FeGFt
cGxlLVJvb3QtQ0EwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDMH/IO
2qtHfyBKwANNPB4K0q5JVSg8XxZdRpTTlz0CwU0oRO3uHrI52raCCfVeiQutyZop
eFZTDWeXGudGAFA2B5m3orWt0s+touPi8MzjsG2TQ+WSI66QgbXTNDitDDBtTVcV
5G3Ic+3SppQAYiHSekLISnYWgXLl+k5CnEfTowg6cjqjVr0KjL03cTN3H7b+6+0S
ws4rYbW1j4ExR7K6BFNH6572yq5qR20E6GqlY+EcOZpw4CbCk9lS8/CWuXze/vMs
OfDcc6K+B625d27wyEGZHedBomT2vAD7sBjvO8hn/DP1Qb46a8uCHR6NSfnJ7bXO
G1igaIbgY1zXirNdAgMBAAGjUDBOMB0GA1UdDgQWBBTzut+pwwDfqmMYcI9KNWRD
hxcIpTAfBgNVHSMEGDAWgBTzut+pwwDfqmMYcI9KNWRDhxcIpTAMBgNVHRMEBTAD
AQH/MA0GCSqGSIb3DQEBCwUAA4IBAQB9AqSbZ+hEglAgSHxAMCqRFdhVu7MvaQM0
P090mhGlOCt3yB7kdGfsIrUW6nQcTz7PPQFRaJMrFHPvFvPootkBUpTYR4hTkdce
H6RCRu2Jxl4Y9bY/uezd9YhGCYfUtfjA6/TH9FcuZfttmOOlxOt01XfNvVMIR6RM
z/AYhd+DeOXjr35F/VHeVpnk+55L0PYJsm1CdEbOs5Hy1ecR7ACuDkXnbM4fpz9I
kyIWJwk2zJReKcJMgi1aIinDM9ao/dca1G99PHOw8dnr4oyoTiv8ao6PWiSRHHMi
MNf4EgWfK+tZMnuqfpfO9740KzfcVoMNo4QJD4yn5YxroUOO/Azi
-----END CERTIFICATE-----
`],
    });

    await tlsConn.handshake();
  } catch (e) {
    passed = e instanceof Deno.errors.InvalidData;
  }

  return new Response(
    JSON.stringify({ passed }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
});
