package conf

type LoggingConfig struct {
	Level            string                 `mapstructure:"log_level" json:"log_level"`
	File             string                 `mapstructure:"log_file" json:"log_file"`
	DisableColors    bool                   `mapstructure:"disable_colors" split_words:"true" json:"disable_colors"`
	QuoteEmptyFields bool                   `mapstructure:"quote_empty_fields" split_words:"true" json:"quote_empty_fields"`
	TSFormat         string                 `mapstructure:"ts_format" json:"ts_format"`
	Fields           map[string]interface{} `mapstructure:"fields" json:"fields"`
	SQL              string                 `mapstructure:"sql" json:"sql"`
}
