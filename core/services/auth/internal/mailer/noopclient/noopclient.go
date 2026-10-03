// Package noopclient provides an implementation of mailer.Client that simply
// does nothing.
package noopclient

import (
	"context"
	"errors"
	"time"
)

type Client struct {
	Delay time.Duration
}

func New() *Client {
	return &Client{}
}

func (m *Client) Mail(
	ctx context.Context,
	to string,
	subject string,
	body string,
	headers map[string][]string,
	typ string,
) error {
	if to == "" {
		return errors.New("to field cannot be empty")
	}

	if m.Delay > 0 {
		select {
		case <-time.After(m.Delay):
		case <-ctx.Done():
			return ctx.Err()
		}
	}
	return nil
}
