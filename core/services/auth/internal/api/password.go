package api

import (
	"context"
	"fmt"
	"strings"

	"github.com/sirupsen/logrus"
	"github.com/supabase/auth/internal/api/apierrors"
)

// BCrypt hashed passwords have a 72 character limit
const MaxPasswordLength = 72

// WeakPasswordError encodes an error that a password does not meet strength
// requirements. It is handled specially in errors.go as it gets transformed to
// a HTTPError with a special weak_password field that encodes the Reasons
// slice.
type WeakPasswordError struct {
	Message string   `json:"message,omitempty"`
	Reasons []string `json:"reasons,omitempty"`
}

func (e *WeakPasswordError) Error() string {
	return e.Message
}

func (a *API) checkPasswordStrength(ctx context.Context, password string) error {
	config := a.config

	if len(password) > MaxPasswordLength {
		return apierrors.NewBadRequestError(
			apierrors.ErrorCodeValidationFailed,
			"Password cannot be longer than %v characters",
			MaxPasswordLength,
		)
	}

	var messages, reasons []string

	if len(password) < config.Password.MinLength {
		reasons = append(reasons, "length")
		messages = append(messages, fmt.Sprintf("Password should be at least %d characters.", config.Password.MinLength))
	}

	for _, characterSet := range config.Password.RequiredCharacters {
		if characterSet != "" && !strings.ContainsAny(password, characterSet) {
			reasons = append(reasons, "characters")

			messages = append(messages, fmt.Sprintf("Password should contain at least one character of each: %s.", strings.Join(config.Password.RequiredCharacters, ", ")))

			break
		}
	}

	if config.Password.HIBP.Enabled {
		pwned, err := a.hibpClient.Check(ctx, password)
		if err != nil {
			if config.Password.HIBP.FailClosed {
				return apierrors.NewInternalServerError("Unable to perform password strength check with HaveIBeenPwned.org.").WithInternalError(err)
			} else {
				logrus.WithError(err).Warn("Unable to perform password strength check with HaveIBeenPwned.org, pwned passwords are being allowed")
			}
		} else if pwned {
			reasons = append(reasons, "pwned")
			messages = append(messages, "Password is known to be weak and easy to guess, please choose a different one.")
		}
	}

	if len(reasons) > 0 {
		return &WeakPasswordError{
			Message: strings.Join(messages, " "),
			Reasons: reasons,
		}
	}

	return nil
}
