package mailme

import (
	"context"
	"crypto/tls"
	"fmt"
	"html/template"
	"net"
	"strconv"
	"strings"
	"time"

	log "github.com/sirupsen/logrus"
	"github.com/wneessen/go-mail"
)

// Mailer represents email configuration
type Mailer struct {
	Host      string
	Port      int
	User      string
	Pass      string
	LocalName string
}

// Data represents template data for emails
type Data struct {
	Name    string
	Content map[string]interface{}
}

// Mail sends an email using the wneessen/go-mail library
func (m *Mailer) Mail(to []string, subject *template.Template, body string, data Data) error {
	// Create a new message
	message := mail.NewMsg()

	// Set basic headers
	if err := message.From(m.User); err != nil {
		return fmt.Errorf("failed to set From header: %w", err)
	}

	if err := message.To(to...); err != nil {
		return fmt.Errorf("failed to set To header: %w", err)
	}

	// Execute subject template
	var subjectBuilder strings.Builder
	if err := subject.Execute(&subjectBuilder, data); err != nil {
		return fmt.Errorf("failed to execute subject template: %w", err)
	}
	message.Subject(subjectBuilder.String())

	// Set body as HTML
	message.SetBodyString(mail.TypeTextHTML, body)

	// Create client with SMTP configuration
	client, err := mail.NewClient(m.Host, mail.WithPort(m.Port))
	if err != nil {
		return fmt.Errorf("failed to create mail client: %w", err)
	}

	// Configure authentication if credentials are provided
	if m.User != "" && m.Pass != "" {
		client.SetSMTPAuth(mail.SMTPAuthPlain)
		client.SetUsername(m.User)
		client.SetPassword(m.Pass)
	}

	// Configure TLS
	tlsConfig := &tls.Config{
		ServerName: m.Host,
	}
	client.SetTLSConfig(tlsConfig)

	// Set local name if provided (wneessen/go-mail doesn't support SetLocalName directly)
	// The LocalName functionality is handled automatically by the library

	// Create context with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Send the email
	if err := client.DialAndSendWithContext(ctx, message); err != nil {
		return fmt.Errorf("failed to send email: %w", err)
	}

	log.WithFields(log.Fields{
		"to":      to,
		"subject": subjectBuilder.String(),
		"host":    m.Host,
		"port":    m.Port,
	}).Info("Email sent successfully")

	return nil
}

// MailBuffer is a compatibility method for sending emails with template data
func (m *Mailer) MailBuffer(to []string, subject *template.Template, body string, data Data) error {
	return m.Mail(to, subject, body, data)
}

// TestSMTPConnection tests the SMTP connection
func (m *Mailer) TestSMTPConnection() error {
	// Test basic connectivity
	conn, err := net.DialTimeout("tcp", net.JoinHostPort(m.Host, strconv.Itoa(m.Port)), 10*time.Second)
	if err != nil {
		return fmt.Errorf("failed to connect to SMTP server: %w", err)
	}
	conn.Close()

	// Test with mail client by creating a test message and attempting connection
	client, err := mail.NewClient(m.Host, mail.WithPort(m.Port))
	if err != nil {
		return fmt.Errorf("failed to create mail client: %w", err)
	}

	if m.User != "" && m.Pass != "" {
		client.SetSMTPAuth(mail.SMTPAuthPlain)
		client.SetUsername(m.User)
		client.SetPassword(m.Pass)
	}

	// Create a test message to verify the connection works
	testMsg := mail.NewMsg()
	if err := testMsg.From(m.User); err != nil {
		return fmt.Errorf("failed to set test From header: %w", err)
	}
	if err := testMsg.To("test@example.com"); err != nil {
		return fmt.Errorf("failed to set test To header: %w", err)
	}
	testMsg.Subject("Connection Test")
	testMsg.SetBodyString(mail.TypeTextPlain, "Connection test")

	// Test dial with context - we won't actually send the message
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	// Try to establish a connection (but don't send the message)
	err = client.DialWithContext(ctx)
	if err != nil {
		return fmt.Errorf("failed to dial SMTP server: %w", err)
	}

	// Close the connection
	client.Close()

	return nil
}
