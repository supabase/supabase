package api

import (
	"net/http"
	"regexp"
	"time"

	"github.com/rs/cors"
	"github.com/sebest/xff"
	"github.com/sirupsen/logrus"
	"github.com/supabase/auth/internal/api/apierrors"
	"github.com/supabase/auth/internal/api/apilimiter"
	"github.com/supabase/auth/internal/api/apitask"
	"github.com/supabase/auth/internal/api/oauthserver"
	"github.com/supabase/auth/internal/api/provider"
	"github.com/supabase/auth/internal/api/scim"
	"github.com/supabase/auth/internal/conf"
	"github.com/supabase/auth/internal/hooks/hookshttp"
	"github.com/supabase/auth/internal/hooks/hookspgfunc"
	"github.com/supabase/auth/internal/hooks/v0hooks"
	"github.com/supabase/auth/internal/mailer"
	"github.com/supabase/auth/internal/mailer/templatemailer"
	"github.com/supabase/auth/internal/models"
	"github.com/supabase/auth/internal/observability"
	"github.com/supabase/auth/internal/sbff"
	"github.com/supabase/auth/internal/security"
	"github.com/supabase/auth/internal/storage"
	"github.com/supabase/auth/internal/tokens"
	"github.com/supabase/auth/internal/utilities"
	"github.com/supabase/hibp"
)

const (
	audHeaderName  = "X-JWT-AUD"
	defaultVersion = "unknown version"
)

var bearerRegexp = regexp.MustCompile(`(?i)^bearer (\S+$)`)

// API is the main REST API
type API struct {
	handler http.Handler
	db      *storage.Connection
	config  *conf.GlobalConfiguration
	version string

	hooksMgr     *v0hooks.Manager
	hibpClient   *hibp.PwnedClient
	oauthServer  *oauthserver.Server
	scim         *scim.Server
	tokenService *tokens.Service
	mailer       mailer.Mailer
	oidcCache    *provider.OIDCProviderCache

	captchaVerifier security.CaptchaVerifier

	// overrideTime can be used to override the clock used by handlers. Should only be used in tests!
	overrideTime func() time.Time

	limiterOpts *apilimiter.Limiter
}

func (a *API) GetConfig() *conf.GlobalConfiguration { return a.config }
func (a *API) GetDB() *storage.Connection           { return a.db }
func (a *API) GetTokenService() *tokens.Service     { return a.tokenService }
func (a *API) Mailer() mailer.Mailer                { return a.mailer }

func (a *API) Version() string {
	return a.version
}

func (a *API) Now() time.Time {
	if a.overrideTime != nil {
		return a.overrideTime()
	}

	return time.Now()
}

// NewAPI instantiates a new REST API
func NewAPI(globalConfig *conf.GlobalConfiguration, db *storage.Connection, opt ...Option) *API {
	return NewAPIWithVersion(globalConfig, db, defaultVersion, opt...)
}

func (a *API) deprecationNotices() {
	config := a.config

	log := logrus.WithField("component", "api")

	if config.JWT.AdminGroupName != "" {
		log.Warn("DEPRECATION NOTICE: GOTRUE_JWT_ADMIN_GROUP_NAME not supported by Supabase's GoTrue, will be removed soon")
	}

	if config.JWT.DefaultGroupName != "" {
		log.Warn("DEPRECATION NOTICE: GOTRUE_JWT_DEFAULT_GROUP_NAME not supported by Supabase's GoTrue, will be removed soon")
	}
}

// NewAPIWithVersion creates a new REST API using the specified version
func NewAPIWithVersion(globalConfig *conf.GlobalConfiguration, db *storage.Connection, version string, opt ...Option) *API {
	api := &API{
		config:  globalConfig,
		db:      db,
		version: version,
	}

	api.oidcCache = provider.NewOIDCProviderCache(globalConfig.External.OIDCProviderCacheTTL)

	for _, o := range opt {
		o.apply(api)
	}
	if api.captchaVerifier == nil {
		api.captchaVerifier = security.NewCaptchaVerifier(&globalConfig.Security.Captcha)
	}
	if api.limiterOpts == nil {
		api.limiterOpts = apilimiter.New(globalConfig)
	}
	if api.hooksMgr == nil {
		httpDr := hookshttp.New()
		pgfuncDr := hookspgfunc.New(db)
		api.hooksMgr = v0hooks.NewManager(globalConfig, httpDr, pgfuncDr)
	}

	// Initialize token service if not provided via options
	if api.tokenService == nil {
		api.tokenService = tokens.NewService(globalConfig, api.hooksMgr)
	}
	if api.mailer == nil {
		tc := templatemailer.NewCache()
		api.mailer = templatemailer.FromConfig(globalConfig, tc)
	}

	// Connect token service to API's time function (supports test overrides)
	api.tokenService.SetTimeFunc(api.Now)

	// Initialize OAuth server (only if enabled)
	if globalConfig.OAuthServer.Enabled {
		api.oauthServer = oauthserver.NewServer(globalConfig, db, api.tokenService)
	}

	api.scim = scim.NewServer(globalConfig)

	if api.config.Password.HIBP.Enabled {
		httpClient := &http.Client{
			// all HIBP API requests should finish quickly to avoid
			// unnecessary slowdowns
			Timeout: 5 * time.Second,
		}

		api.hibpClient = &hibp.PwnedClient{
			UserAgent: api.config.Password.HIBP.UserAgent,
			HTTP:      httpClient,
		}

		if api.config.Password.HIBP.Bloom.Enabled {
			cache := utilities.NewHIBPBloomCache(api.config.Password.HIBP.Bloom.Items, api.config.Password.HIBP.Bloom.FalsePositives)
			api.hibpClient.Cache = cache

			logrus.Infof("Pwned passwords cache is %.2f KB", float64(cache.Cap())/(8*1024.0))
		}
	}

	api.deprecationNotices()

	xffmw, _ := xff.Default()
	logger := observability.NewStructuredLogger(logrus.StandardLogger(), globalConfig)

	r := newRouter()
	r.UseBypass(recoverer)
	r.UseBypass(observability.AddRequestID(globalConfig))
	r.UseBypass(
		sbff.Middleware(
			&globalConfig.Security,
			func(r *http.Request, err error) {
				log := observability.GetLogEntry(r).Entry
				log.WithField("error", err.Error()).Warn("error processing Sb-Forwarded-For")
			},
		),
	)
	r.UseBypass(logger)
	r.UseBypass(xffmw.Handler)
	r.UseBypass(limitRequestBody(1 << 20)) // 1MB

	if globalConfig.API.MaxRequestDuration > 0 {
		r.UseBypass(timeoutMiddleware(globalConfig.API.MaxRequestDuration))
	}

	// request tracing should be added only when tracing or metrics is enabled
	if globalConfig.Tracing.Enabled || globalConfig.Metrics.Enabled {
		r.UseBypass(observability.RequestTracing())
	}

	if globalConfig.DB.CleanupEnabled {
		cleanup := models.NewCleanup(globalConfig)
		r.UseBypass(api.databaseCleanup(cleanup))
	}

	if globalConfig.Mailer.EmailBackgroundSending {
		r.UseBypass(apitask.Middleware)
	}

	r.Get("/health", api.HealthCheck)
	r.Get("/.well-known/jwks.json", api.WellKnownJwks)

	// Both OIDC Discovery and OAuth Authorization Server Metadata use the same unified handler
	// OIDC Discovery is an extension of RFC 8414, so one response satisfies both specs
	r.Get("/.well-known/openid-configuration", api.WellKnownOpenID)
	r.With(api.requireOAuthServerEnabled).Get("/.well-known/oauth-authorization-server", api.WellKnownOpenID)

	r.Route("/callback", func(r *router) {
		r.Use(api.isValidExternalHost)
		r.Use(api.loadFlowState)

		r.Get("/", api.ExternalProviderCallback)
		r.Post("/", api.ExternalProviderCallback)
	})

	r.Route("/", func(r *router) {

		r.Use(api.isValidExternalHost)

		r.Get("/settings", api.Settings)

		// `/authorize` to initiate OAuth2 authorization flow with the external providers
		// where Supabase Auth is an OAuth2 Client
		r.Get("/authorize", api.ExternalProviderRedirect)

		r.With(api.requireAdminCredentials).Post("/invite", api.Invite)
		r.With(api.verifyCaptcha).Route("/signup", func(r *router) {
			// rate limit per hour
			limitAnonymousSignIns := api.limiterOpts.AnonymousSignIns
			limitSignups := api.limiterOpts.Signups
			r.Post("/", func(w http.ResponseWriter, r *http.Request) error {
				params := &SignupParams{}
				if err := retrieveRequestParams(r, params); err != nil {
					return err
				}
				if params.Email == "" && params.Phone == "" {
					if !api.config.External.AnonymousUsers.Enabled {
						return apierrors.NewUnprocessableEntityError(apierrors.ErrorCodeAnonymousProviderDisabled, "Anonymous sign-ins are disabled")
					}
					if _, err := api.limitHandler(limitAnonymousSignIns)(w, r); err != nil {
						return err
					}
					return api.SignupAnonymously(w, r)
				}

				// apply ip-based rate limiting on otps
				if _, err := api.limitHandler(limitSignups)(w, r); err != nil {
					return err
				}
				return api.Signup(w, r)
			})
		})
		r.With(api.limitHandler(api.limiterOpts.Recover)).
			With(api.verifyCaptcha).With(api.requireEmailProvider).Post("/recover", api.Recover)

		r.With(api.limitHandler(api.limiterOpts.Resend)).
			With(api.verifyCaptcha).Post("/resend", api.Resend)

		r.With(api.limitHandler(api.limiterOpts.MagicLink)).
			With(api.verifyCaptcha).Post("/magiclink", api.MagicLink)

		r.With(api.limitHandler(api.limiterOpts.Otp)).
			With(api.verifyCaptcha).Post("/otp", api.Otp)

		// rate limiting applied in handler
		r.With(api.verifyCaptcha).Post("/token", api.Token)

		r.With(api.limitHandler(api.limiterOpts.Verify)).Route("/verify", func(r *router) {
			r.Get("/", api.Verify)
			r.Post("/", api.Verify)
		})

		r.With(api.requireAuthentication).Post("/logout", api.Logout)

		r.With(api.requireAuthentication).Route("/reauthenticate", func(r *router) {
			r.Get("/", api.Reauthenticate)
		})

		r.With(api.requireAuthentication).Route("/user", func(r *router) {
			r.Get("/", api.UserGet)
			r.With(api.limitHandler(api.limiterOpts.User)).Put("/", api.UserUpdate)

			r.Route("/identities", func(r *router) {
				r.Use(api.requireManualLinkingEnabled)
				r.Get("/authorize", api.LinkIdentity)
				r.Delete("/{identity_id}", api.DeleteIdentity)
			})

			// OAuth grant management endpoints
			r.Route("/oauth/grants", func(r *router) {
				r.Use(api.requireOAuthServerEnabled)
				r.Get("/", api.oauthServer.UserListOAuthGrants)
				r.Delete("/", api.oauthServer.UserRevokeOAuthGrant)
			})
		})

		r.With(api.requireAuthentication).Route("/factors", func(r *router) {
			r.Use(api.requireNotAnonymous)
			r.Post("/", api.EnrollFactor)

			r.Route("/recovery-codes", func(r *router) {
				r.Get("/", api.RecoveryCodesStatus)
				r.Post("/", api.RecoveryCodesGenerate)
				r.With(api.limitHandler(api.limiterOpts.FactorVerify)).
					Post("/verify", api.RecoveryCodesVerify)
				r.Post("/regenerate", api.RecoveryCodesRegenerate)
				r.Delete("/", api.RecoveryCodesDelete)
			})

			r.Route("/{factor_id}", func(r *router) {
				r.Use(api.loadFactor)

				r.With(api.limitHandler(api.limiterOpts.FactorVerify)).
					Post("/verify", api.VerifyFactor)
				r.With(api.limitHandler(api.limiterOpts.FactorChallenge)).
					Post("/challenge", api.ChallengeFactor)
				r.Delete("/", api.UnenrollFactor)

			})
		})

		r.Route("/passkeys", func(r *router) {
			r.Use(api.requirePasskeyEnabled)

			r.Route("/authentication", func(r *router) {
				r.With(api.limitHandler(api.limiterOpts.PasskeyAuthentication)).
					With(api.verifyCaptcha).
					Post("/options", api.PasskeyAuthenticationOptions)
				r.Post("/verify", api.PasskeyAuthenticationVerify)
			})

			r.With(api.requireAuthentication).With(api.requireNotAnonymous).Route("/registration", func(r *router) {
				r.Post("/options", api.PasskeyRegistrationOptions)
				r.Post("/verify", api.PasskeyRegistrationVerify)
			})

			r.With(api.requireAuthentication).Get("/", api.PasskeyList)
			r.With(api.requireAuthentication).Route("/{passkey_id}", func(r *router) {
				r.Patch("/", api.PasskeyUpdate)
				r.Delete("/", api.PasskeyDelete)
			})
		})

		r.Route("/sso", func(r *router) {
			r.Use(api.requireSAMLEnabled)
			r.With(api.limitHandler(api.limiterOpts.SSO)).
				With(api.verifyCaptcha).Post("/", api.SingleSignOn)

			r.Route("/saml", func(r *router) {
				r.Get("/metadata", api.SAMLMetadata)

				r.With(api.limitHandler(api.limiterOpts.SAMLAssertion)).
					Post("/acs", api.SamlAcs)
			})
		})

		r.Route("/admin", func(r *router) {
			r.Use(api.requireAdminCredentials)

			r.Route("/audit", func(r *router) {
				r.Get("/", api.adminAuditLog)
			})

			r.Route("/users", func(r *router) {
				r.Get("/", api.adminUsers)
				r.Post("/", api.adminUserCreate)

				r.Route("/{user_id}", func(r *router) {
					r.Use(api.loadUser)
					r.Route("/factors", func(r *router) {
						r.Get("/", api.adminUserGetFactors)
						r.Route("/{factor_id}", func(r *router) {
							r.Use(api.loadFactor)
							r.Delete("/", api.adminUserDeleteFactor)
							r.Put("/", api.adminUserUpdateFactor)
						})
					})

					r.Route("/passkeys", func(r *router) {
						r.Get("/", api.AdminPasskeyList)
						r.Route("/{passkey_id}", func(r *router) {
							r.Delete("/", api.AdminPasskeyDelete)
						})
					})

					r.Get("/", api.adminUserGet)
					r.Put("/", api.adminUserUpdate)
					r.Delete("/", api.adminUserDelete)
				})
			})

			r.Post("/generate_link", api.adminGenerateLink)

			r.Route("/sso", func(r *router) {
				r.Route("/providers", func(r *router) {
					r.Get("/", api.adminSSOProvidersList)
					r.Post("/", api.adminSSOProvidersCreate)

					r.Route("/{idp_id}", func(r *router) {
						r.Use(api.loadSSOProvider)

						r.Get("/", api.adminSSOProvidersGet)
						r.Put("/", api.adminSSOProvidersUpdate)
						r.Delete("/", api.adminSSOProvidersDelete)
					})
				})
			})

			// Admin only oauth client management endpoints
			r.Route("/oauth", func(r *router) {
				r.Use(api.requireOAuthServerEnabled)
				r.Route("/clients", func(r *router) {
					// Manual client registration
					r.Post("/", api.oauthServer.AdminOAuthServerClientRegister)

					r.Get("/", api.oauthServer.OAuthServerClientList)

					r.Route("/{client_id}", func(r *router) {
						r.Use(api.oauthServer.LoadOAuthServerClient)
						r.Get("/", api.oauthServer.OAuthServerClientGet)
						r.Put("/", api.oauthServer.OAuthServerClientUpdate)
						r.Delete("/", api.oauthServer.OAuthServerClientDelete)
						r.Post("/regenerate_secret", api.oauthServer.OAuthServerClientRegenerateSecret)
					})
				})
			})

			// Custom OAuth/OIDC provider management endpoints
			r.Route("/custom-providers", func(r *router) {
				r.Use(api.requireCustomOAuthEnabled)
				// supports both OAuth2 and OIDC via provider_type)
				r.Get("/", api.adminCustomOAuthProvidersList)   // Optional ?type=oauth2 or ?type=oidc filter
				r.Post("/", api.adminCustomOAuthProviderCreate) // provider_type in request body

				r.Route("/{identifier}", func(r *router) {
					r.Get("/", api.adminCustomOAuthProviderGet)
					r.Put("/", api.adminCustomOAuthProviderUpdate)
					r.Delete("/", api.adminCustomOAuthProviderDelete)
				})
			})
		})

		// OAuth Dynamic Client Registration endpoint (public, rate limited)
		r.Route("/oauth", func(r *router) {
			r.Use(api.requireOAuthServerEnabled)
			r.With(api.limitHandler(api.limiterOpts.OAuthClientRegister)).
				Post("/clients/register", api.oauthServer.OAuthServerClientDynamicRegister)

			// OAuth Token endpoint (public, with client authentication)
			r.With(api.requireOAuthClientAuth).Post("/token", api.oauthServer.OAuthToken)

			// OIDC UserInfo endpoint (requires user authentication via Bearer token)
			r.With(api.requireAuthentication).Get("/userinfo", api.oauthServer.OAuthUserInfo)

			// OAuth 2.1 Authorization endpoints
			// `/authorize` to initiate OAuth2 authorization code flow where Supabase Auth is the OAuth2 provider
			r.Get("/authorize", api.oauthServer.OAuthServerAuthorize)
			r.With(api.requireAuthentication).Get("/authorizations/{authorization_id}", api.oauthServer.OAuthServerGetAuthorization)
			r.With(api.requireAuthentication).Post("/authorizations/{authorization_id}/consent", api.oauthServer.OAuthServerConsent)
		})

		r.Route(scim.BasePath, func(r *router) {
			r.Use(api.requireScimServerEnabled)
			r.NotFound(api.scim.NotFound)

			r.Get("/ServiceProviderConfig", api.scim.ServiceProviderConfig)
			r.Get("/ResourceTypes", api.scim.ResourceTypes)
			r.Get("/Schemas", api.scim.Schemas)
		})
	})

	corsHandler := cors.New(cors.Options{
		AllowedMethods:   []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodPatch, http.MethodDelete},
		AllowedHeaders:   globalConfig.CORS.AllAllowedHeaders([]string{"Accept", "Authorization", "Content-Type", "X-Client-IP", "X-Client-Info", audHeaderName, useCookieHeader, APIVersionHeaderName}),
		ExposedHeaders:   []string{"X-Total-Count", "Link", APIVersionHeaderName},
		AllowCredentials: true,
	})

	api.handler = corsHandler.Handler(r)
	return api
}

type HealthCheckResponse struct {
	Version     string `json:"version"`
	Name        string `json:"name"`
	Description string `json:"description"`
}

// HealthCheck endpoint indicates if the gotrue api service is available
func (a *API) HealthCheck(w http.ResponseWriter, r *http.Request) error {
	return sendJSON(w, http.StatusOK, HealthCheckResponse{
		Version:     a.version,
		Name:        "GoTrue",
		Description: "GoTrue is a user registration and authentication API",
	})
}

// ServeHTTP implements the http.Handler interface by passing the request along
// to its underlying Handler.
func (a *API) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	a.handler.ServeHTTP(w, r)
}
