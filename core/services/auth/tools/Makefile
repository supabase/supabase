BIN_DIR := $(CURDIR)/bin
BIN_TARGETS := \
	$(BIN_DIR)/gosec \
	$(BIN_DIR)/staticcheck \
	$(BIN_DIR)/govulncheck

.PHONY: all
all: $(BIN_TARGETS)

$(BIN_DIR)/gosec: | $(BIN_DIR)
	GOBIN=$(BIN_DIR) go install github.com/securego/gosec/v2/cmd/gosec

$(BIN_DIR)/staticcheck: | $(BIN_DIR)
	GOBIN=$(BIN_DIR) go install honnef.co/go/tools/cmd/staticcheck

$(BIN_DIR)/govulncheck: | $(BIN_DIR)
	GOBIN=$(BIN_DIR) go install golang.org/x/vuln/cmd/govulncheck

$(BIN_DIR):
	mkdir -p $(@)

.PHONY: clean
clean:
	rm -f $(BIN_TARGETS)