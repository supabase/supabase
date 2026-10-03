// Package e2ehooks provides utilities for end-to-end testing of hooks.
package e2ehooks

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"net/http/httputil"
	"slices"
	"sync"

	"github.com/supabase/auth/internal/conf"
	"github.com/supabase/auth/internal/e2e/e2eapi"
	"github.com/supabase/auth/internal/hooks/v0hooks"
)

type Instance struct {
	*e2eapi.Instance

	HookServer   *httptest.Server
	HookRecorder *HookRecorder
}

func (o *Instance) Close() error {
	defer o.Instance.Close()
	defer o.HookServer.Close()
	return nil
}

func New(globalCfg *conf.GlobalConfiguration) (*Instance, error) {
	hookRec := NewHookRecorder()
	hookSrv := httptest.NewServer(hookRec)
	hookRec.Register(&globalCfg.Hook, hookSrv.URL)

	test, err := e2eapi.New(globalCfg)
	if err != nil {
		defer hookSrv.Close()

		return nil, err
	}

	o := &Instance{
		Instance:     test,
		HookServer:   hookSrv,
		HookRecorder: hookRec,
	}
	return o, nil
}

func HandleSuccess() http.Handler {
	return HandleJSON(map[string]any{})
}

func HandleJSON(m map[string]any) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Add("content-type", "application/json")

		if err := json.NewEncoder(w).Encode(&m); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
	})
}

type Hook struct {
	mu    sync.Mutex
	name  v0hooks.Name
	calls []*HookCall

	hr http.Handler
}

func NewHook(name v0hooks.Name) *Hook {
	o := &Hook{
		name: name,
	}

	switch name {
	case v0hooks.CustomizeAccessToken:
		// This hooks returns the exact claims given.
		hr := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Add("content-type", "application/json")
			w.WriteHeader(http.StatusOK)

			var v any
			if err := json.NewDecoder(r.Body).Decode(&v); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
			}
			if err := json.NewEncoder(w).Encode(&v); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
			}
		})
		o.SetHandler(hr)

	case v0hooks.MFAVerification:
		hr := HandleJSON(map[string]any{
			"decision": "continue",
		})
		o.SetHandler(hr)

	case v0hooks.PasswordVerification:
		hr := HandleJSON(map[string]any{
			"decision": "continue",
		})
		o.SetHandler(hr)

	default:
		o.SetHandler(HandleSuccess())
	}

	return o
}

func (o *Hook) ClearCalls() {
	o.mu.Lock()
	defer o.mu.Unlock()
	o.calls = nil
}

func (o *Hook) GetCalls() []*HookCall {
	o.mu.Lock()
	defer o.mu.Unlock()
	return slices.Clone(o.calls)
}

func (o *Hook) SetHandler(hr http.Handler) {
	o.mu.Lock()
	defer o.mu.Unlock()
	o.hr = hr
}

func (o *Hook) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	o.mu.Lock()
	defer o.mu.Unlock()

	dump, _ := httputil.DumpRequest(r, true)
	body, err := io.ReadAll(r.Body)
	if err != nil {
		code := http.StatusInternalServerError
		http.Error(w, http.StatusText(code), code)
		return
	}
	r.Body = io.NopCloser(bytes.NewReader(body))

	hc := &HookCall{
		Dump:   string(dump),
		Body:   string(body),
		Header: r.Header.Clone(),
	}
	o.calls = append(o.calls, hc)

	o.hr.ServeHTTP(w, r)
}

type HookCall struct {
	Header http.Header
	Body   string
	Dump   string
}

func (o *HookCall) Unmarshal(v any) error {
	return json.Unmarshal([]byte(o.Body), v)
}

type HookRecorder struct {
	mux                  *http.ServeMux
	BeforeUserCreated    *Hook
	AfterUserCreated     *Hook
	CustomizeAccessToken *Hook
	MFAVerification      *Hook
	PasswordVerification *Hook
	SendEmail            *Hook
	SendSMS              *Hook
}

func NewHookRecorder() *HookRecorder {
	o := &HookRecorder{
		mux:                  http.NewServeMux(),
		BeforeUserCreated:    NewHook(v0hooks.BeforeUserCreated),
		AfterUserCreated:     NewHook(v0hooks.AfterUserCreated),
		CustomizeAccessToken: NewHook(v0hooks.CustomizeAccessToken),
		MFAVerification:      NewHook(v0hooks.MFAVerification),
		PasswordVerification: NewHook(v0hooks.PasswordVerification),
		SendEmail:            NewHook(v0hooks.SendEmail),
		SendSMS:              NewHook(v0hooks.SendSMS),
	}

	o.mux.HandleFunc("POST /hooks/{hook}", func(w http.ResponseWriter, r *http.Request) {
		switch v0hooks.Name(r.PathValue("hook")) {
		case v0hooks.BeforeUserCreated:
			o.BeforeUserCreated.ServeHTTP(w, r)

		case v0hooks.AfterUserCreated:
			o.AfterUserCreated.ServeHTTP(w, r)

		case v0hooks.CustomizeAccessToken:
			o.CustomizeAccessToken.ServeHTTP(w, r)

		case v0hooks.MFAVerification:
			o.MFAVerification.ServeHTTP(w, r)

		case v0hooks.PasswordVerification:
			o.PasswordVerification.ServeHTTP(w, r)

		case v0hooks.SendEmail:
			o.SendEmail.ServeHTTP(w, r)

		case v0hooks.SendSMS:
			o.SendSMS.ServeHTTP(w, r)

		default:
			http.NotFound(w, r)
		}
	})
	return o
}

func (o *HookRecorder) Register(
	hookCfg *conf.HookConfiguration,
	baseURL string,
) {
	set := func(cfg *conf.ExtensibilityPointConfiguration, name v0hooks.Name) {
		*cfg = conf.ExtensibilityPointConfiguration{
			Enabled: true,
			URI:     baseURL + "/hooks/" + string(name),
		}
	}
	set(&hookCfg.BeforeUserCreated, v0hooks.BeforeUserCreated)
	set(&hookCfg.AfterUserCreated, v0hooks.AfterUserCreated)
	set(&hookCfg.CustomAccessToken, v0hooks.CustomizeAccessToken)
	set(&hookCfg.MFAVerificationAttempt, v0hooks.MFAVerification)
	set(&hookCfg.PasswordVerificationAttempt, v0hooks.PasswordVerification)
	set(&hookCfg.SendEmail, v0hooks.SendEmail)
	set(&hookCfg.SendSMS, v0hooks.SendSMS)
}

func (o *HookRecorder) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	o.mux.ServeHTTP(w, r)
}
