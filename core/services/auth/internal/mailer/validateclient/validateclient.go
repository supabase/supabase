package validateclient

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"io"
	"net"
	"net/http"
	"net/mail"
	"strings"
	"time"

	"github.com/supabase/auth/internal/conf"
	"github.com/supabase/auth/internal/mailer"
	"golang.org/x/sync/errgroup"
)

var invalidEmailMap = map[string]bool{

	// People type these often enough to be special cased.
	"test@gmail.com":    true,
	"example@gmail.com": true,
	"someone@gmail.com": true,
	"test@email.com":    true,
}

var invalidHostSuffixes = []string{

	// These are a directly from Section 2 of RFC2606[1].
	//
	// [1] https://www.rfc-editor.org/rfc/rfc2606.html#section-2
	".test",
	".example",
	".invalid",
	".local",
	".localhost",
}

var invalidHostMap = map[string]bool{

	// These exist here too for when they are typed as "test@test"
	"test":      true,
	"example":   true,
	"invalid":   true,
	"local":     true,
	"localhost": true,

	// These are commonly typed and have DNS records which cause a
	// large enough volume of bounce backs to special case.
	"test.com":    true,
	"example.com": true,
	"example.net": true,
	"example.org": true,

	// Hundreds of typos per day for this.
	"gamil.com": true,
	"gamai.com": true,

	// These are not email providers, but people often use them.
	"anonymous.com": true,
	"email.com":     true,
}

// We skip checking hosts for some of the biggest well known public email
// providers, generated via:
//
//	test -f "gmass.html" \
//	  || wget -O "gmass.html" https://www.gmass.co/domains
//	cat "gmass.html" \
//	  | pup 'div#status-details a json{}' \
//	  | jq -r 'map([(.text | split(" "))[1], .children[0].text])
//	      | map("`" + .[0] + ".` : true, // " + .[1]) | join("\n")' \
//	  | sed 's| emails sent||g' \
//	  | head -20
//
// Note:
// This only affects the validateHost code, if we have an exact match we don't
// bother to make a dns request.
var hostAllowList = map[string]bool{
	`gmail.com.`:     true, // 563,185,814
	`yahoo.com.`:     true, // 107,413,999
	`hotmail.com.`:   true, // 98,895,904
	`aol.com.`:       true, // 31,839,178
	`outlook.com.`:   true, // 11,826,511
	`comcast.net.`:   true, // 9,663,112
	`icloud.com.`:    true, // 9,274,437
	`msn.com.`:       true, // 7,101,124
	`hotmail.co.uk.`: true, // 5,456,609
	`sbcglobal.net.`: true, // 5,167,305
	`live.com.`:      true, // 5,140,589
	`yahoo.co.in.`:   true, // 4,091,798
	`me.com.`:        true, // 3,920,969
	`att.net.`:       true, // 3,688,388
	`mail.ru.`:       true, // 3,583,276
	`bellsouth.net.`: true, // 3,455,683
	`rediffmail.com`: true, // 3,400,300
	`cox.net.`:       true, // 3,254,227
	`yahoo.co.uk.`:   true, // 3,218,049
	`verizon.net.`:   true, // 3,046,288
}

const (
	validateEmailTimeout = 3 * time.Second
)

var (
	// We use the default resolver for this.
	validateEmailResolver net.Resolver
)

var (
	ErrInvalidEmailAddress = errors.New("invalid_email_address")
	ErrInvalidEmailFormat  = errors.New("invalid_email_format")
	ErrInvalidEmailDNS     = errors.New("invalid_email_dns")
	ErrInvalidEmailMX      = errors.New("invalid_email_mx")
)

// New will return a Client that first calls an email validator before passing
// the mail along to given Client. If email validation is disabled then it
// returns the same Client passed in mc.
func New(globalConfig *conf.GlobalConfiguration, mc mailer.Client) mailer.Client {

	// Check if email validation is enabled
	ev := newEmailValidator(globalConfig.Mailer)
	if ev.isEnabled() {
		mc = &emailValidatorMailClient{ev: ev, mc: mc}
	}
	return mc
}

type emailValidatorMailClient struct {
	ev *emailValidator
	mc mailer.Client
}

// Mail implements mailer.MailClient interface by calling validate before
// passing the mail request to the next MailClient.
func (o *emailValidatorMailClient) Mail(
	ctx context.Context,
	to string,
	subject string,
	body string,
	headers map[string][]string,
	typ string,
) error {
	if err := o.ev.Validate(ctx, to); err != nil {
		return err
	}
	return o.mc.Mail(
		ctx,
		to,
		subject,
		body,
		headers,
		typ,
	)
}

type emailValidator struct {
	extended         bool
	serviceURL       string
	serviceHeaders   map[string][]string
	blockedMXRecords map[string]bool
}

func newEmailValidator(mc conf.MailerConfiguration) *emailValidator {
	return &emailValidator{
		extended:         mc.EmailValidationExtended,
		serviceURL:       mc.EmailValidationServiceURL,
		serviceHeaders:   mc.GetEmailValidationServiceHeaders(),
		blockedMXRecords: mc.GetEmailValidationBlockedMXRecords(),
	}
}

func (ev *emailValidator) isEnabled() bool {
	return ev.isExtendedEnabled() || ev.isServiceEnabled()
}

func (ev *emailValidator) isExtendedEnabled() bool { return ev.extended }
func (ev *emailValidator) isServiceEnabled() bool  { return ev.serviceURL != "" }

// Validate performs validation on the given email.
//
// When extended is true, returns a nil error in all cases but the following:
// - `email` cannot be parsed by mail.ParseAddress
// - `email` has a domain with no DNS configured
//
// When serviceURL AND serviceKey are non-empty strings it uses the remote
// service to determine if the email is valid.
func (ev *emailValidator) Validate(ctx context.Context, email string) error {
	if !ev.isEnabled() {
		return nil
	}

	// One of the two validation methods are enabled, set a timeout.
	ctx, cancel := context.WithTimeout(ctx, validateEmailTimeout)
	defer cancel()

	// Easier control flow here to always use errgroup, it has very little
	// overhad in comparison to the network calls it makes. The reason
	// we run both checks concurrently is to tighten the timeout without
	// potentially missing a call to the validation service due to a
	// dns timeout or something more nefarious like a honeypot dns entry.
	g := new(errgroup.Group)

	// Validate the static rules first to prevent round trips on bad emails
	// and to parse the host ahead of time.
	if ev.isExtendedEnabled() {

		// First validate static checks such as format, known invalid hosts
		// and any other network free checks. Running this check before we
		// call the service will help reduce the number of calls with known
		// invalid emails.
		host, err := ev.validateStatic(email)
		if err != nil {
			return err
		}

		// Start the goroutine to validate the host.
		g.Go(func() error { return ev.validateHost(ctx, host) })
	}

	// If the service check is enabled we start a goroutine to run
	// that check as well.
	if ev.isServiceEnabled() {
		g.Go(func() error { return ev.validateService(ctx, email) })
	}
	return g.Wait()
}

// validateStatic will validate the format and do the static checks before
// returning the host portion of the email.
func (ev *emailValidator) validateStatic(email string) (string, error) {
	if !ev.isExtendedEnabled() {
		return "", nil
	}

	ea, err := mail.ParseAddress(email)
	if err != nil {
		return "", ErrInvalidEmailFormat
	}

	// The mail package supports RFC 5322 addresses which are not valid for
	// signup users (e.g. Chris Stockton <chris.stockton@host...>).
	if ea.Address != email {
		return "", ErrInvalidEmailFormat
	}

	i := strings.LastIndex(ea.Address, "@")
	if i == -1 {
		return "", ErrInvalidEmailFormat
	}

	// few static lookups that are typed constantly and known to be invalid.
	if invalidEmailMap[email] {
		return "", ErrInvalidEmailAddress
	}

	host := email[i+1:]
	if invalidHostMap[host] {
		return "", ErrInvalidEmailDNS
	}

	for i := range invalidHostSuffixes {
		if strings.HasSuffix(host, invalidHostSuffixes[i]) {
			return "", ErrInvalidEmailDNS
		}
	}

	name := email[:i]
	if err := ev.validateProviders(name, host); err != nil {
		return "", err
	}
	return host, nil
}

func (ev *emailValidator) validateService(ctx context.Context, email string) error {
	if !ev.isServiceEnabled() {
		return nil
	}

	reqObject := struct {
		EmailAddress string `json:"email"`
	}{email}

	reqData, err := json.Marshal(&reqObject)
	if err != nil {
		return nil
	}

	rdr := bytes.NewReader(reqData)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, ev.serviceURL, rdr)
	if err != nil {
		return nil
	}
	req.Header.Set("Content-Type", "application/json")
	for name, vals := range ev.serviceHeaders {
		for _, val := range vals {
			req.Header.Set(name, val)
		}
	}

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil
	}
	defer res.Body.Close()

	resObject := struct {
		Valid *bool `json:"valid"`
	}{}

	if res.StatusCode/100 != 2 {
		// we ignore the error here just in case the service is down
		return nil
	}

	// 32 bytes is plenty for the payload: {"valid": true|false}
	dec := json.NewDecoder(io.LimitReader(res.Body, 1<<5))
	if err := dec.Decode(&resObject); err != nil {
		return nil
	}

	// If the resObject contained no "valid" key we ignore the service and
	// return a nil error. If the Valid key is present AND set to true we
	// will return a nil error, otherwise the valid key was present & false
	// so we fall through to ErrInvalidEmailAddress.
	if resObject.Valid == nil || *resObject.Valid {
		return nil
	}

	return ErrInvalidEmailAddress
}

func (ev *emailValidator) validateProviders(name, host string) error {
	switch host {
	case "gmail.com":
		// Based on a sample of internal data, this reduces the number of
		// bounced emails by 23%. Gmail documentation specifies that the
		// min user name length is 6 characters. There may be some accounts
		// from early gmail beta with shorter email addresses, but I think
		// this reduces bounce rates enough to be worth adding for now.
		if len(name) < 6 {
			return ErrInvalidEmailAddress
		}
	}
	return nil
}

// NOTE(cstockton): We could consider using[1] in the future for an additional
// data point.
//
// [1] https://pkg.go.dev/golang.org/x/net/publicsuffix
func (ev *emailValidator) validateHost(ctx context.Context, host string) error {

	// As far as I know there is no such thing as valid single label hosts for
	// email. This will block anything like: email@a, email@mycompanygltd and
	// so on.
	if !strings.Contains(host, ".") {
		return ErrInvalidEmailDNS
	}

	// Require a FQDN to remove possible implict search behavior.
	if !strings.HasSuffix(host, ".") {
		host = host + "."
	}

	// If the host is in the allow list skip mx check all together.
	if hostAllowList[host] {
		return nil
	}

	mxs, err := validateEmailResolver.LookupMX(ctx, host)
	if !isHostNotFound(err) {
		return ev.validateMXRecords(mxs, nil)
	}

	hosts, err := validateEmailResolver.LookupHost(ctx, host)
	if !isHostNotFound(err) {
		return ev.validateMXRecords(nil, hosts)
	}

	// No addrs or mx records were found
	return ErrInvalidEmailDNS
}

func (ev *emailValidator) validateMXRecords(mxs []*net.MX, hosts []string) error {
	for _, mx := range mxs {
		if ev.blockedMXRecords[mx.Host] {
			return ErrInvalidEmailMX
		}
	}
	for _, host := range hosts {
		if ev.blockedMXRecords[host] {
			return ErrInvalidEmailMX
		}
	}
	return nil
}

func isHostNotFound(err error) bool {
	if err == nil {
		// We had no err, so we treat it as valid. We don't check the mx records
		// because RFC 5321 specifies that if an empty list of MX's are returned
		// the host should be treated as the MX[1].
		//
		// See section 2 and 3 of: https://www.rfc-editor.org/rfc/rfc2606
		// [1] https://www.rfc-editor.org/rfc/rfc5321.html#section-5.1
		return false
	}

	// No names present, we will try to get a positive assertion that the
	// domain is not configured to receive email.
	var dnsError *net.DNSError
	if !errors.As(err, &dnsError) {
		// We will be unable to determine with absolute certainy the email was
		// invalid so we will err on the side of caution and return nil.
		return false
	}

	// The type of err is dnsError, inspect it to see if we can be certain
	// the domain has no mx records currently. For this we require that
	// the error was not temporary or a timeout. If those are both false
	// we trust the value in IsNotFound.
	if !dnsError.IsTemporary && !dnsError.IsTimeout && dnsError.IsNotFound {
		return true
	}
	return false
}
