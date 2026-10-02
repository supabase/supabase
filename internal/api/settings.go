package api

import "net/http"

type ProviderSettings struct {
	AnonymousUsers bool `json:"anonymous_users"`
	Apple          bool `json:"apple"`
	Azure          bool `json:"azure"`
	Bitbucket      bool `json:"bitbucket"`
	Discord        bool `json:"discord"`
	Facebook       bool `json:"facebook"`
	Snapchat       bool `json:"snapchat"`
	Figma          bool `json:"figma"`
	Fly            bool `json:"fly"`
	GitHub         bool `json:"github"`
	GitLab         bool `json:"gitlab"`
	Google         bool `json:"google"`
	Keycloak       bool `json:"keycloak"`
	Kakao          bool `json:"kakao"`
	Linkedin       bool `json:"linkedin"`
	LinkedinOIDC   bool `json:"linkedin_oidc"`
	Notion         bool `json:"notion"`
	Spotify        bool `json:"spotify"`
	Slack          bool `json:"slack"`
	SlackOIDC      bool `json:"slack_oidc"`
	WorkOS         bool `json:"workos"`
	Twitch         bool `json:"twitch"`
	Twitter        bool `json:"twitter"`
	Email          bool `json:"email"`
	Phone          bool `json:"phone"`
	Zoom           bool `json:"zoom"`
}

type Settings struct {
	ExternalProviders            ProviderSettings `json:"external"`
	DisableSignup                bool             `json:"disable_signup"`
	MailerAutoconfirm            bool             `json:"mailer_autoconfirm"`
	PhoneAutoconfirm             bool             `json:"phone_autoconfirm"`
	SmsProvider                  string           `json:"sms_provider"`
	SAMLEnabled                  bool             `json:"saml_enabled"`
	SAMLPrivateKeyNextConfigured bool             `json:"saml_private_key_next_configured"`
	PasskeysEnabled              bool             `json:"passkeys_enabled"`
}

func (a *API) Settings(w http.ResponseWriter, r *http.Request) error {
	config := a.config

	return sendJSON(w, http.StatusOK, &Settings{
		ExternalProviders: ProviderSettings{
			AnonymousUsers: config.External.AnonymousUsers.Enabled,
			Apple:          config.External.Apple.Enabled,
			Azure:          config.External.Azure.Enabled,
			Bitbucket:      config.External.Bitbucket.Enabled,
			Discord:        config.External.Discord.Enabled,
			Facebook:       config.External.Facebook.Enabled,
			Snapchat:       config.External.Snapchat.Enabled,
			Figma:          config.External.Figma.Enabled,
			Fly:            config.External.Fly.Enabled,
			GitHub:         config.External.Github.Enabled,
			GitLab:         config.External.Gitlab.Enabled,
			Google:         config.External.Google.Enabled,
			Kakao:          config.External.Kakao.Enabled,
			Keycloak:       config.External.Keycloak.Enabled,
			Linkedin:       config.External.Linkedin.Enabled,
			LinkedinOIDC:   config.External.LinkedinOIDC.Enabled,
			Notion:         config.External.Notion.Enabled,
			Spotify:        config.External.Spotify.Enabled,
			Slack:          config.External.Slack.Enabled,
			SlackOIDC:      config.External.SlackOIDC.Enabled,
			Twitch:         config.External.Twitch.Enabled,
			Twitter:        config.External.Twitter.Enabled,
			WorkOS:         config.External.WorkOS.Enabled,
			Email:          config.External.Email.Enabled,
			Phone:          config.External.Phone.Enabled,
			Zoom:           config.External.Zoom.Enabled,
		},
		DisableSignup:                config.DisableSignup,
		MailerAutoconfirm:            config.Mailer.Autoconfirm,
		PhoneAutoconfirm:             config.Sms.Autoconfirm,
		SmsProvider:                  config.Sms.Provider,
		SAMLEnabled:                  config.SAML.Enabled,
		SAMLPrivateKeyNextConfigured: config.SAML.CertificateNext != nil,
		PasskeysEnabled:              config.Passkey.Enabled,
	})
}
