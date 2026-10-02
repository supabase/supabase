// Package taskclient provides an implementation of mailer.Client that uses
// the apitask package to send mail in the background.
package taskclient

import (
	"context"
	"fmt"

	"github.com/supabase/auth/internal/api/apitask"
	"github.com/supabase/auth/internal/conf"
	"github.com/supabase/auth/internal/mailer"
)

// New will return a Client that runs a task in the background that will later
// call the given Client. If the mailer config EmailBackgroundSending is
// disabled it will return the same Client passed in mc.
func New(globalConfig *conf.GlobalConfiguration, mc mailer.Client) mailer.Client {

	// Check if background emails are enabled
	if globalConfig.Mailer.EmailBackgroundSending {
		mc = &backgroundMailClient{mc: mc}
	}
	return mc
}

// Task holds a mail pending delivery by the Handler.
type Task struct {
	mc mailer.Client

	To      string              `json:"to"`
	Subject string              `json:"subject"`
	Body    string              `json:"body"`
	Headers map[string][]string `json:"headers"`
	Typ     string              `json:"typ"`
}

// Run implements the Type method of the apitask.Task interface by returning
// the "mailer." prefix followed by the mail type.
func (o *Task) Type() string { return fmt.Sprintf("mailer.%v", o.Typ) }

// Run implements the Run method of the apitask.Task interface by attempting
// to send the mail using the underying mail client.
func (o *Task) Run(ctx context.Context) error {
	return o.mc.Mail(
		ctx,
		o.To,
		o.Subject,
		o.Body,
		o.Headers,
		o.Typ)
}

type backgroundMailClient struct {
	mc mailer.Client
}

// Mail implements mailer.MailClient interface by sending the call to the
// wrapped mail client to the background.
func (o *backgroundMailClient) Mail(
	ctx context.Context,
	to string,
	subject string,
	body string,
	headers map[string][]string,
	typ string,
) error {
	tk := &Task{
		mc:      o.mc,
		To:      to,
		Subject: subject,
		Body:    body,
		Headers: headers,
		Typ:     typ,
	}
	return apitask.Run(ctx, tk)
}
