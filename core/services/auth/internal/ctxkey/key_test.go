package ctxkey

import (
	"context"
	"fmt"
	"testing"

	"github.com/gofrs/uuid"
	"github.com/stretchr/testify/require"
)

func TestKey(t *testing.T) {
	type example struct {
		ID uuid.UUID `db:"id" json:"id"`
	}
	key := New[*example]("example")

	t.Run("round trips a typed value", func(t *testing.T) {
		item := &example{ID: uuid.Must(uuid.NewV4())}
		ctx := key.WithValue(context.Background(), item)
		require.Equal(t, item, key.Value(ctx))
	})

	t.Run("returns the zero value when absent", func(t *testing.T) {
		require.Nil(t, key.Value(context.Background()))
	})

	t.Run("returns the zero value for a nil context", func(t *testing.T) {
		var ctx context.Context
		require.Nil(t, key.Value(ctx))
	})

	t.Run("Lookup distinguishes an absent value from a zero value", func(t *testing.T) {
		flag := New[bool]("email_optional")

		value, ok := flag.Lookup(context.Background())
		require.False(t, value)
		require.False(t, ok)

		value, ok = flag.Lookup(flag.WithValue(context.Background(), false))
		require.False(t, value)
		require.True(t, ok)
	})

	t.Run("keys of different types do not collide", func(t *testing.T) {
		other := New[string]("example")
		ctx := other.WithValue(context.Background(), "not an item")
		require.Nil(t, key.Value(ctx))
		require.Equal(t, "not an item", other.Value(ctx))
	})

	t.Run("independently constructed keys never share a slot, even with the same type and name", func(t *testing.T) {
		item := &example{ID: uuid.Must(uuid.NewV4())}
		ctx := New[*example]("example").WithValue(context.Background(), item)
		require.Nil(t, key.Value(ctx))
	})

	t.Run("keys of the same type but a different name do not collide", func(t *testing.T) {
		first, second := New[string]("first"), New[string]("second")
		ctx := first.WithValue(context.Background(), "one")
		ctx = second.WithValue(ctx, "two")
		require.Equal(t, "one", first.Value(ctx))
		require.Equal(t, "two", second.Value(ctx))
	})

	t.Run("names the key when a context is printed", func(t *testing.T) {
		ctx := New[string]("first").WithValue(context.Background(), "one")
		require.Contains(t, fmt.Sprint(ctx), "first")
	})

	t.Run("distinguishes independently constructed keys sharing a name", func(t *testing.T) {
		first, second := New[string]("dup"), New[string]("dup")
		require.NotEqual(t, first.String(), second.String())
	})
}
