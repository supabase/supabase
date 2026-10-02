package observability

import (
	"context"
	"errors"
	"fmt"
	"net"
	"net/http"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
	"github.com/supabase/auth/internal/conf"
	"github.com/supabase/auth/internal/utilities"
	"github.com/supabase/auth/internal/utilities/version"

	"github.com/prometheus/client_golang/prometheus/promhttp"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/otlp/otlpmetric/otlpmetricgrpc"
	"go.opentelemetry.io/otel/exporters/otlp/otlpmetric/otlpmetrichttp"
	"go.opentelemetry.io/otel/exporters/prometheus"
	"go.opentelemetry.io/otel/metric"
	sdkmetric "go.opentelemetry.io/otel/sdk/metric"

	otelruntimemetrics "go.opentelemetry.io/contrib/instrumentation/runtime"
)

func Meter(instrumentationName string, opts ...metric.MeterOption) metric.Meter {
	return otel.Meter(instrumentationName, opts...)
}

func ObtainMetricCounter(name, desc string) metric.Int64Counter {
	counter, err := Meter("gotrue").Int64Counter(name, metric.WithDescription(desc))
	if err != nil {
		panic(err)
	}
	return counter
}

func enablePrometheusMetrics(ctx context.Context, mc *conf.MetricsConfig) error {
	exporter, err := prometheus.New()
	if err != nil {
		return err
	}

	provider := sdkmetric.NewMeterProvider(sdkmetric.WithReader(exporter))

	otel.SetMeterProvider(provider)

	cleanupWaitGroup.Add(1)
	go func() { // #nosec G118 -- Cleanup goroutine intentionally manages server lifecycle independent of request context.
		addr := net.JoinHostPort(mc.PrometheusListenHost, mc.PrometheusListenPort)
		baseContext, cancel := context.WithCancel(context.Background()) // #nosec G118 -- cancel() is called in the shutdown goroutine below; baseContext is for the HTTP server.

		server := &http.Server{
			Addr:    addr,
			Handler: promhttp.Handler(),
			BaseContext: func(net.Listener) context.Context {
				return baseContext
			},
			ReadHeaderTimeout: 2 * time.Second, // to mitigate a Slowloris attack
		}

		go func() {
			defer cleanupWaitGroup.Done()
			<-ctx.Done()

			cancel() // close baseContext

			shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
			defer shutdownCancel()

			if err := server.Shutdown(shutdownCtx); err != nil && !errors.Is(err, context.Canceled) {
				logrus.WithError(err).Errorf("prometheus server (%s) failed to gracefully shut down", addr)
			}
		}()

		logrus.Infof("prometheus server listening on %s", addr)

		if err := server.ListenAndServe(); errors.Is(err, http.ErrServerClosed) {
			logrus.Info("prometheus metric exporter shut down")
		} else {
			logrus.WithError(err).Errorf("prometheus server (%s) shut down", addr)
		}
	}()

	return nil
}

func enableOpenTelemetryMetrics(ctx context.Context, mc *conf.MetricsConfig) error {
	switch mc.ExporterProtocol {
	case "grpc":
		metricExporter, err := otlpmetricgrpc.New(ctx)
		if err != nil {
			return err
		}
		meterProvider := sdkmetric.NewMeterProvider(
			sdkmetric.WithReader(sdkmetric.NewPeriodicReader(metricExporter)),
		)

		otel.SetMeterProvider(meterProvider)

		cleanupWaitGroup.Add(1)
		go func() { // #nosec G118 -- Cleanup goroutine intentionally outlives the request; context.Background() is required for shutdown after parent context is cancelled.
			defer cleanupWaitGroup.Done()

			<-ctx.Done()

			shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
			defer shutdownCancel()

			if err := metricExporter.Shutdown(shutdownCtx); err != nil {
				logrus.WithError(err).Error("unable to gracefully shut down OpenTelemetry metric exporter")
			} else {
				logrus.Info("OpenTelemetry metric exporter shut down")
			}
		}()

	case "http/protobuf":
		metricExporter, err := otlpmetrichttp.New(ctx)
		if err != nil {
			return err
		}
		meterProvider := sdkmetric.NewMeterProvider(
			sdkmetric.WithReader(sdkmetric.NewPeriodicReader(metricExporter)),
		)

		otel.SetMeterProvider(meterProvider)

		cleanupWaitGroup.Add(1)
		go func() { // #nosec G118 -- Cleanup goroutine intentionally outlives the request; context.Background() is required for shutdown after parent context is cancelled.
			defer cleanupWaitGroup.Done()

			<-ctx.Done()

			shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
			defer shutdownCancel()

			if err := metricExporter.Shutdown(shutdownCtx); err != nil {
				logrus.WithError(err).Error("unable to gracefully shut down OpenTelemetry metric exporter")
			} else {
				logrus.Info("OpenTelemetry metric exporter shut down")
			}
		}()

	default: // http/json for example
		return fmt.Errorf("unsupported OpenTelemetry exporter protocol %q", mc.ExporterProtocol)
	}
	logrus.Info("OpenTelemetry metrics exporter started")
	return nil

}

var (
	metricsOnce *sync.Once = &sync.Once{}
)

func ConfigureMetrics(ctx context.Context, mc *conf.MetricsConfig) error {
	if ctx == nil {
		panic("context must not be nil")
	}

	var err error

	metricsOnce.Do(func() {
		if mc.Enabled {
			switch mc.Exporter {
			case conf.Prometheus:
				if err = enablePrometheusMetrics(ctx, mc); err != nil {
					logrus.WithError(err).Error("unable to start prometheus metrics exporter")
					return
				}

			case conf.OpenTelemetryMetrics:
				if err = enableOpenTelemetryMetrics(ctx, mc); err != nil {
					logrus.WithError(err).Error("unable to start OTLP metrics exporter")

					return
				}
			}
		}

		if err := otelruntimemetrics.Start(otelruntimemetrics.WithMinimumReadMemStatsInterval(time.Second)); err != nil {
			logrus.WithError(err).Error("unable to start OpenTelemetry Go runtime metrics collection")
		} else {
			logrus.Info("Go runtime metrics collection started")
		}

		meter := otel.Meter("gotrue")
		_, err := meter.Int64ObservableGauge(
			"gotrue_running",
			metric.WithDescription("Whether GoTrue is running (always 1)"),
			metric.WithInt64Callback(func(_ context.Context, obsrv metric.Int64Observer) error {
				obsrv.Observe(int64(1))
				return nil
			}),
		)
		if err != nil {
			logrus.WithError(err).Error("unable to get gotrue.gotrue_running gague metric")
			return
		}
		if err = version.InitVersionMetrics(ctx, utilities.Version); err != nil {
			logrus.WithError(err).Error("unable to configure version metrics")
		}
	})

	return err
}
