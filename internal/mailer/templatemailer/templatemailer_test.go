package templatemailer

import (
	"testing"

	"github.com/stretchr/testify/require"
	"github.com/supabase/auth/internal/conf"
)

func TestTemplateHeaders(t *testing.T) {
	cases := []struct {
		from string
		typ  string
		exp  map[string][]string
	}{
		{
			from: `{"x-supabase-project-ref": ["abcjrhohrqmvcpjpsyzc"]}`,
			typ:  "OTHER-TYPE",
			exp: map[string][]string{
				"x-supabase-project-ref": {"abcjrhohrqmvcpjpsyzc"},
			},
		},

		{
			from: `{"X-Test-A": ["test-a", "test-b"], "X-Test-B": ["test-c", "abc $messageType"]}`,
			typ:  "TEST-MESSAGE-TYPE",
			exp: map[string][]string{
				"X-Test-A": {"test-a", "test-b"},
				"X-Test-B": {"test-c", "abc TEST-MESSAGE-TYPE"},
			},
		},

		{
			from: `{"X-Test-A": ["test-a", "test-b"], "X-Test-B": ["test-c", "abc $messageType"]}`,
			typ:  "OTHER-TYPE",
			exp: map[string][]string{
				"X-Test-A": {"test-a", "test-b"},
				"X-Test-B": {"test-c", "abc OTHER-TYPE"},
			},
		},

		{
			from: `{"X-Test-A": ["test-a", "test-b"], "X-Test-B": ["test-c", "abc $messageType"], "x-supabase-project-ref": ["abcjrhohrqmvcpjpsyzc"]}`,
			typ:  "OTHER-TYPE",
			exp: map[string][]string{
				"X-Test-A":               {"test-a", "test-b"},
				"X-Test-B":               {"test-c", "abc OTHER-TYPE"},
				"x-supabase-project-ref": {"abcjrhohrqmvcpjpsyzc"},
			},
		},
	}
	for _, tc := range cases {
		mailer := New(&conf.GlobalConfiguration{
			SMTP: conf.SMTPConfiguration{
				Headers: tc.from,
			},
		}, nil, nil)

		require.NoError(t, mailer.cfg.SMTP.Validate())

		hdrs := mailer.Headers(mailer.cfg, tc.typ)
		require.Equal(t, hdrs, tc.exp)
	}
}
