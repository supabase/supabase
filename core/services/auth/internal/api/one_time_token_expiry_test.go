package api

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
	"github.com/stretchr/testify/suite"
	"github.com/supabase/auth/internal/api/sms_provider"
	"github.com/supabase/auth/internal/conf"
	"github.com/supabase/auth/internal/models"
)

type OneTimeTokenExpiryTestSuite struct {
	suite.Suite
	API    *API
	Config *conf.GlobalConfiguration
}

func TestOneTimeTokenExpiry(t *testing.T) {
	api, config, err := setupAPIForTest()
	require.NoError(t, err)

	ts := &OneTimeTokenExpiryTestSuite{API: api, Config: config}
	defer api.db.Close()

	suite.Run(t, ts)
}

func (ts *OneTimeTokenExpiryTestSuite) SetupTest() {
	models.TruncateAll(ts.API.db)

	// Two different windows to ensure we're using the right config values
	ts.Config.Mailer.OtpExp = 3600
	ts.Config.Sms.OtpExp = 60

	ts.Config.Experimental.OneTimeTokenExpiresAtWriteEnabled = true
}

func (ts *OneTimeTokenExpiryTestSuite) TestEmailTokenMatchesMailerWindow() {
	u, err := models.NewUser("", "otp-exp@example.com", "password", ts.Config.JWT.Aud, nil)
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.API.db.Create(u))

	var buffer bytes.Buffer
	require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]interface{}{
		"email": "otp-exp@example.com",
	}))
	req := httptest.NewRequest(http.MethodPost, "http://localhost/recover", &buffer)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	ts.API.handler.ServeHTTP(w, req)
	require.Equal(ts.T(), http.StatusOK, w.Code)

	u, err = models.FindUserByID(ts.API.db, u.ID)
	require.NoError(ts.T(), err)

	ott, err := models.FindOneTimeToken(ts.API.db, u.RecoveryToken, models.RecoveryToken)
	require.NoError(ts.T(), err)
	require.NotNil(ts.T(), ott.ExpiresAt)

	want := u.RecoverySentAt.Add(ts.Config.Mailer.OtpExpAsDuration())
	require.WithinDuration(ts.T(), want, *ott.ExpiresAt, 2*time.Second)
}

func (ts *OneTimeTokenExpiryTestSuite) TestPhoneTokenMatchesSmsWindow() {
	u, err := models.NewUser("123456789", "", "password", ts.Config.JWT.Aud, nil)
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.API.db.Create(u))

	sms_provider.MockProvider = &TestSmsProvider{}
	defer func() { sms_provider.MockProvider = nil }()

	req, err := http.NewRequest(http.MethodPost, "http://localhost/otp", nil)
	require.NoError(ts.T(), err)
	_, err = ts.API.sendPhoneConfirmation(req, ts.API.db, u, "123456789", phoneConfirmationOtp, sms_provider.SMSProvider)
	require.NoError(ts.T(), err)

	u, err = models.FindUserByID(ts.API.db, u.ID)
	require.NoError(ts.T(), err)

	ott, err := models.FindOneTimeToken(ts.API.db, u.ConfirmationToken, models.ConfirmationToken)
	require.NoError(ts.T(), err)
	require.NotNil(ts.T(), ott.ExpiresAt)

	want := u.ConfirmationSentAt.Add(ts.Config.Sms.OtpExpAsDuration())
	require.WithinDuration(ts.T(), want, *ott.ExpiresAt, 2*time.Second)
}
