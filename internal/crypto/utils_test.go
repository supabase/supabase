package crypto

import (
	"testing"

	"github.com/pkg/errors"
	"github.com/stretchr/testify/require"
)

func TestMust(t *testing.T) {
	require.Panics(t, func() {
		must(123, errors.New("panic"))
	})
}
