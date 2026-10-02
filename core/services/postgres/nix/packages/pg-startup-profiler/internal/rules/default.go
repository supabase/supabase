package rules

import (
	_ "embed"
)

//go:embed default.yaml
var DefaultRulesYAML []byte
