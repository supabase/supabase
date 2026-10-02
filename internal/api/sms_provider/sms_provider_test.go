package sms_provider

import (
	"encoding/base64"
	"fmt"
	"net/http"
	"net/url"
	"testing"

	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
	"github.com/stretchr/testify/suite"
	"github.com/supabase/auth/internal/conf"
	"gopkg.in/h2non/gock.v1"
)

var handleApiRequest func(*http.Request) (*http.Response, error)

type SmsProviderTestSuite struct {
	suite.Suite
	Config *conf.GlobalConfiguration
}

type MockHttpClient struct {
	mock.Mock
}

func (m *MockHttpClient) Do(req *http.Request) (*http.Response, error) {
	return handleApiRequest(req)
}

func TestSmsProvider(t *testing.T) {
	ts := &SmsProviderTestSuite{
		Config: &conf.GlobalConfiguration{
			Sms: conf.SmsProviderConfiguration{
				Twilio: conf.TwilioProviderConfiguration{
					AccountSid:        "test_account_sid",
					AuthToken:         "test_auth_token",
					MessageServiceSid: "test_message_service_id",
				},
				TwilioVerify: conf.TwilioVerifyProviderConfiguration{
					AccountSid:        "test_account_sid",
					AuthToken:         "test_auth_token",
					MessageServiceSid: "test_message_service_id",
				},
				Messagebird: conf.MessagebirdProviderConfiguration{
					AccessKey:  "test_access_key",
					Originator: "test_originator",
				},
				Vonage: conf.VonageProviderConfiguration{
					ApiKey:    "test_api_key",
					ApiSecret: "test_api_secret",
					From:      "test_from",
				},
				Textlocal: conf.TextlocalProviderConfiguration{
					ApiKey: "test_api_key",
					Sender: "test_sender",
				},
			},
		},
	}
	suite.Run(t, ts)
}

func (ts *SmsProviderTestSuite) TestTwilioSendSms() {
	defer gock.Off()
	provider, err := NewTwilioProvider(ts.Config.Sms.Twilio)
	require.NoError(ts.T(), err)

	twilioProvider, ok := provider.(*TwilioProvider)
	require.Equal(ts.T(), true, ok)

	phone := "123456789"
	message := "This is the sms code: 123456"

	body := url.Values{
		"To":      {"+" + phone},
		"Channel": {"sms"},
		"From":    {twilioProvider.Config.MessageServiceSid},
		"Body":    {message},
	}

	cases := []struct {
		Desc           string
		TwilioResponse *gock.Response
		ExpectedError  error
		OTP            string
	}{
		{
			Desc: "Successfully sent sms",
			TwilioResponse: gock.New(twilioProvider.APIPath).Post("").
				MatchHeader("Authorization", "Basic "+base64.StdEncoding.EncodeToString([]byte(twilioProvider.Config.AccountSid+":"+twilioProvider.Config.AuthToken))).
				MatchType("url").BodyString(body.Encode()).
				Reply(200).JSON(SmsStatus{
				To:         "+" + phone,
				From:       twilioProvider.Config.MessageServiceSid,
				Status:     "sent",
				Body:       message,
				MessageSID: "abcdef",
			}),
			OTP:           "123456",
			ExpectedError: nil,
		},
		{
			Desc: "Sms status is failed / undelivered",
			TwilioResponse: gock.New(twilioProvider.APIPath).Post("").
				MatchHeader("Authorization", "Basic "+base64.StdEncoding.EncodeToString([]byte(twilioProvider.Config.AccountSid+":"+twilioProvider.Config.AuthToken))).
				MatchType("url").BodyString(body.Encode()).
				Reply(200).JSON(SmsStatus{
				ErrorMessage: "failed to send sms",
				ErrorCode:    "401",
				Status:       "failed",
				MessageSID:   "abcdef",
			}),
			ExpectedError: fmt.Errorf("twilio error: %v %v for message %v", "failed to send sms", "401", "abcdef"),
		},
		{
			Desc: "Non-2xx status code returned",
			TwilioResponse: gock.New(twilioProvider.APIPath).Post("").
				MatchHeader("Authorization", "Basic "+base64.StdEncoding.EncodeToString([]byte(twilioProvider.Config.AccountSid+":"+twilioProvider.Config.AuthToken))).
				MatchType("url").BodyString(body.Encode()).
				Reply(500).JSON(twilioErrResponse{
				Code:     500,
				Message:  "Internal server error",
				MoreInfo: "error",
				Status:   500,
			}),
			OTP: "123456",
			ExpectedError: &twilioErrResponse{
				Code:     500,
				Message:  "Internal server error",
				MoreInfo: "error",
				Status:   500,
			},
		},
	}

	for _, c := range cases {
		ts.Run(c.Desc, func() {
			_, err = twilioProvider.SendSms(phone, message, SMSProvider, c.OTP)
			require.Equal(ts.T(), c.ExpectedError, err)
		})
	}
}

func (ts *SmsProviderTestSuite) TestMessagebirdSendSms() {
	defer gock.Off()
	provider, err := NewMessagebirdProvider(ts.Config.Sms.Messagebird)
	require.NoError(ts.T(), err)

	messagebirdProvider, ok := provider.(*MessagebirdProvider)
	require.Equal(ts.T(), true, ok)

	phone := "123456789"
	message := "This is the sms code: 123456"
	body := url.Values{
		"originator": {messagebirdProvider.Config.Originator},
		"body":       {message},
		"recipients": {phone},
		"type":       {"sms"},
		"datacoding": {"unicode"},
	}
	gock.New(messagebirdProvider.APIPath).Post("").MatchHeader("Authorization", "AccessKey "+messagebirdProvider.Config.AccessKey).MatchType("url").BodyString(body.Encode()).Reply(200).JSON(MessagebirdResponse{
		Recipients: MessagebirdResponseRecipients{
			TotalSentCount: 1,
		},
	})

	_, err = messagebirdProvider.SendSms(phone, message)
	require.NoError(ts.T(), err)
}

func (ts *SmsProviderTestSuite) TestVonageSendSms() {
	defer gock.Off()
	provider, err := NewVonageProvider(ts.Config.Sms.Vonage)
	require.NoError(ts.T(), err)

	vonageProvider, ok := provider.(*VonageProvider)
	require.Equal(ts.T(), true, ok)

	phone := "123456789"
	message := "This is the sms code: 123456"

	body := url.Values{
		"from":       {vonageProvider.Config.From},
		"to":         {phone},
		"text":       {message},
		"api_key":    {vonageProvider.Config.ApiKey},
		"api_secret": {vonageProvider.Config.ApiSecret},
	}

	gock.New(vonageProvider.APIPath).Post("").MatchType("url").BodyString(body.Encode()).Reply(200).JSON(VonageResponse{
		Messages: []VonageResponseMessage{
			{Status: "0"},
		},
	})

	_, err = vonageProvider.SendSms(phone, message)
	require.NoError(ts.T(), err)
}

func (ts *SmsProviderTestSuite) TestTextLocalSendSms() {
	defer gock.Off()
	provider, err := NewTextlocalProvider(ts.Config.Sms.Textlocal)
	require.NoError(ts.T(), err)

	textlocalProvider, ok := provider.(*TextlocalProvider)
	require.Equal(ts.T(), true, ok)

	phone := "123456789"
	message := "This is the sms code: 123456"
	body := url.Values{
		"sender":  {textlocalProvider.Config.Sender},
		"apikey":  {textlocalProvider.Config.ApiKey},
		"message": {message},
		"numbers": {phone},
	}

	gock.New(textlocalProvider.APIPath).Post("").MatchType("url").BodyString(body.Encode()).Reply(200).JSON(TextlocalResponse{
		Status: "success",
		Errors: []TextlocalError{},
	})

	_, err = textlocalProvider.SendSms(phone, message)
	require.NoError(ts.T(), err)
}
func (ts *SmsProviderTestSuite) TestTwilioVerifySendSms() {
	defer gock.Off()
	provider, err := NewTwilioVerifyProvider(ts.Config.Sms.TwilioVerify)
	require.NoError(ts.T(), err)

	twilioVerifyProvider, ok := provider.(*TwilioVerifyProvider)
	require.Equal(ts.T(), true, ok)

	phone := "123456789"
	message := "This is the sms code: 123456"

	body := url.Values{
		"To":      {"+" + phone},
		"Channel": {"sms"},
	}

	cases := []struct {
		Desc           string
		TwilioResponse *gock.Response
		ExpectedError  error
	}{
		{
			Desc: "Successfully sent sms",
			TwilioResponse: gock.New(twilioVerifyProvider.APIPath).Post("").
				MatchHeader("Authorization", "Basic "+base64.StdEncoding.EncodeToString([]byte(twilioVerifyProvider.Config.AccountSid+":"+twilioVerifyProvider.Config.AuthToken))).
				MatchType("url").BodyString(body.Encode()).
				Reply(200).JSON(SmsStatus{
				To:     "+" + phone,
				From:   twilioVerifyProvider.Config.MessageServiceSid,
				Status: "sent",
				Body:   message,
			}),
			ExpectedError: nil,
		},
		{
			Desc: "Non-2xx status code returned",
			TwilioResponse: gock.New(twilioVerifyProvider.APIPath).Post("").
				MatchHeader("Authorization", "Basic "+base64.StdEncoding.EncodeToString([]byte(twilioVerifyProvider.Config.AccountSid+":"+twilioVerifyProvider.Config.AuthToken))).
				MatchType("url").BodyString(body.Encode()).
				Reply(500).JSON(twilioErrResponse{
				Code:     500,
				Message:  "Internal server error",
				MoreInfo: "error",
				Status:   500,
			}),
			ExpectedError: &twilioErrResponse{
				Code:     500,
				Message:  "Internal server error",
				MoreInfo: "error",
				Status:   500,
			},
		},
	}

	for _, c := range cases {
		ts.Run(c.Desc, func() {
			_, err = twilioVerifyProvider.SendSms(phone, message, SMSProvider)
			require.Equal(ts.T(), c.ExpectedError, err)
		})
	}
}
