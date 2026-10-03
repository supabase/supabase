package observability

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
	"github.com/supabase/auth/internal/conf"
	"github.com/supabase/auth/internal/utilities"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
	"go.opentelemetry.io/otel/propagation"
	sdkresource "go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	"go.opentelemetry.io/otel/trace"
)

func Tracer(name string, opts ...trace.TracerOption) trace.Tracer {
	return otel.Tracer(name, opts...)
}

func openTelemetryResource() *sdkresource.Resource {
	environmentResource := sdkresource.Environment()
	gotrueResource := sdkresource.NewSchemaless(attribute.String("gotrue.version", utilities.Version))

	mergedResource, err := sdkresource.Merge(environmentResource, gotrueResource)
	if err != nil {
		logrus.WithError(err).Error("unable to merge OpenTelemetry environment and gotrue resources")

		return environmentResource
	}

	return mergedResource
}

func enableOpenTelemetryTracing(ctx context.Context, tc *conf.TracingConfig) error {
	var (
		err           error
		traceExporter *otlptrace.Exporter
	)

	switch tc.ExporterProtocol {
	case "grpc":
		traceExporter, err = otlptracegrpc.New(ctx)
		if err != nil {
			return err
		}

	case "http/protobuf":
		traceExporter, err = otlptracehttp.New(ctx)
		if err != nil {
			return err
		}

	default: // http/json for example
		return fmt.Errorf("unsupported OpenTelemetry exporter protocol %q", tc.ExporterProtocol)
	}

	traceProvider := sdktrace.NewTracerProvider(
		sdktrace.WithBatcher(traceExporter),
		sdktrace.WithResource(openTelemetryResource()),
	)

	otel.SetTracerProvider(traceProvider)

	// Register the W3C trace context and baggage propagators so data is
	// propagated across services/processes
	otel.SetTextMapPropagator(
		propagation.NewCompositeTextMapPropagator(
			propagation.TraceContext{},
			propagation.Baggage{},
		),
	)

	cleanupWaitGroup.Add(1)
	go func() { // #nosec G118 -- Cleanup goroutine intentionally outlives the request; context.Background() is required for shutdown after parent context is cancelled.
		defer cleanupWaitGroup.Done()

		<-ctx.Done()

		shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer shutdownCancel()

		if err := traceExporter.Shutdown(shutdownCtx); err != nil {
			logrus.WithError(err).Error("unable to shutdown OpenTelemetry trace exporter")
		}

		if err := traceProvider.Shutdown(shutdownCtx); err != nil {
			logrus.WithError(err).Error("unable to shutdown OpenTelemetry trace provider")
		}
	}()

	logrus.Info("OpenTelemetry trace exporter started")

	return nil
}

var (
	tracingOnce sync.Once
)

// ConfigureTracing sets up global tracing configuration for OpenTracing /
// OpenTelemetry. The context should be the global context. Cancelling this
// context will cancel tracing collection.
func ConfigureTracing(ctx context.Context, tc *conf.TracingConfig) error {
	if ctx == nil {
		panic("context must not be nil")
	}

	var err error

	tracingOnce.Do(func() {
		if tc.Enabled {
			if tc.Exporter == conf.OpenTelemetryTracing {
				if err = enableOpenTelemetryTracing(ctx, tc); err != nil {
					logrus.WithError(err).Error("unable to start OTLP trace exporter")
				}

			}
		}
	})

	return err
}
