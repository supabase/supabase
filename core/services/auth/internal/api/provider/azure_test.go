package provider

import (
	"testing"

	"github.com/supabase/auth/internal/conf"
)

func TestIsAzureIssuer(t *testing.T) {
	positiveExamples := []string{
		"https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/v2.0",
		"https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/v2.0/",
		"https://login.microsoftonline.com/common/v2.0",
	}

	negativeExamples := []string{
		"http://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/v2.0",
		"https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/v2.0?something=else",
		"https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/v2.0/extra",
	}

	for _, example := range positiveExamples {
		if !IsAzureIssuer(example) {
			t.Errorf("Example %q should be treated as a valid Azure issuer", example)
		}
	}

	for _, example := range negativeExamples {
		if IsAzureIssuer(example) {
			t.Errorf("Example %q should be treated as not a valid Azure issuer", example)
		}
	}
}

func TestNewAzureProviderExpectedIssuer(t *testing.T) {
	config := func(url string) conf.OAuthProviderConfiguration {
		return conf.OAuthProviderConfiguration{
			Enabled:     true,
			ClientID:    []string{"client-id"},
			Secret:      "secret",
			RedirectURI: "https://project.supabase.co/auth/v1/callback",
			URL:         url,
		}
	}

	cases := []struct {
		name           string
		url            string
		expectedIssuer string
	}{
		{
			name:           "tenant-specific issuer is pinned",
			url:            "https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad",
			expectedIssuer: "https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/v2.0",
		},
		{
			name:           "tenant-specific issuer is pinned (trailing slash)",
			url:            "https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/",
			expectedIssuer: "https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/v2.0",
		},
		{
			name:           "CIAM tenant issuer is pinned",
			url:            "https://contoso.ciamlogin.com/9188040d-6c67-4c5b-b112-36a304b66dad",
			expectedIssuer: "https://contoso.ciamlogin.com/9188040d-6c67-4c5b-b112-36a304b66dad/v2.0",
		},
		{
			name:           "common endpoint is not pinned",
			url:            "https://login.microsoftonline.com/common",
			expectedIssuer: "",
		},
		{
			name:           "organizations endpoint is not pinned",
			url:            "https://login.microsoftonline.com/organizations",
			expectedIssuer: "",
		},
		{
			name:           "non-Azure URL is not pinned",
			url:            "http://localhost:3000",
			expectedIssuer: "",
		},
		{
			name:           "empty URL defaults to multi-tenant (not pinned)",
			url:            "",
			expectedIssuer: "",
		},
	}

	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			p, err := NewAzureProvider(config(c.url), "", nil)
			if err != nil {
				t.Fatalf("NewAzureProvider returned error: %v", err)
			}

			azure, ok := p.(*azureProvider)
			if !ok {
				t.Fatalf("expected *azureProvider, got %T", p)
			}

			if azure.ExpectedIssuer != c.expectedIssuer {
				t.Errorf("ExpectedIssuer = %q, want %q", azure.ExpectedIssuer, c.expectedIssuer)
			}
		})
	}
}
