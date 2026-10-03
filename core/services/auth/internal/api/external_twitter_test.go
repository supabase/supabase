package api

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
)

func (ts *ExternalTestSuite) TestSignupExternalTwitter() {
	server := TwitterTestSignupSetup(ts, nil, nil, "", "")
	defer server.Close()

	req := httptest.NewRequest(http.MethodGet, "http://localhost/authorize?provider=twitter", nil)
	w := httptest.NewRecorder()
	ts.API.handler.ServeHTTP(w, req)
	ts.Require().Equal(http.StatusFound, w.Code)

	u, err := url.Parse(w.Header().Get("Location"))
	ts.Require().NoError(err, "redirect url parse failed")

	// Twitter uses OAuth1.0 protocol which only returns an oauth_token on the redirect
	q := u.Query()
	ts.Equal("twitter_oauth_token", q.Get("oauth_token"))
}

func TwitterTestSignupSetup(ts *ExternalTestSuite, tokenCount *int, userCount *int, code string, user string) *httptest.Server {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/oauth/request_token":
			w.Header().Add("Content-Type", "application/json")
			fmt.Fprint(w, "oauth_token=twitter_oauth_token&oauth_token_secret=twitter_oauth_token_secret&oauth_callback_confirmed=true")
		default:
			w.WriteHeader(500)
			ts.Fail("unknown google oauth call %s", r.URL.Path)
		}
	}))

	ts.Config.External.Twitter.URL = server.URL

	return server
}
