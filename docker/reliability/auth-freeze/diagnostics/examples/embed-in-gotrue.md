# Embedding freezekit into `supabase/auth` (a.k.a. GoTrue)

This is the recommended integration path. The freezekit package is
stdlib-only and adds nothing to GoTrue's transitive dependency tree.

The diff against upstream is ~30 lines spread across 3 files. Below
is the unified, copy-pasteable patch.

> **Sequencing:** roll out as the four-wave plan in
> `../README.md` § Phase 10. Wave 1 sets `FREEZEKIT_DISABLED=false`
> and `FREEZEKIT_DETECTOR_ENABLED=false`; only metrics are exposed.
> Waves 2–4 progressively enable sinks and the detector.

## 1. `cmd/serve.go`

```go
import (
    "github.com/supabase/diagnostics/freezekit"
)

func serve(cmd *cobra.Command, args []string) {
    // … existing setup …

    // ───── freezekit ────────────────────────────────────────────
    fkCfg := freezekit.LoadConfigFromEnv()
    // Optional: wire the in-process slog logger.
    fkCfg.Logger = logger

    // Optional: pick a sink based on env. If FREEZEKIT_SINK is
    // "noop" (default), this whole block is skipped.
    switch os.Getenv("FREEZEKIT_SINK") {
    case "local":
        local, err := freezekit.NewLocalSink(
            envOr("FREEZEKIT_LOCAL_DIR", "/var/freezekit"),
            256<<20, // 256 MiB
        )
        if err != nil {
            logger.WithError(err).Fatal("freezekit local sink")
        }
        fkCfg.Sink = local
    case "signed-url":
        fkCfg.Sink = &freezekit.SignedURLSink{
            SignURL:    os.Getenv("FREEZEKIT_SIGNER_URL"),
            AuthHeader: os.Getenv("FREEZEKIT_SIGNER_AUTH"),
            KeyPrefix:  os.Getenv("FREEZEKIT_KEY_PREFIX"),
        }
    case "multi":
        local, err := freezekit.NewLocalSink(
            envOr("FREEZEKIT_LOCAL_DIR", "/var/freezekit"),
            256<<20,
        )
        if err != nil {
            logger.WithError(err).Fatal("freezekit local sink")
        }
        fkCfg.Sink = freezekit.MultiSink{Sinks: []freezekit.Sink{
            local,
            &freezekit.SignedURLSink{
                SignURL:    os.Getenv("FREEZEKIT_SIGNER_URL"),
                AuthHeader: os.Getenv("FREEZEKIT_SIGNER_AUTH"),
                KeyPrefix:  os.Getenv("FREEZEKIT_KEY_PREFIX"),
            },
        }}
    }

    fk, err := freezekit.New(fkCfg)
    if err != nil {
        logger.WithError(err).Fatal("freezekit init")
    }

    // Hand it the live DB pool stats so DBPoolWait works.
    fk.SetDBPoolStatsFunc(func() freezekit.DBPoolStats {
        s := db.Stats()
        return freezekit.DBPoolStats{
            InUse:          s.InUse,
            Idle:           s.Idle,
            Max:            s.MaxOpenConnections,
            WaitCount:      s.WaitCount,
            WaitDurationMS: s.WaitDuration.Milliseconds(),
        }
    })

    go fk.Run(serveCtx)
    defer fk.Shutdown(context.Background())
    // ────────────────────────────────────────────────────────────

    // Hand the manager off to the API for middleware mounting:
    a := api.NewAPIWithVersion(config, db, version,
        api.WithFreezekit(fk),
    )

    // … existing serve loop …
}
```

## 2. `internal/api/api.go`

```go
import (
    "github.com/supabase/diagnostics/freezekit"
)

// Add a functional option.
type apiOption func(*API)

func WithFreezekit(fk *freezekit.Manager) apiOption {
    return func(a *API) { a.freezekit = fk }
}

type API struct {
    // … existing fields …
    freezekit *freezekit.Manager
}

func NewAPIWithVersion(config *conf.GlobalConfiguration, db *storage.Connection, version string, opts ...apiOption) *API {
    api := &API{ /* … */ }
    for _, o := range opts {
        o(api)
    }

    r := chi.NewRouter()

    // ───── freezekit middleware ─────────────────────────────────
    if api.freezekit != nil {
        r.Use(api.freezekit.HTTPMiddleware())
    }
    // ────────────────────────────────────────────────────────────

    // existing middleware chain (logger, recoverer, …)
    r.Use(addRequestID(globalConfig))
    // …

    // Existing routes
    r.Mount("/admin", adminRouter)
    r.Post("/token", api.Token)
    // …

    // Operator surface, gated behind service-role auth.
    if api.freezekit != nil {
        r.Route("/debug/freezekit", func(r chi.Router) {
            r.Use(serviceRoleAuth)             // existing middleware
            api.freezekit.MountDebugRoutes(r)
        })
        r.Handle("/metrics/freezekit", api.freezekit.MetricsHandler())
    }

    return api
}
```

## 3. `internal/api/health.go`

This is the upstream patch 02 (deep health) from the parent
directory. freezekit's detector relies on it being mounted, but does
not import it directly. Make sure `/healthz/deep` is wired before
turning on `FREEZEKIT_DETECTOR_ENABLED=true`.

## 4. CI smoke test

Add to `.github/workflows/ci.yml`:

```yaml
- name: freezekit chaos smoke
  run: |
    go test -count=1 -timeout 60s \
      github.com/supabase/diagnostics/freezekit/... \
      github.com/supabase/diagnostics/chaos/...
```

## Operational checklist

- [ ] `FREEZEKIT_DISABLED=false` is set in production env
- [ ] `FREEZEKIT_DETECTOR_ENABLED=false` (Wave 1) → `true` (Wave 4)
- [ ] `FREEZEKIT_SINK=multi` and signer service deployed (Wave 3)
- [ ] preStop hook (`k8s/auth-deployment-with-freezekit.yaml`) installed
- [ ] Prometheus rules `observability/alerts.yml` loaded
- [ ] Grafana dashboard `observability/dashboard.json` imported
- [ ] `FREEZEKIT_BLOCK_PROFILE_RATE_NS=10000` (default) confirmed acceptable
- [ ] `FREEZEKIT_MUTEX_PROFILE_FRACTION=100` (default) confirmed acceptable
- [ ] `freezekit_state` metric visible in your monitoring stack
- [ ] Manual trigger tested:
      `curl -X POST -H "apikey: $SERVICE_ROLE_KEY" http://localhost:9999/debug/freezekit/capture?reason=smoke`
- [ ] Capture appears in your sink within 30s
