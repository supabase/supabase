package api

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/stretchr/testify/suite"
	"github.com/supabase/auth/internal/conf"
	"github.com/supabase/auth/internal/storage"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	"go.opentelemetry.io/otel/sdk/trace/tracetest"
	semconv "go.opentelemetry.io/otel/semconv/v1.38.0"
)

type OpenTelemetryTracerTestSuite struct {
	suite.Suite
	API    *API
	Config *conf.GlobalConfiguration
}

func TestOpenTelemetryTracer(t *testing.T) {
	api, config, err := setupAPIForTestWithCallback(func(config *conf.GlobalConfiguration, conn *storage.Connection) {
		if config != nil {
			config.Tracing.Enabled = true
			config.Tracing.Exporter = conf.OpenTelemetryTracing
		}
	})

	require.NoError(t, err)

	ts := &OpenTelemetryTracerTestSuite{
		API:    api,
		Config: config,
	}
	defer api.db.Close()

	suite.Run(t, ts)
}

func getAttribute(attributes []attribute.KeyValue, key attribute.Key) *attribute.Value {
	for _, value := range attributes {
		if value.Key == key {
			return &value.Value
		}
	}

	return nil
}

func (ts *OpenTelemetryTracerTestSuite) TestOpenTelemetryTracer_Spans() {
	exporter := tracetest.NewInMemoryExporter()
	bsp := sdktrace.NewSimpleSpanProcessor(exporter)
	traceProvider := sdktrace.NewTracerProvider(
		sdktrace.WithSampler(sdktrace.AlwaysSample()),
		sdktrace.WithSpanProcessor(bsp),
	)
	otel.SetTracerProvider(traceProvider)

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "http://localhost/something1", nil)
	req.Header.Set("User-Agent", "whatever")
	ts.API.handler.ServeHTTP(w, req)

	req = httptest.NewRequest(http.MethodGet, "http://localhost/something2", nil)
	req.Header.Set("User-Agent", "whatever")
	ts.API.handler.ServeHTTP(w, req)

	spanStubs := exporter.GetSpans()
	spans := spanStubs.Snapshots()

	if assert.Equal(ts.T(), 2, len(spans)) {
		attributes1 := spans[0].Attributes()
		method1 := getAttribute(attributes1, semconv.HTTPRequestMethodKey)
		assert.Equal(ts.T(), "POST", method1.AsString())
		url1 := getAttribute(attributes1, semconv.URLPathKey)
		assert.Equal(ts.T(), "/something1", url1.AsString())
		statusCode1 := getAttribute(attributes1, semconv.HTTPResponseStatusCodeKey)
		assert.Equal(ts.T(), int64(404), statusCode1.AsInt64())

		attributes2 := spans[1].Attributes()
		method2 := getAttribute(attributes2, semconv.HTTPRequestMethodKey)
		assert.Equal(ts.T(), "GET", method2.AsString())
		url2 := getAttribute(attributes2, semconv.URLPathKey)
		assert.Equal(ts.T(), "/something2", url2.AsString())
		statusCode2 := getAttribute(attributes2, semconv.HTTPResponseStatusCodeKey)
		assert.Equal(ts.T(), int64(404), statusCode2.AsInt64())
	}
}
