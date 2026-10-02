package api

import (
	"net/http"
	"net/http/httptest"
	"net/url"
)

func (ts *ExternalTestSuite) TestSignupExternalSlackOIDC() {
	req := httptest.NewRequest(http.MethodGet, "http://localhost/authorize?provider=slack_oidc", nil)
	w := httptest.NewRecorder()
	ts.API.handler.ServeHTTP(w, req)
	ts.Require().Equal(http.StatusFound, w.Code)
	u, err := url.Parse(w.Header().Get("Location"))
	ts.Require().NoError(err, "redirect url parse failed")
	q := u.Query()
	ts.Equal(ts.Config.External.Slack.RedirectURI, q.Get("redirect_uri"))
	ts.Equal(ts.Config.External.Slack.ClientID, []string{q.Get("client_id")})
	ts.Equal("code", q.Get("response_type"))
	ts.Equal("profile email openid", q.Get("scope"))

	assertValidOAuthState(ts, q.Get("state"), "slack_oidc")
}
