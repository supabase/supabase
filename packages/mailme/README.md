# Mailme

A modern Go email library for Supabase, built on top of the actively maintained [wneessen/go-mail](https://github.com/wneessen/go-mail) library.

## Overview

This package replaces the deprecated `go-gomail/gomail` library with `wneessen/go-mail`, providing:

- Modern Go standards and idiomatic code
- Active maintenance and security updates  
- Better performance and reliability
- Improved context handling and cancellation
- Enhanced TLS and authentication support

## Features

- SMTP email sending with authentication
- HTML email support
- Template-based subject and body rendering
- Connection testing utilities
- Structured logging with logrus
- Context-aware operations with timeouts
- TLS encryption support

## Installation

```bash
go get github.com/supabase/mailme
```

## Usage

### Basic Email Sending

```go
package main

import (
    "html/template"
    "log"

    "github.com/supabase/mailme"
)

func main() {
    // Configure mailer
    mailer := &mailme.Mailer{
        Host:      "smtp.gmail.com",
        Port:      587,
        User:      "your-email@gmail.com",
        Pass:      "your-password",
        LocalName: "localhost",
    }

    // Create subject template
    subject, err := template.New("subject").Parse("Welcome {{.Name}}!")
    if err != nil {
        log.Fatal(err)
    }

    // Prepare email data
    data := mailme.Data{
        Name: "John Doe",
        Content: map[string]interface{}{
            "company": "Supabase",
        },
    }

    // Send email
    err = mailer.Mail(
        []string{"recipient@example.com"},
        subject,
        "<h1>Welcome to Supabase!</h1><p>Hello John, welcome to our platform.</p>",
        data,
    )
    if err != nil {
        log.Fatal(err)
    }
}
```

### Testing SMTP Connection

```go
mailer := &mailme.Mailer{
    Host: "smtp.gmail.com",
    Port: 587,
    User: "your-email@gmail.com",
    Pass: "your-password",
}

if err := mailer.TestSMTPConnection(); err != nil {
    log.Fatalf("SMTP connection failed: %v", err)
}
```

## Migration from go-gomail

This package maintains API compatibility with the original mailme implementation while using the modern `wneessen/go-mail` library underneath.

### Key Changes

1. **Library Replacement**: `gopkg.in/gomail.v2` → `github.com/wneessen/go-mail`
2. **Enhanced Error Handling**: More detailed error messages and context
3. **Context Support**: All operations now support context for better cancellation
4. **TLS Configuration**: Improved TLS setup and security
5. **Connection Testing**: New utilities for SMTP connectivity testing

### Breaking Changes

- Go 1.21+ required (updated from Go 1.20)
- Some internal error messages may differ
- Connection timeouts are now enforced (30s for sending, 15s for testing)

## Configuration

### Mailer Struct

```go
type Mailer struct {
    Host      string // SMTP server hostname
    Port      int    // SMTP server port (usually 587 or 465)
    User      string // SMTP username (usually email address)
    Pass      string // SMTP password or app password
    LocalName string // Local hostname for HELO command (optional)
}
```

### Data Struct

```go
type Data struct {
    Name    string                 // Recipient name for templates
    Content map[string]interface{} // Additional template variables
}
```

## Dependencies

- [github.com/wneessen/go-mail](https://github.com/wneessen/go-mail) - Modern Go email library
- [github.com/sirupsen/logrus](https://github.com/sirupsen/logrus) - Structured logging

## Contributing

This package is part of the Supabase ecosystem. Please follow the contribution guidelines in the main repository.

## License

MIT License - see the main Supabase repository for details.