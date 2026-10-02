package templatemailer

import (
	"bytes"
	"context"
	"fmt"
	"html/template"
	"io"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
	"github.com/supabase/auth/internal/conf"
	"github.com/supabase/auth/internal/mailer"
	"github.com/supabase/auth/internal/mailer/mailmeclient"
	"github.com/supabase/auth/internal/mailer/noopclient"
	"github.com/supabase/auth/internal/mailer/taskclient"
	"github.com/supabase/auth/internal/mailer/validateclient"
	"github.com/supabase/auth/internal/observability"
	"golang.org/x/sync/singleflight"
)

func init() {
	// Ensure every TemplateType has a default subject & body.
	if err := checkDefaults(); err != nil {
		panic(err)
	}
}

// Mailer will send mail and use templates from the site for easy mail styling
type Mailer struct {
	cfg *conf.GlobalConfiguration
	mc  mailer.Client
	tc  *Cache
}

// FromConfig returns a new mailer configured using the global configuration.
func FromConfig(globalConfig *conf.GlobalConfiguration, tc *Cache) *Mailer {
	var mc mailer.Client
	if globalConfig.SMTP.Host == "" {
		logrus.Infof("Noop mail client being used for %v", globalConfig.SiteURL)
		mc = noopclient.New()
	} else {
		mc = mailmeclient.New(globalConfig)
	}

	// Wrap client with validation first
	mc = validateclient.New(globalConfig, mc)

	// Then background tasks
	mc = taskclient.New(globalConfig, mc)

	// Finally the template mailer
	return New(globalConfig, mc, tc)
}

// New will return a *TemplateMailer backed by the given mailer.Client.
func New(globalConfig *conf.GlobalConfiguration, mc mailer.Client, tc *Cache) *Mailer {
	return &Mailer{
		cfg: globalConfig,
		mc:  mc,
		tc:  tc,
	}
}

func (m *Mailer) mail(
	ctx context.Context,
	cfg *conf.GlobalConfiguration,
	tpl string,
	to string,
	data map[string]any,
) error {
	if _, ok := lookupEmailContentConfig(&cfg.Mailer.Subjects, tpl); !ok {
		return fmt.Errorf("templatemailer: template type: %s is invalid", tpl)
	}

	// This is to match the previous behavior, which sent a "reauthenticate"
	// header instead of the same name as template.
	typ := tpl
	if typ == ReauthenticationTemplate {
		typ = "reauthenticate"
	}
	headers := m.Headers(cfg, typ)

	ent, err := m.tc.get(ctx, cfg, tpl)
	if err != nil {
		return err
	}

	var buf bytes.Buffer
	subject, body, err := ent.execute(&buf, data)
	if err != nil {
		return err
	}
	return m.mc.Mail(
		ctx,
		to,
		subject,
		body,
		headers,
		typ,
	)
}

type tplCacheEntry struct {
	createdAt time.Time
	checkedAt time.Time
	def       bool
	typ       string
	subject   *template.Template
	body      *template.Template
}

func newTplCacheEntry(
	at time.Time,
	typ string,
	subject, body *template.Template,
) *tplCacheEntry {
	return &tplCacheEntry{
		createdAt: at,
		checkedAt: at,
		typ:       typ,
		subject:   subject,
		body:      body,
	}
}

func (ent *tplCacheEntry) copy() *tplCacheEntry {
	cpy := *ent
	return &cpy
}

func (ent *tplCacheEntry) execute(
	buf *bytes.Buffer,
	data map[string]any,
) (subject string, body string, err error) {
	if err = ent.subject.Execute(buf, data); err != nil {
		return "", "", err
	}
	subject = buf.String()

	buf.Reset()
	if err = ent.body.Execute(buf, data); err != nil {
		return "", "", err
	}
	body = buf.String()
	return subject, body, nil
}

type Cache struct {
	sf  singleflight.Group
	now func() time.Time

	// Must hold rw for below field access
	rw sync.RWMutex
	m  map[string]*tplCacheEntry // map[TemplateType]*tplCacheEntry
	t  time.Time                 // Time of the most recent call to getEntry
}

func NewCache() *Cache {
	return &Cache{
		m:   make(map[string]*tplCacheEntry),
		now: time.Now,
	}
}

func (o *Cache) Reload(
	ctx context.Context,
	cfg *conf.GlobalConfiguration,
) {
	now := o.now()
	touchedAt := o.getTouchedAt()

	// If the touchedAt time is zero we will eagerly reload. Note we must set
	// the touch time to prevent a server that has never had a request from
	// from reloading indefinitely.
	if touchedAt.IsZero() {
		defer o.setTouchedAt(now)

		o.reloadAt(ctx, cfg, now)
		return
	}

	// If the server has been idle for maxIdle time, we stop updating the
	// templates until the next mail request comes through.
	maxIdle := cfg.Mailer.TemplateReloadingMaxIdle
	if now.Sub(touchedAt) >= maxIdle {
		return
	}

	o.reloadAt(ctx, cfg, now)
}

func (o *Cache) reloadAt(
	ctx context.Context,
	cfg *conf.GlobalConfiguration,
	now time.Time,
) {
	ctx, cancel := context.WithCancel(ctx)
	defer cancel()

	wg := new(sync.WaitGroup)
	defer wg.Wait()

	for _, typ := range templateTypes {
		ent, ok := o.getEntry(typ)
		if !ok {
			// Cache miss, straight to load with no current entry.
			o.reloadType(ctx, cfg, wg, typ, nil)
			continue
		}

		// Before we eagerly reload the template we first make sure we are
		// approaching it's expiration. The goal is to never have the requests
		// block on the singleflight during regular mail requests.
		//
		// The def flag signals that the template is the default template. We
		// skip this check if it's currently set to true, as we want to get a
		// new template as soon soon as possible.
		maxAge := cfg.Mailer.TemplateMaxAge - (cfg.Mailer.TemplateMaxAge / 10)
		if !ent.def && now.Sub(ent.createdAt) < maxAge {
			continue
		}

		// We are approaching the expiration and need to eagerly reload. Before
		// making the request we make sure we haven't recently checked the template
		// using our ival configuration knob. This is just a simple way to give
		// endpoints some breathing room instead of expo backoff with counters.
		retryIval := cfg.Mailer.TemplateRetryInterval
		if now.Sub(ent.checkedAt) < retryIval {
			continue
		}

		// This template type is eligible for reload.
		o.reloadType(ctx, cfg, wg, typ, ent)
	}
}

func (o *Cache) reloadType(
	ctx context.Context,
	cfg *conf.GlobalConfiguration,
	wg *sync.WaitGroup,
	typ string,
	cur *tplCacheEntry,
) {
	wg.Add(1)
	go func(typ string) {
		defer wg.Done()

		ent, err := o.load(ctx, cfg, typ, cur)
		if err != nil {
			return
		}

		if cur == nil || cur.createdAt != ent.createdAt {
			le := observability.GetLogEntryFromContext(ctx).Entry
			le.WithFields(logrus.Fields{
				"event":     "templatemailer_reloader_template_update",
				"mail_type": typ,
			}).Infof("mailer: reloaded template type: %v", typ)
		}
	}(typ)
}

func (o *Cache) getTouchedAt() time.Time {
	o.rw.RLock()
	defer o.rw.RUnlock()
	return o.t
}

func (o *Cache) setTouchedAt(at time.Time) {
	o.rw.Lock()
	defer o.rw.Unlock()
	o.t = at
}

func (o *Cache) getEntry(typ string) (*tplCacheEntry, bool) {
	o.rw.RLock()
	defer o.rw.RUnlock()
	v, ok := o.m[typ]
	return v, ok
}

func (o *Cache) getEntryAndTouchAt(typ string, at time.Time) (*tplCacheEntry, bool) {
	o.rw.Lock()
	defer o.rw.Unlock()
	o.t = at
	v, ok := o.m[typ]
	return v, ok
}

func (o *Cache) putEntry(typ string, ent *tplCacheEntry) {
	o.rw.Lock()
	defer o.rw.Unlock()
	o.m[typ] = ent
}

// get is the method called to fetch an entry from the cache.
func (o *Cache) get(
	ctx context.Context,
	cfg *conf.GlobalConfiguration,
	typ string,
) (*tplCacheEntry, error) {
	now := o.now()
	ent, ok := o.getEntryAndTouchAt(typ, now)
	if !ok {
		// Cache miss, straight to load with no current entry.
		return o.load(ctx, cfg, typ, nil)
	}

	maxAge := cfg.Mailer.TemplateMaxAge
	if now.Sub(ent.createdAt) < maxAge {
		// Cache hit and the entry is not expired, return it.
		return ent, nil
	}

	// Entry is expired, we check if the entry is ready for reloading. We do
	// as much as we can outside of load to prevent synchronization on o.sf.
	retryIval := cfg.Mailer.TemplateRetryInterval
	if now.Sub(ent.checkedAt) < retryIval {
		// Entry was checked within maxIval, return it.
		return ent, nil
	}

	// Call load with our most recent entry.
	return o.load(ctx, cfg, typ, ent)
}

// load is what happens when "get" has a cache miss, the hit has expired or
// the a previously failed check has elapsed the ival.
func (o *Cache) load(
	ctx context.Context,
	cfg *conf.GlobalConfiguration,
	typ string,
	cur *tplCacheEntry,
) (*tplCacheEntry, error) {

	// Before load returns, forget the most recent result of sf. Because we
	// write our cache result in Do we guarantee that the next call to SF
	// after this function returns will be a cache hit.
	defer o.sf.Forget(typ)

	// We prevent a recently restarted auth server from sending multiple
	// concurrent requests to the templating endpoint with pkg singleflight.
	v, err, _ := o.sf.Do(typ, func() (any, error) {

		// First try to load a fresh entry.
		ent, err := o.loadEntry(ctx, cfg, typ)
		if err == nil {
			// No error fetching fresh entry, put in cache & return it.
			o.putEntry(typ, ent)
			return ent, nil
		}

		// We had an err loading a fresh entry. Check if we had a current entry
		// and return a copy of that with a last checked time.
		if cur != nil {
			cpy := cur.copy()
			cpy.checkedAt = o.now()

			o.putEntry(typ, cpy)
			return cpy, nil
		}

		// We have no previous entry and no fresh entry, we will load the
		// default templates so the mailer can continue serving requests.
		ent = o.loadEntryDefault(typ)
		o.putEntry(typ, ent)
		return ent, nil
	})
	if err != nil {
		// I don't believe SF returns an error unless the fn it calls does, so
		// this is mostly a defensive check.
		err = wrapError(ctx, typ, "internal_error", err)
		return nil, err
	}

	// v is always a *tplCacheEntry
	return v.(*tplCacheEntry), nil
}

// loadEntry returns the
func (o *Cache) loadEntry(
	ctx context.Context,
	cfg *conf.GlobalConfiguration,
	typ string,
) (*tplCacheEntry, error) {
	subjectTemp, err := o.loadEntrySubject(ctx, cfg, typ)
	if err != nil {
		return nil, err
	}

	bodyTemp, err := o.loadEntryBody(ctx, cfg, typ)
	if err != nil {
		return nil, err
	}

	now := o.now()
	ent := newTplCacheEntry(now, typ, subjectTemp, bodyTemp)
	return ent, nil
}

// loadEntryDefault will never fail due to the checkDefaults() in init().
func (o *Cache) loadEntryDefault(
	typ string,
) *tplCacheEntry {
	subjectStr := getEmailContentConfig(defaultTemplateSubjects, typ, "")
	subjectTemp := template.Must(template.New("").Parse(subjectStr))

	bodyStr := getEmailContentConfig(defaultTemplateBodies, typ, "")
	bodyTemp := template.Must(template.New("").Parse(bodyStr))

	now := o.now()
	ent := newTplCacheEntry(now, typ, subjectTemp, bodyTemp)
	ent.def = true
	return ent
}

func (o *Cache) loadEntrySubject(
	ctx context.Context,
	cfg *conf.GlobalConfiguration,
	typ string,
) (*template.Template, error) {

	// This matches the existing behavior, which allow for a potential double
	// parse of the default but it's a minor cost for clean control flow.
	tempStr := getEmailContentConfig(
		&cfg.Mailer.Subjects,
		typ,
		getEmailContentConfig(defaultTemplateSubjects, typ, ""))

	temp, err := template.New("Subject").Parse(tempStr)
	if err != nil {
		err = wrapError(ctx, typ, "template_subject_parse_error", err)
		return nil, err
	}
	return temp, nil
}

func (o *Cache) loadEntryBody(
	ctx context.Context,
	cfg *conf.GlobalConfiguration,
	typ string,
) (*template.Template, error) {
	url := getEmailContentConfig(&cfg.Mailer.Templates, typ, "")
	if url == "" {

		// We preserve the previous behavior of returning the default.
		tempStr := getEmailContentConfig(defaultTemplateBodies, typ, "")
		temp := template.Must(template.New("").Parse(tempStr))
		return temp, nil
	}
	if !strings.HasPrefix(url, "http") {
		url = cfg.SiteURL + url
	}

	tempStr, err := o.fetch(ctx, cfg, url)
	if err != nil {
		err = wrapError(ctx, typ, "template_body_http_error", err)
		return nil, err
	}

	temp, err := template.New(url).Parse(tempStr)
	if err != nil {
		err = wrapError(ctx, typ, "template_body_parse_error", err)
		return nil, err
	}
	return temp, nil
}

func (m *Cache) fetch(ctx context.Context, cfg *conf.GlobalConfiguration, url string) (string, error) {
	ctx, cancel := context.WithTimeout(ctx, time.Second*10)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return "", err
	}

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	defer res.Body.Close()

	if code := res.StatusCode; code != http.StatusOK {
		return "", fmt.Errorf("http: GET %v: status code %d", url, code)
	}

	rdr := io.LimitReader(res.Body, int64(cfg.Mailer.TemplateMaxSize))
	data, err := io.ReadAll(rdr)
	if err != nil {
		return "", err
	}

	body := string(data)
	return body, nil
}

func wrapError(ctx context.Context, typ, label string, err error) error {
	if err == nil {
		return nil
	}

	err = fmt.Errorf(
		"templatemailer: template type %q: %w", typ, err)
	le := observability.GetLogEntryFromContext(ctx).Entry
	le.WithFields(logrus.Fields{
		"event":     "templatemailer_" + label,
		"mail_type": typ,
	}).WithError(err).Error(err)
	return err
}

func lookupEmailContentConfig(
	cfg *conf.EmailContentConfiguration,
	tpl string,
) (string, bool) {
	switch tpl {
	default:
		return "", false
	case InviteTemplate:
		return cfg.Invite, true
	case ConfirmationTemplate:
		return cfg.Confirmation, true
	case RecoveryTemplate:
		return cfg.Recovery, true
	case EmailChangeTemplate:
		return cfg.EmailChange, true
	case ReauthenticationTemplate:
		return cfg.Reauthentication, true
	case MagicLinkTemplate:
		return cfg.MagicLink, true

	// Account Changes Notifications
	case PasswordChangedNotificationTemplate:
		return cfg.PasswordChangedNotification, true
	case EmailChangedNotificationTemplate:
		return cfg.EmailChangedNotification, true
	case PhoneChangedNotificationTemplate:
		return cfg.PhoneChangedNotification, true
	case IdentityLinkedNotificationTemplate:
		return cfg.IdentityLinkedNotification, true
	case IdentityUnlinkedNotificationTemplate:
		return cfg.IdentityUnlinkedNotification, true
	case MFAFactorEnrolledNotificationTemplate:
		return cfg.MFAFactorEnrolledNotification, true
	case MFAFactorUnenrolledNotificationTemplate:
		return cfg.MFAFactorUnenrolledNotification, true
	}
}

func getEmailContentConfig(
	cfg *conf.EmailContentConfiguration,
	tpl string,
	def string,
) string {
	// This matches behavior of old withDefault ("" != v)
	if v, ok := lookupEmailContentConfig(cfg, tpl); ok && v != "" {
		return v
	}
	return def
}

func checkDefaults() error {
	seen := make(map[string]bool)
	data := map[string]any{
		"ConfirmationURL": "ConfirmationURL",
		"Data":            "Data",
		"Email":           "Email",
		"NewEmail":        "NewEmail",
		"RedirectTo":      "RedirectTo",
		"SendingTo":       "SendingTo",
		"SiteURL":         "SiteURL",
		"Token":           "Token",
		"TokenHash":       "TokenHash",
	}

	buf := new(bytes.Buffer)
	check := func(cfg *conf.EmailContentConfiguration, typ string) error {
		defer buf.Reset()

		tempStr, ok := lookupEmailContentConfig(cfg, typ)
		if !ok {
			return fmt.Errorf(
				"templatemailer: template type %q: missing default body template", typ)
		}

		temp, err := template.New(typ).Parse(tempStr)
		if err != nil {
			return err
		}

		if err := temp.Execute(buf, data); err != nil {
			return err
		}
		return nil
	}

	for _, typ := range templateTypes {
		if seen[typ] {
			return fmt.Errorf(
				"templatemailer: template type %q: duplicate found", typ)
		}
		seen[typ] = true

		if err := check(defaultTemplateSubjects, typ); err != nil {
			return err
		}
		if err := check(defaultTemplateBodies, typ); err != nil {
			return err
		}
	}
	return nil
}
