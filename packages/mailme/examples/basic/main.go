package main

import (
	"html/template"
	"log"
	"os"

	"github.com/supabase/mailme"
)

func main() {
	// Get SMTP configuration from environment variables
	host := os.Getenv("SMTP_HOST")
	port := 587
	user := os.Getenv("SMTP_USER")
	pass := os.Getenv("SMTP_PASS")
	recipient := os.Getenv("EMAIL_RECIPIENT")

	if host == "" || user == "" || pass == "" || recipient == "" {
		log.Println("Please set environment variables:")
		log.Println("  SMTP_HOST - SMTP server hostname")
		log.Println("  SMTP_USER - SMTP username")
		log.Println("  SMTP_PASS - SMTP password")
		log.Println("  EMAIL_RECIPIENT - Email recipient")
		log.Println("\nExample:")
		log.Println("  export SMTP_HOST=smtp.gmail.com")
		log.Println("  export SMTP_USER=your-email@gmail.com")
		log.Println("  export SMTP_PASS=your-app-password")
		log.Println("  export EMAIL_RECIPIENT=recipient@example.com")
		return
	}

	// Configure mailer
	mailer := &mailme.Mailer{
		Host:      host,
		Port:      port,
		User:      user,
		Pass:      pass,
		LocalName: "mailme-example",
	}

	// Test SMTP connection first
	log.Println("Testing SMTP connection...")
	if err := mailer.TestSMTPConnection(); err != nil {
		log.Fatalf("SMTP connection test failed: %v", err)
	}
	log.Println("SMTP connection successful!")

	// Create subject template
	subject, err := template.New("subject").Parse("Welcome to {{.Content.service}}, {{.Name}}!")
	if err != nil {
		log.Fatalf("Failed to create subject template: %v", err)
	}

	// Prepare email data
	data := mailme.Data{
		Name: "Test User",
		Content: map[string]interface{}{
			"service":     "Supabase",
			"environment": "development",
			"timestamp":   "2024-01-01",
		},
	}

	// HTML email body
	htmlBody := `
	<html>
	<head>
		<title>Welcome Email</title>
	</head>
	<body>
		<h1>Welcome to Supabase!</h1>
		<p>Hello <strong>Test User</strong>,</p>
		<p>Welcome to our platform. We're excited to have you on board!</p>
		<hr>
		<p><small>This email was sent using the updated mailme package with wneessen/go-mail.</small></p>
	</body>
	</html>
	`

	// Send email
	log.Println("Sending email...")
	err = mailer.Mail(
		[]string{recipient},
		subject,
		htmlBody,
		data,
	)
	if err != nil {
		log.Fatalf("Failed to send email: %v", err)
	}

	log.Println("Email sent successfully!")

	// Also test the MailBuffer method for backward compatibility
	log.Println("Testing MailBuffer method...")
	bufferSubject, err := template.New("buffer-subject").Parse("Buffer Test - {{.Name}}")
	if err != nil {
		log.Fatalf("Failed to create buffer subject template: %v", err)
	}

	bufferData := mailme.Data{
		Name: "Buffer Test",
		Content: map[string]interface{}{
			"method": "MailBuffer",
		},
	}

	err = mailer.MailBuffer(
		[]string{recipient},
		bufferSubject,
		"<h2>MailBuffer Test</h2><p>This email was sent using the MailBuffer method for backward compatibility.</p>",
		bufferData,
	)
	if err != nil {
		log.Fatalf("Failed to send buffer email: %v", err)
	}

	log.Println("MailBuffer test completed successfully!")
	log.Println("All tests passed! The mailme package is working correctly with wneessen/go-mail.")
}
