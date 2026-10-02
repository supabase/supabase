package conf

type ProfilerConfig struct {
	Enabled bool   `default:"false"`
	Host    string `default:"localhost"`
	Port    string `default:"9998"`
}
