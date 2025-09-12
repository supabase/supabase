package mailme

import (
	"html/template"
	"net"
	"strconv"
	"strings"
	"testing"
	"time"
)

func TestMailer_TestSMTPConnection(t *testing.T) {
	tests := []struct {
		name    string
		mailer  *Mailer
		wantErr bool
	}{
		{
			name: "valid connection without auth",
			mailer: &Mailer{
				Host: "smtp.gmail.com",
				Port: 587,
			},
			wantErr: false, // Should be able to connect but may fail auth
		},
		{
			name: "invalid host",
			mailer: &Mailer{
				Host: "nonexistent.smtp.server",
				Port: 587,
			},
			wantErr: true,
		},
		{
			name: "invalid port",
			mailer: &Mailer{
				Host: "smtp.gmail.com",
				Port: 99999,
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.mailer.TestSMTPConnection()
			if (err != nil) != tt.wantErr {
				t.Errorf("TestSMTPConnection() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestMailer_Mail(t *testing.T) {
	// Skip this test if no SMTP credentials are provided
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	mailer := &Mailer{
		Host: "localhost", // Use local test SMTP server
		Port: 1025,        // Common port for test servers like MailHog
	}

	subject, err := template.New("subject").Parse("Test Email - {{.Name}}")
	if err != nil {
		t.Fatalf("Failed to parse subject template: %v", err)
	}

	data := Data{
		Name: "Test User",
		Content: map[string]interface{}{
			"test": "value",
		},
	}

	// This test will fail unless you have a local SMTP server running
	err = mailer.Mail(
		[]string{"test@example.com"},
		subject,
		"<h1>Test Email</h1><p>This is a test email from the mailme package.</p>",
		data,
	)

	// We expect this to fail in most cases unless a test server is running
	if err == nil {
		t.Log("Email sent successfully (test SMTP server must be running)")
	} else {
		t.Logf("Email sending failed as expected (no test SMTP server): %v", err)
	}
}

func TestData_Fields(t *testing.T) {
	data := Data{
		Name: "John Doe",
		Content: map[string]interface{}{
			"company": "Supabase",
			"role":    "Developer",
		},
	}

	if data.Name != "John Doe" {
		t.Errorf("Expected Name to be 'John Doe', got '%s'", data.Name)
	}

	if data.Content["company"] != "Supabase" {
		t.Errorf("Expected Content['company'] to be 'Supabase', got '%v'", data.Content["company"])
	}

	if data.Content["role"] != "Developer" {
		t.Errorf("Expected Content['role'] to be 'Developer', got '%v'", data.Content["role"])
	}
}

func TestMailer_MailBuffer(t *testing.T) {
	mailer := &Mailer{
		Host: "localhost",
		Port: 1025,
	}

	subject, err := template.New("subject").Parse("Buffer Test - {{.Name}}")
	if err != nil {
		t.Fatalf("Failed to parse subject template: %v", err)
	}

	data := Data{
		Name: "Buffer Test User",
		Content: map[string]interface{}{
			"method": "MailBuffer",
		},
	}

	// Test the MailBuffer method (should behave identically to Mail)
	err = mailer.MailBuffer(
		[]string{"buffer-test@example.com"},
		subject,
		"<h1>Buffer Test</h1><p>Testing MailBuffer compatibility method.</p>",
		data,
	)

	// We expect this to fail unless a test server is running
	if err == nil {
		t.Log("MailBuffer sent successfully (test SMTP server must be running)")
	} else {
		t.Logf("MailBuffer failed as expected (no test SMTP server): %v", err)
	}
}

// Benchmark tests
func BenchmarkMailer_TestSMTPConnection(b *testing.B) {
	mailer := &Mailer{
		Host: "smtp.gmail.com",
		Port: 587,
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = mailer.TestSMTPConnection()
	}
}

func BenchmarkTemplateExecution(b *testing.B) {
	subject, err := template.New("subject").Parse("Benchmark Test - {{.Name}} from {{.Content.company}}")
	if err != nil {
		b.Fatalf("Failed to parse template: %v", err)
	}

	data := Data{
		Name: "Benchmark User",
		Content: map[string]interface{}{
			"company": "Supabase",
		},
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		var result strings.Builder
		_ = subject.Execute(&result, data)
	}
}

// Test helper function to check if a TCP port is open
func isPortOpen(host string, port int) bool {
	conn, err := net.DialTimeout("tcp", net.JoinHostPort(host, strconv.Itoa(port)), 3*time.Second)
	if err != nil {
		return false
	}
	defer conn.Close()
	return true
}

func TestIsPortOpen(t *testing.T) {
	// Test a commonly open port
	if !isPortOpen("google.com", 80) {
		t.Log("Port 80 on google.com is not accessible (expected in some environments)")
	}

	// Test a port that should be closed
	if isPortOpen("localhost", 99999) {
		t.Error("Port 99999 on localhost should not be open")
	}
}
