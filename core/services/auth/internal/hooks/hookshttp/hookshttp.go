package hookshttp

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"mime"
	"net"
	"net/http"
	"strings"
	"time"

	"github.com/gofrs/uuid"
	"github.com/sirupsen/logrus"
	"github.com/supabase/auth/internal/api/apierrors"
	"github.com/supabase/auth/internal/conf"
	"github.com/supabase/auth/internal/hooks/hookserrors"
	"github.com/supabase/auth/internal/observability"

	standardwebhooks "github.com/standard-webhooks/standard-webhooks/libraries/go"
)

const (
	defaultHTTPHookTimeout  = 5 * time.Second
	defaultHTTPHookRetries  = 3
	httpHookBackoffDuration = 2 * time.Second
	payloadLimit            = 200 * 1024 // 200KB
)

type Dispatcher struct {
	hookTimeout   time.Duration
	hookBackoff   time.Duration
	hookRetries   int
	limitResponse int64
}

type Option interface {
	apply(*Dispatcher)
}

type optionFunc func(*Dispatcher)

func (f optionFunc) apply(o *Dispatcher) { f(o) }

func WithTimeout(d time.Duration) Option {
	return optionFunc(func(o *Dispatcher) {
		o.hookTimeout = d
	})
}

func WithBackoff(d time.Duration) Option {
	return optionFunc(func(o *Dispatcher) {
		o.hookBackoff = d
	})
}

func WithRetries(n int) Option {
	return optionFunc(func(o *Dispatcher) {
		o.hookRetries = n
	})
}
func WithResponseLimit(n int64) Option {
	return optionFunc(func(o *Dispatcher) {
		o.limitResponse = n
	})
}

func New(opts ...Option) *Dispatcher {
	dr := &Dispatcher{
		hookTimeout:   defaultHTTPHookTimeout,
		hookBackoff:   httpHookBackoffDuration,
		hookRetries:   defaultHTTPHookRetries,
		limitResponse: payloadLimit,
	}
	for _, o := range opts {
		o.apply(dr)
	}
	return dr
}

func (o *Dispatcher) Dispatch(
	ctx context.Context,
	cfg *conf.ExtensibilityPointConfiguration,
	req any,
	res any,
) error {
	data, err := o.runHTTPHook(ctx, cfg, req)
	if err != nil {
		return err
	}
	if data != nil {
		if err := json.Unmarshal(data, res); err != nil {
			e := new(apierrors.HTTPError)
			if errors.As(err, &e) {
				return e
			}
			return apierrors.NewInternalServerError(
				"Error unmarshaling JSON output.").WithInternalError(err)
		}
	}
	return nil
}

func (o *Dispatcher) runHTTPHook(
	ctx context.Context,
	hookConfig *conf.ExtensibilityPointConfiguration,
	input any,
) ([]byte, error) {
	client := http.Client{
		Timeout: o.hookTimeout,
	}
	ctx, cancel := context.WithTimeout(ctx, o.hookTimeout)
	defer cancel()

	log := observability.GetLogEntryFromContext(ctx).Entry
	requestURL := hookConfig.URI
	hookLog := log.WithFields(logrus.Fields{
		"component": "auth_hook",
		"url":       requestURL,
	})

	inputPayload, err := json.Marshal(input)
	if err != nil {
		return nil, apierrors.NewInternalServerError(
			"Error marshaling JSON input.").WithInternalError(err)
	}
	for i := range o.hookRetries {
		if i == 0 {
			hookLog.Debugf("invocation attempt: %d", i)
		} else {
			hookLog.Infof("invocation attempt: %d", i)
		}
		msgID := uuid.Must(uuid.NewV4())
		currentTime := time.Now()
		signatureList, err := generateSignatures(
			hookConfig.HTTPHookSecrets, msgID, currentTime, inputPayload)
		if err != nil {
			return nil, apierrors.NewInternalServerError(
				"Error generating signatures: %v", err).WithInternalError(err)
		}

		req, err := http.NewRequestWithContext(
			ctx, http.MethodPost, requestURL, bytes.NewBuffer(inputPayload))
		if err != nil {
			return nil, apierrors.NewInternalServerError(
				"Hook failed to make request object")
		}

		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("webhook-id", msgID.String())
		req.Header.Set("webhook-timestamp", fmt.Sprintf("%d", currentTime.Unix()))
		req.Header.Set("webhook-signature", strings.Join(signatureList, ", "))
		// By default, Go Client sets encoding to gzip, which does not carry a content length header.
		req.Header.Set("Accept-Encoding", "identity")

		rsp, err := client.Do(req)
		if err != nil && errors.Is(err, context.DeadlineExceeded) {
			return nil, apierrors.NewUnprocessableEntityError(
				apierrors.ErrorCodeHookTimeout,
				"Failed to reach hook within maximum time of %f seconds",
				o.hookTimeout.Seconds())

		} else if err != nil {
			if terr, ok := err.(net.Error); ok && terr.Timeout() || i < o.hookRetries-1 {
				hookLog.Errorf(
					"Request timed out for attempt %d with err %s", i, err)
				select {
				case <-ctx.Done():
					return nil, apierrors.NewUnprocessableEntityError(
						apierrors.ErrorCodeHookTimeout,
						"Failed to reach hook within maximum time of %f seconds",
						o.hookTimeout.Seconds())
				case <-time.After(o.hookBackoff):
				}
				continue
			}
			return nil, apierrors.NewUnprocessableEntityError(
				apierrors.ErrorCodeHookTimeoutAfterRetry,
				"Failed to reach hook after maximum retries")
		}
		defer rsp.Body.Close()

		switch rsp.StatusCode {
		case http.StatusNoContent:
			return nil, nil

		case http.StatusOK, http.StatusAccepted:
			contentType := rsp.Header.Get("Content-Type")
			if contentType == "" {
				return nil, apierrors.NewBadRequestError(
					apierrors.ErrorCodeHookPayloadInvalidContentType,
					"Invalid Content-Type: Missing Content-Type header")
			}

			mediaType, _, err := mime.ParseMediaType(contentType)
			if err != nil {
				return nil, apierrors.NewBadRequestError(
					apierrors.ErrorCodeHookPayloadInvalidContentType,
					"Invalid Content-Type header: %s",
					err.Error(),
				)
			}
			if mediaType != "application/json" {
				return nil, apierrors.NewBadRequestError(
					apierrors.ErrorCodeHookPayloadInvalidContentType,
					"Invalid JSON response. Received content-type: %s",
					contentType,
				)
			}

			limitedReader := io.LimitedReader{R: rsp.Body, N: o.limitResponse}
			body, err := io.ReadAll(&limitedReader)
			if err != nil {
				return nil, err
			}
			if limitedReader.N <= 0 {
				// check if the response body still has excess bytes to be read
				if n, _ := rsp.Body.Read(make([]byte, 1)); n > 0 {
					return nil, apierrors.NewUnprocessableEntityError(
						apierrors.ErrorCodeHookPayloadOverSizeLimit,
						"Payload size exceeded size limit of %d bytes",
						o.limitResponse,
					)
				}
			}
			if err := hookserrors.Check(body); err != nil {
				return nil, err
			}

			return body, nil
		case http.StatusTooManyRequests, http.StatusServiceUnavailable:
			retryAfterHeader := rsp.Header.Get("retry-after")
			// Check for truthy values to allow for flexibility to switch to time duration
			if retryAfterHeader != "" {
				continue
			}
			return nil, apierrors.NewInternalServerError(
				"Service currently unavailable due to hook")
		case http.StatusBadRequest:
			return nil, apierrors.NewInternalServerError(
				"Invalid payload sent to hook")
		case http.StatusUnauthorized:
			return nil, apierrors.NewInternalServerError(
				"Hook requires authorization token")
		default:
			return nil, apierrors.NewInternalServerError(
				"Unexpected status code returned from hook: %d", rsp.StatusCode)
		}
	}

	// Previously this returned nil, nil when retryAfterHeader was present
	return nil, apierrors.NewInternalServerError(
		"Service currently unavailable due to hook")
}

func generateSignatures(
	secrets []string,
	msgID uuid.UUID,
	currentTime time.Time,
	inputPayload []byte,
) ([]string, error) {
	SymmetricSignaturePrefix := "v1,"
	// TODO(joel): Handle asymmetric case once library has been upgraded
	var signatureList []string
	for _, secret := range secrets {
		if strings.HasPrefix(secret, SymmetricSignaturePrefix) {
			trimmedSecret := strings.TrimPrefix(secret, SymmetricSignaturePrefix)
			wh, err := standardwebhooks.NewWebhook(trimmedSecret)
			if err != nil {
				return nil, err
			}

			// Note this function as implemented always returns a nil error.
			signature, err := wh.Sign(msgID.String(), currentTime, inputPayload)
			if err != nil {
				return nil, err
			}
			signatureList = append(signatureList, signature)
		} else {
			return nil, errors.New("invalid signature format")
		}
	}
	return signatureList, nil
}
