// Package ctxkey provides a generic, strongly typed context key. Each key
// owns its accessors, so the type stored under a key and the type read back
// out are checked by the compiler rather than by hand at every call site.
package ctxkey

import (
	"context"
	"fmt"
)

type Key[T any] struct {
	name string
}

func New[T any](name string) *Key[T] {
	return &Key[T]{name: name}
}

func (k *Key[T]) String() string {
	return fmt.Sprintf("%s(%p)", k.name, k)
}

func (k *Key[T]) WithValue(ctx context.Context, value T) context.Context {
	return context.WithValue(ctx, k, value)
}

func (k *Key[T]) Lookup(ctx context.Context) (T, bool) {
	var zero T
	if ctx == nil {
		return zero, false
	}
	value, ok := ctx.Value(k).(T)
	return value, ok
}

func (k *Key[T]) Value(ctx context.Context) T {
	value, _ := k.Lookup(ctx)
	return value
}
