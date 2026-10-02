package conf

type MetricsExporter = string

const (
	Prometheus           MetricsExporter = "prometheus"
	OpenTelemetryMetrics MetricsExporter = "opentelemetry"
)

type MetricsConfig struct {
	Enabled bool

	Exporter MetricsExporter `default:"opentelemetry"`

	// ExporterProtocol is the OTEL_EXPORTER_OTLP_PROTOCOL env variable,
	// only available when exporter is opentelemetry. See:
	// https://github.com/open-telemetry/opentelemetry-specification/blob/main/specification/protocol/exporter.md
	ExporterProtocol string `default:"http/protobuf" envconfig:"OTEL_EXPORTER_OTLP_PROTOCOL"`

	PrometheusListenHost string `default:"0.0.0.0" envconfig:"OTEL_EXPORTER_PROMETHEUS_HOST"`
	PrometheusListenPort string `default:"9100" envconfig:"OTEL_EXPORTER_PROMETHEUS_PORT"`
}

func (mc MetricsConfig) Validate() error {
	return nil
}
