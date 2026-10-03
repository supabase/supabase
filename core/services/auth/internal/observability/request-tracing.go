package observability

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/sirupsen/logrus"
	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/metric"
	semconv "go.opentelemetry.io/otel/semconv/v1.38.0"
	"go.opentelemetry.io/otel/trace"
)

func getChiRoutePattern(r *http.Request) string {
	ctx := r.Context()
	routeContext := chi.RouteContext(ctx)
	if routeContext == nil {
		return "noroute"
	}

	return routeContext.RoutePattern()
}

// traceChiRoutesSafely attempts to extract the Chi RouteContext. If the
// request does not have a RouteContext it will recover from the panic and
// attempt to figure out the route from the URL's path.
func traceChiRoutesSafely(r *http.Request) {
	defer func() {
		if rec := recover(); rec != nil {
			logrus.WithField("error", rec).Error("unable to trace chi routes, traces may be off")

			span := trace.SpanFromContext(r.Context())
			span.SetAttributes(semconv.HTTPRouteKey.String(r.URL.Path))
		}
	}()

	routePattern := getChiRoutePattern(r)
	span := trace.SpanFromContext(r.Context())
	span.SetAttributes(semconv.HTTPRouteKey.String(routePattern))
}

// traceChiRouteURLParamsSafely attempts to extract the Chi RouteContext
// URLParams values for the route and assign them to the tracing span. If the
// request does not have a RouteContext it will recover from the panic and not
// set any params.
func traceChiRouteURLParamsSafely(r *http.Request) {
	defer func() {
		if rec := recover(); rec != nil {
			logrus.WithField("error", rec).Error("unable to trace route with route params, traces may be off")
		}
	}()

	routeContext := chi.RouteContext(r.Context())
	span := trace.SpanFromContext(r.Context())

	var attributes []attribute.KeyValue

	for i := 0; i < len(routeContext.URLParams.Keys); i += 1 {
		key := routeContext.URLParams.Keys[i]
		value := routeContext.URLParams.Values[i]

		attributes = append(attributes, attribute.String("http.route.param."+key, value))
	}

	if len(attributes) > 0 {
		span.SetAttributes(attributes...)
	}
}

type interceptingResponseWriter struct {
	writer http.ResponseWriter

	statusCode int
}

func (w *interceptingResponseWriter) WriteHeader(statusCode int) {
	w.statusCode = statusCode

	w.writer.WriteHeader(statusCode)
}

func (w *interceptingResponseWriter) Write(data []byte) (int, error) {
	return w.writer.Write(data)
}

func (w *interceptingResponseWriter) Header() http.Header {
	return w.writer.Header()
}

// countStatusCodesSafely counts the number of HTTP status codes per route that
// occurred while GoTrue was running. If it is not able to identify the route
// via chi.RouteContext(ctx).RoutePattern() it counts with a noroute attribute.
func countStatusCodesSafely(w *interceptingResponseWriter, r *http.Request, counter metric.Int64Counter) {
	if counter == nil {
		return
	}

	defer func() {
		if rec := recover(); rec != nil {
			logrus.WithField("error", rec).Error("unable to count status codes safely, metrics may be off")
		}
	}()

	ctx := r.Context()

	routePattern := getChiRoutePattern(r)

	counter.Add(
		ctx,
		1,
		metric.WithAttributes(
			attribute.Int("code", w.statusCode),
			semconv.HTTPRouteKey.String(routePattern),
		),
	)
}

func addMetricAttributes(r *http.Request) []attribute.KeyValue {
	routePattern := getChiRoutePattern(r)
	routePatternAttr := semconv.HTTPRouteKey.String(routePattern)
	out := []attribute.KeyValue{
		routePatternAttr,
	}

	return out
}

// RequestTracing returns an HTTP handler that traces all HTTP requests coming
// in. Supports Chi routers, so this should be one of the first middlewares on
// the router.
func RequestTracing() func(http.Handler) http.Handler {
	meter := otel.Meter("gotrue")
	statusCodes, err := meter.Int64Counter(
		"http_status_codes",
		metric.WithDescription("Number of returned HTTP status codes"),
	)
	if err != nil {
		logrus.WithError(err).Error("unable to get gotrue.http_status_codes counter metric")
	}

	return func(next http.Handler) http.Handler {
		fn := func(w http.ResponseWriter, r *http.Request) {
			writer := interceptingResponseWriter{
				writer: w,
			}

			defer traceChiRoutesSafely(r)
			defer traceChiRouteURLParamsSafely(r)
			defer countStatusCodesSafely(&writer, r, statusCodes)

			originalUserAgent := r.Header.Get("X-Gotrue-Original-User-Agent")
			if originalUserAgent != "" {
				r.Header.Set("User-Agent", originalUserAgent)
			}

			next.ServeHTTP(&writer, r)

			if originalUserAgent != "" {
				r.Header.Set("X-Gotrue-Original-User-Agent", originalUserAgent)
				r.Header.Set("User-Agent", "stripped")
			}
		}

		otelHandler := otelhttp.NewHandler(
			http.HandlerFunc(fn),
			"api",
			otelhttp.WithMetricAttributesFn(addMetricAttributes),
		)

		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// there is a vulnerability with otelhttp where
			// User-Agent strings are kept in RAM indefinitely and
			// can be used as an easy way to resource exhaustion;
			// so this code strips the User-Agent header before
			// it's passed to be traced by otelhttp, and then is
			// returned back to the middleware
			// https://github.com/supabase/gotrue/security/dependabot/11
			userAgent := r.UserAgent()
			if userAgent != "" {
				r.Header.Set("X-Gotrue-Original-User-Agent", userAgent)
				r.Header.Set("User-Agent", "stripped")
			}

			otelHandler.ServeHTTP(w, r)
		})
	}
}
