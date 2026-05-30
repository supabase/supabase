package freezekit

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"sync"
	"time"
)

// Sink is the abstract destination for captured Artifacts. See the
// design doc for the four bundled implementations.
type Sink interface {
	// Put writes the artifact. Implementations MUST respect ctx
	// for cancellation/deadline. Safe to call concurrently.
	Put(ctx context.Context, art Artifact) error

	// Health returns nil if the sink is currently usable.
	// Implementations may keep this as cheap as `return nil` if
	// no upstream check is feasible.
	Health(ctx context.Context) error

	// Name is the short identifier used in metrics labels.
	Name() string
}

// ListableSink is an optional Sink extension. The HTTP /debug/freezekit/captures
// endpoint uses it to list recent captures.
type ListableSink interface {
	Sink
	// ListRecent returns the manifests of up to `max` most recent
	// captures still resident in the sink.
	ListRecent(max int) ([]Manifest, error)
}

// ---------------------------------------------------------------------------
// NoopSink
// ---------------------------------------------------------------------------

// NoopSink is the Wave 1 default — captures generate metrics but
// artifacts are immediately discarded.
type NoopSink struct{}

func (NoopSink) Put(context.Context, Artifact) error { return nil }
func (NoopSink) Health(context.Context) error        { return nil }
func (NoopSink) Name() string                        { return "noop" }

// ---------------------------------------------------------------------------
// LocalSink
// ---------------------------------------------------------------------------

// LocalSink writes artifacts to a directory tree:
//
//	<root>/<event_id>/<artifact_name>
//
// It tracks total disk usage and LRU-evicts oldest event directories
// when over `BudgetBytes`. Designed to coexist with K8s emptyDir
// `sizeLimit`; pick a Budget << sizeLimit.
type LocalSink struct {
	root        string
	budgetBytes uint64
	metrics     *managerMetrics // optional, may be nil

	mu       sync.Mutex
	indexed  bool
	totalSz  uint64
	events   []localEvent // sorted oldest→newest
}

type localEvent struct {
	id    string
	dir   string
	bytes uint64
	mtime time.Time
}

// NewLocalSink creates a LocalSink. The root directory is created
// if needed. `budgetBytes==0` means no limit (not recommended).
func NewLocalSink(root string, budgetBytes uint64) (*LocalSink, error) {
	if err := os.MkdirAll(root, 0o750); err != nil {
		return nil, fmt.Errorf("local sink mkdir: %w", err)
	}
	return &LocalSink{
		root:        root,
		budgetBytes: budgetBytes,
	}, nil
}

// WithMetrics wires the LocalSink to a metric set so eviction
// counts and disk usage are exported. Typically called by [New]
// when LocalSink is the configured sink.
func (s *LocalSink) WithMetrics(m *managerMetrics) *LocalSink {
	s.metrics = m
	return s
}

func (s *LocalSink) Name() string                       { return "local" }
func (s *LocalSink) Health(context.Context) error       { return nil }

func (s *LocalSink) Put(ctx context.Context, a Artifact) error {
	if a.EventID == "" {
		return errors.New("artifact has no event_id")
	}
	dir := filepath.Join(s.root, a.EventID)
	if err := os.MkdirAll(dir, 0o750); err != nil {
		return err
	}
	path := filepath.Join(dir, a.Name)
	// Atomic write: write to .tmp then rename. Avoids readers
	// (e.g. a sidecar uploader) seeing half-written files.
	tmp := path + ".tmp"
	if err := os.WriteFile(tmp, a.Body, 0o640); err != nil {
		return err
	}
	if err := os.Rename(tmp, path); err != nil {
		_ = os.Remove(tmp)
		return err
	}
	s.afterWrite(a, int64(len(a.Body)))
	return nil
}

func (s *LocalSink) afterWrite(a Artifact, n int64) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if !s.indexed {
		s.indexLocked()
	}
	s.totalSz += uint64(n)

	// Update event entry (or insert).
	found := false
	for i := range s.events {
		if s.events[i].id == a.EventID {
			s.events[i].bytes += uint64(n)
			s.events[i].mtime = time.Now()
			found = true
			break
		}
	}
	if !found {
		s.events = append(s.events, localEvent{
			id:    a.EventID,
			dir:   filepath.Join(s.root, a.EventID),
			bytes: uint64(n),
			mtime: time.Now(),
		})
	}

	s.evictIfNeededLocked()
	if s.metrics != nil {
		s.metrics.localDisk.set(float64(s.totalSz))
	}
}

func (s *LocalSink) evictIfNeededLocked() {
	if s.budgetBytes == 0 {
		return
	}
	for s.totalSz > s.budgetBytes && len(s.events) > 1 {
		oldest := s.events[0]
		if err := os.RemoveAll(oldest.dir); err == nil {
			s.totalSz -= oldest.bytes
			s.events = s.events[1:]
			if s.metrics != nil {
				s.metrics.localEvictions.add(1)
			}
		} else {
			break
		}
	}
}

// indexLocked scans the root once on first use. We don't watch with
// inotify; the next Put refreshes mtime if a manual operator deletes
// a directory.
func (s *LocalSink) indexLocked() {
	s.indexed = true
	entries, err := os.ReadDir(s.root)
	if err != nil {
		return
	}
	for _, e := range entries {
		if !e.IsDir() {
			continue
		}
		dir := filepath.Join(s.root, e.Name())
		ev := localEvent{id: e.Name(), dir: dir}
		_ = filepath.WalkDir(dir, func(p string, d os.DirEntry, _ error) error {
			if d == nil || d.IsDir() {
				return nil
			}
			fi, err := d.Info()
			if err != nil {
				return nil
			}
			ev.bytes += uint64(fi.Size())
			if fi.ModTime().After(ev.mtime) {
				ev.mtime = fi.ModTime()
			}
			return nil
		})
		s.totalSz += ev.bytes
		s.events = append(s.events, ev)
	}
	sort.Slice(s.events, func(i, j int) bool {
		return s.events[i].mtime.Before(s.events[j].mtime)
	})
}

// ListRecent implements ListableSink.
func (s *LocalSink) ListRecent(max int) ([]Manifest, error) {
	s.mu.Lock()
	if !s.indexed {
		s.indexLocked()
	}
	events := append([]localEvent(nil), s.events...)
	s.mu.Unlock()

	// Newest first.
	sort.Slice(events, func(i, j int) bool { return events[i].mtime.After(events[j].mtime) })
	if max > 0 && len(events) > max {
		events = events[:max]
	}

	out := make([]Manifest, 0, len(events))
	for _, e := range events {
		mp := filepath.Join(e.dir, "manifest.json")
		b, err := os.ReadFile(mp)
		if err != nil {
			continue
		}
		var m Manifest
		if err := json.Unmarshal(b, &m); err != nil {
			continue
		}
		out = append(out, m)
	}
	return out, nil
}

// ---------------------------------------------------------------------------
// SignedURLSink
// ---------------------------------------------------------------------------

// SignedURLSink uploads artifacts via HTTPS PUT to an externally-
// generated pre-signed URL. Compatible with S3, GCS V4, R2, MinIO,
// Tigris and Azure Blob (SAS). No cloud SDK required.
//
// The URL is obtained from a tiny "signer" service via:
//
//	GET <SignURL>?key=<event_id>/<artifact>&content_type=<…>
//	→ 200 { "url": "...", "headers": {"x-goog-content-sha256": "..."} }
//
// The signer service is operator-provided; an example is in
// examples/sign-server.
type SignedURLSink struct {
	// SignURL is the absolute URL of the signing service.
	SignURL string

	// AuthHeader is sent verbatim on requests to SignURL. Typical
	// value: "Bearer <token>". Empty disables auth.
	AuthHeader string

	// KeyPrefix is prepended to every object key. Useful for
	// multi-tenant buckets, e.g. "auth/us-east-1/".
	KeyPrefix string

	// Client overrides the default http.Client. nil → an
	// internal client with sane timeouts.
	Client *http.Client
}

func (s *SignedURLSink) Name() string                  { return "signed-url" }
func (s *SignedURLSink) Health(context.Context) error  { return nil }

func (s *SignedURLSink) Put(ctx context.Context, a Artifact) error {
	key := a.EventID + "/" + a.Name
	if s.KeyPrefix != "" {
		key = s.KeyPrefix + key
	}

	signed, err := s.signOne(ctx, key, a.ContentType)
	if err != nil {
		return fmt.Errorf("sign: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPut, signed.URL, bytes.NewReader(a.Body))
	if err != nil {
		return err
	}
	if a.ContentType != "" {
		req.Header.Set("Content-Type", a.ContentType)
	}
	if a.ContentEncoding != "" {
		req.Header.Set("Content-Encoding", a.ContentEncoding)
	}
	for k, v := range signed.Headers {
		req.Header.Set(k, v)
	}
	req.ContentLength = int64(len(a.Body))

	resp, err := s.client().Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		return nil
	}
	body, _ := io.ReadAll(io.LimitReader(resp.Body, 4096))
	return fmt.Errorf("upload http %d: %s", resp.StatusCode, string(body))
}

type signedResponse struct {
	URL     string            `json:"url"`
	Headers map[string]string `json:"headers,omitempty"`
}

func (s *SignedURLSink) signOne(ctx context.Context, key, contentType string) (*signedResponse, error) {
	u := s.SignURL
	if contains(u, '?') {
		u += "&"
	} else {
		u += "?"
	}
	u += "key=" + urlQueryEscape(key)
	if contentType != "" {
		u += "&content_type=" + urlQueryEscape(contentType)
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u, nil)
	if err != nil {
		return nil, err
	}
	if s.AuthHeader != "" {
		req.Header.Set("Authorization", s.AuthHeader)
	}
	resp, err := s.client().Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 1024))
		return nil, fmt.Errorf("signer http %d: %s", resp.StatusCode, string(body))
	}
	var out signedResponse
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return nil, err
	}
	if out.URL == "" {
		return nil, errors.New("signer returned empty url")
	}
	return &out, nil
}

func (s *SignedURLSink) client() *http.Client {
	if s.Client != nil {
		return s.Client
	}
	return defaultSinkClient
}

var defaultSinkClient = &http.Client{
	Timeout: 30 * time.Second,
	Transport: &http.Transport{
		MaxIdleConns:          8,
		MaxIdleConnsPerHost:   4,
		IdleConnTimeout:       60 * time.Second,
		ResponseHeaderTimeout: 15 * time.Second,
		ExpectContinueTimeout: 1 * time.Second,
	},
}

// ---------------------------------------------------------------------------
// MultiSink
// ---------------------------------------------------------------------------

// MultiSink fans out an artifact to multiple sinks. Errors are
// aggregated. The MultiSink's Put returns an error only if EVERY
// child failed — a successful local write counts as success even if
// the cloud upload fails (the operator will pick up the local copy
// on a reconciliation pass).
type MultiSink struct {
	Sinks []Sink
}

func (m MultiSink) Name() string { return "multi" }

func (m MultiSink) Health(ctx context.Context) error {
	var errs []error
	for _, s := range m.Sinks {
		if err := s.Health(ctx); err != nil {
			errs = append(errs, fmt.Errorf("%s: %w", s.Name(), err))
		}
	}
	return errors.Join(errs...)
}

func (m MultiSink) Put(ctx context.Context, a Artifact) error {
	var (
		wg      sync.WaitGroup
		mu      sync.Mutex
		errs    []error
		anyOK   bool
	)
	for _, s := range m.Sinks {
		s := s
		wg.Add(1)
		go func() {
			defer wg.Done()
			if err := s.Put(ctx, a); err != nil {
				mu.Lock()
				errs = append(errs, fmt.Errorf("%s: %w", s.Name(), err))
				mu.Unlock()
				return
			}
			mu.Lock()
			anyOK = true
			mu.Unlock()
		}()
	}
	wg.Wait()
	if anyOK {
		return nil
	}
	return errors.Join(errs...)
}

// ListRecent forwards to the first child that supports it.
func (m MultiSink) ListRecent(max int) ([]Manifest, error) {
	for _, s := range m.Sinks {
		if l, ok := s.(ListableSink); ok {
			return l.ListRecent(max)
		}
	}
	return nil, nil
}

// ---------------------------------------------------------------------------
// helpers — duplicated to keep this file standalone for vendoring.
// ---------------------------------------------------------------------------

func contains(s string, b byte) bool {
	for i := 0; i < len(s); i++ {
		if s[i] == b {
			return true
		}
	}
	return false
}

// urlQueryEscape is a small clone of url.QueryEscape so this file
// doesn't have to import net/url. It handles the subset that
// appears in object keys (ASCII alnum + a few chars).
func urlQueryEscape(s string) string {
	const hex = "0123456789ABCDEF"
	out := make([]byte, 0, len(s))
	for i := 0; i < len(s); i++ {
		c := s[i]
		switch {
		case c >= 'a' && c <= 'z',
			c >= 'A' && c <= 'Z',
			c >= '0' && c <= '9',
			c == '-' || c == '_' || c == '.' || c == '~' || c == '/':
			out = append(out, c)
		default:
			out = append(out, '%', hex[c>>4], hex[c&0xf])
		}
	}
	return string(out)
}
