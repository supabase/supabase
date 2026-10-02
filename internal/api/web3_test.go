package api

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gobwas/glob"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/stretchr/testify/suite"
	"github.com/supabase/auth/internal/api/apierrors"
	"github.com/supabase/auth/internal/conf"
	"golang.org/x/text/cases"
	"golang.org/x/text/language"
)

type Web3TestSuite struct {
	suite.Suite
	API    *API
	Config *conf.GlobalConfiguration
}

type ChainType string

const (
	ChainSolana   ChainType = "solana"
	ChainEthereum ChainType = "ethereum"
)

func TestWeb3(t *testing.T) {
	api, config, err := setupAPIForTest()
	require.NoError(t, err)

	// Add https://supabase.com (without trailing slash) to allow list
	config.URIAllowList = append(config.URIAllowList, "https://supabase.com")

	// Update the URIAllowListMap with the new entry
	if config.URIAllowListMap == nil {
		config.URIAllowListMap = make(map[string]glob.Glob)
	}
	g := glob.MustCompile("https://supabase.com", '.', '/')
	config.URIAllowListMap["https://supabase.com"] = g

	ts := &Web3TestSuite{
		API:    api,
		Config: config,
	}
	defer api.db.Close()

	suite.Run(t, ts)
}

// FormatChainMessage formats a message with chain name.
//
// @param format string - Format string with one %s placeholder
// @param chain ChainType - The blockchain type
// @return string - Formatted message
//
// Example:
//
//	FormatChainMessage("Error on %s", ChainSolana) // "Error on Solana"
func ChainMessagef(format string, chain ChainType) string {
	chainStr := cases.Title(language.English).String(string(chain))
	return fmt.Sprintf(format, chainStr)
}

func (ts *Web3TestSuite) TestUnsupportedChain() {
	var buffer bytes.Buffer
	require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]interface{}{
		"chain": "blockchain",
	}))

	req := httptest.NewRequest(http.MethodPost, "http://localhost/token?grant_type=web3", &buffer)
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	ts.API.handler.ServeHTTP(w, req)

	var firstResult struct {
		ErrorCode string `json:"error_code"`
		Message   string `json:"msg"`
	}

	assert.NoError(ts.T(), json.NewDecoder(w.Result().Body).Decode(&firstResult))
	assert.Equal(ts.T(), apierrors.ErrorCodeWeb3UnsupportedChain, firstResult.ErrorCode)
	assert.Equal(ts.T(), "Unsupported chain", firstResult.Message)
}

func (ts *Web3TestSuite) TestDisabled() {
	defer func() {
		ts.Config.External.Web3Solana.Enabled = true
		ts.Config.External.Web3Ethereum.Enabled = true
	}()

	ts.Config.External.Web3Solana.Enabled = false
	ts.Config.External.Web3Ethereum.Enabled = false

	for _, chain := range []ChainType{ChainSolana, ChainEthereum} {
		var buffer bytes.Buffer
		require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]interface{}{
			"chain": chain,
		}))

		req := httptest.NewRequest(http.MethodPost, "http://localhost/token?grant_type=web3", &buffer)
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		ts.API.handler.ServeHTTP(w, req)

		var firstResult struct {
			ErrorCode string `json:"error_code"`
			Message   string `json:"msg"`
		}

		assert.NoError(ts.T(), json.NewDecoder(w.Result().Body).Decode(&firstResult))
		assert.Equal(ts.T(), apierrors.ErrorCodeWeb3ProviderDisabled, firstResult.ErrorCode)
		assert.Equal(ts.T(), "Web3 provider is disabled", firstResult.Message)
	}
}

func (ts *Web3TestSuite) TestHappyPath_FullMessage() {
	defer func() {
		ts.API.overrideTime = nil
	}()

	examples := []struct {
		now       string
		chain     ChainType
		message   string
		signature string
	}{
		{
			now:       "2025-03-29T00:09:59Z",
			chain:     ChainSolana,
			message:   "supabase.com wants you to sign in with your Solana account:\n2EZEiBdw47VHT6SpZSW9VnuSvBe7DxuYHBTxj19gxvv8\n\nStatement\n\nURI: https://supabase.com/\nVersion: 1\nIssued At: 2025-03-29T00:00:00Z\nExpiration Time: 2025-03-29T00:10:00Z\nNot Before: 2025-03-29T00:00:00Z",
			signature: "aiKn+PAoB1OoXxS8H34HrB456YD4sKAVjeTjsxgkaQy3bkdV51WBTmUUE9lBU9kuXr0hTLI+1aTn5TFRbIF8CA==",
		},
		{
			now:       "2025-05-16T15:01:59Z",
			chain:     ChainSolana,
			message:   "localhost:5173 wants you to sign in with your Solana account:\n4UPcfLX6rHuunkDiCnrVdN2BxnaKUAT1m2KCrzaAAct6\n\nSign in on localhost\n\nURI: http://localhost:5173/\nVersion: 1\nIssued At: 2025-05-16T14:52:03.613Z",
			signature: "RT2JCFpZQtPwGONApGZn1dZnxOBB3zJZHAQPr+cOaI+eQ4ecw/N6zJ6TNw8a+g8n6Xm/Ky1TVZRuWHSxMU1jDg==",
		},
		// the following two Solana messages are signed via Ledger device according to https://docs.anza.xyz/proposals/off-chain-message-signing, which differs slightly from the non-Ledger signing above
		{
			now:       "2025-07-29T22:30:52.235Z",
			chain:     ChainSolana,
			message:   "supabase.com wants you to sign in with your Solana account:\nEqzxWVyBpLD34SV9w1FFpPPvbfrfAXdiDVg1cyHTR1Rv\n\nI confirm ownership of this wallet\n\nVersion: 1\nURI: https://supabase.com/\nIssued At: 2025-07-29T22:29:52.235Z",
			signature: "9slc0BBJw16TzWYs4/op8na3vt9E0CKt0FL5pqhzTDxvqF/txpbdo+ULDCeSzrDE/uJWmpMQw+hF0rkDj4Q0Bw==",
		},
		{
			now:       "2025-07-29T22:36:10.473Z",
			chain:     ChainSolana,
			message:   "localhost:5173 wants you to sign in with your Solana account:\nEqzxWVyBpLD34SV9w1FFpPPvbfrfAXdiDVg1cyHTR1Rv\n\nI confirm ownership of this wallet\n\nVersion: 1\nURI: http://localhost:5173/\nIssued At: 2025-07-29T22:35:10.473Z",
			signature: "28d9ntDE8iPkxPvzg7A+8/6QFSq8FoPIdV4O5Or6nMDRFrEip/UJKIlLlKXM/SKUeLZmnTcc+V7Y6qnQymUDDg==",
		},
		{
			now:       "2025-03-29T00:09:59Z",
			chain:     ChainEthereum,
			message:   "supabase.com wants you to sign in with your Ethereum account:\n0xa1E993d09257291470e86778399D79A0864F327E\n\nStatement\n\nURI: https://supabase.com\nVersion: 1\nIssued At: 2025-03-29T00:00:00.000Z\nExpiration Time: 2025-03-29T00:10:00Z\nNot Before: 2025-03-29T00:00:00Z",
			signature: "0x37495c9ac73f7a3acb589820699db39e1ab290f6756e41e16c2ddeb8588669440c9df95027597d518e3afb7db6f692fb63c44f56d266b2c65ac78a5d317bf5ef1c"},
		{
			now:       "2025-05-16T15:01:59Z",
			chain:     ChainEthereum,
			message:   "localhost:5173 wants you to sign in with your Ethereum account:\n0x57c039062a750c7fe197b20E12406dB4f7d8833B\n\nSign in on localhost\n\nURI: http://localhost:5173/\nVersion: 1\nIssued At: 2025-05-16T14:52:03.613Z\n",
			signature: "0x0ca657558a144c88d768acb48e31f92bae195d3c7feb4496bd43ad6211ff904e733a0ccc29ed96da5b9f941b2a6b4363f7551d40d3fedb9b239819301c5c42731b"},
	}

	for _, example := range examples {
		ts.API.overrideTime = func() time.Time {
			t, _ := time.Parse(time.RFC3339, example.now)
			return t
		}

		var buffer bytes.Buffer
		require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]interface{}{
			"chain":     example.chain,
			"message":   example.message,
			"signature": example.signature,
		}))

		req := httptest.NewRequest(http.MethodPost, "http://localhost/token?grant_type=web3", &buffer)
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		ts.API.handler.ServeHTTP(w, req)

		assert.Equal(ts.T(), http.StatusOK, w.Code)

		var firstResult struct {
			AccessToken  string `json:"access_token"`
			RefreshToken string `json:"refresh_token"`
		}

		assert.NoError(ts.T(), json.NewDecoder(w.Result().Body).Decode(&firstResult))

		assert.NotEmpty(ts.T(), firstResult.AccessToken)
		assert.NotEmpty(ts.T(), firstResult.RefreshToken)
	}
}

func (ts *Web3TestSuite) TestHappyPath_MinimalMessage() {
	defer func() {
		ts.API.overrideTime = nil
	}()

	ts.API.overrideTime = func() time.Time {
		t, _ := time.Parse(time.RFC3339, "2025-03-29T00:09:59Z")
		return t
	}

	examples := []struct {
		chain     ChainType
		message   string
		signature string
	}{
		{
			chain:     ChainSolana,
			message:   "supabase.com wants you to sign in with your Solana account:\n2EZEiBdw47VHT6SpZSW9VnuSvBe7DxuYHBTxj19gxvv8\n\nStatement\n\nURI: https://supabase.com/\nVersion: 1\nIssued At: 2025-03-29T00:00:00Z",
			signature: "BQxBJ+g2xbMh0LqwYR4ULJ4l7jXFmz33urmp534MS0x7nrGRe2xYdFq41FiGrySX6RipzGqX4kS2vkQmi/+JCg=="},

		{
			chain:     ChainEthereum,
			message:   "supabase.com wants you to sign in with your Ethereum account:\n0xD1FfC6bdfacf333C2B08F88f2f50ddcD87eaCa57\n\nStatement\n\nURI: https://supabase.com/\nVersion: 1\nIssued At: 2025-03-29T00:00:00Z",
			signature: "0xd8dad96466536aca351702766ce1ca321317ef1e7c355b2cf19a166828f78854197ae34e3cdff0a6be1e6317f654ef458623433f14ed55f79f183e7a56c458f51b"},
	}

	for _, example := range examples {
		var buffer bytes.Buffer
		require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]interface{}{
			"chain":     example.chain,
			"message":   example.message,
			"signature": example.signature,
		}))

		req := httptest.NewRequest(http.MethodPost, "http://localhost/token?grant_type=web3", &buffer)
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		ts.API.handler.ServeHTTP(w, req)

		assert.Equal(ts.T(), http.StatusOK, w.Code)

		var firstResult struct {
			AccessToken  string `json:"access_token"`
			RefreshToken string `json:"refresh_token"`
		}

		assert.NoError(ts.T(), json.NewDecoder(w.Result().Body).Decode(&firstResult))

		assert.NotEmpty(ts.T(), firstResult.AccessToken)
		assert.NotEmpty(ts.T(), firstResult.RefreshToken)
	}

}

func (ts *Web3TestSuite) TestValidationRules_URINotHTTPSButIsHTTP() {
	defer func() {
		ts.API.overrideTime = nil
	}()

	ts.API.overrideTime = func() time.Time {
		t, _ := time.Parse(time.RFC3339, "2025-03-29T00:00:00Z")
		return t
	}

	examples := []struct {
		chain     ChainType
		message   string
		signature string
	}{
		{
			chain:     ChainSolana,
			message:   "supabase.com wants you to sign in with your Solana account:\n2EZEiBdw47VHT6SpZSW9VnuSvBe7DxuYHBTxj19gxvv8\n\nStatement\n\nURI: http://supaabse.com\nVersion: 1\nIssued At: 2025-03-29T00:00:00Z",
			signature: "zkCDPRAgy3N6KaYJrFgoTGuR+DDn1T6WiC70/m4GSIKMN3rIIDRUHjX/+bDCRyPTq/nC8N9HkMUvoD86gpVKCw==",
		},
		{
			chain:     ChainEthereum,
			message:   "supabase.com wants you to sign in with your Ethereum account:\n0xaAC67b48E6ECB351b9bDF31Cb56eDe7a1013dB87\n\nStatement\n\nURI: http://supaabse.com\nVersion: 1\nIssued At: 2025-03-29T00:00:00Z",
			signature: "0x22618e84b770eea14eeeb8db70f56c2897f4bc5780d2f736ee03b009f503950730eba54973d89ee93f4c2e86eb5c79f5b928a81ffde359abd2b75bf6f27d2ea71b",
		},
	}

	for _, example := range examples {
		var buffer bytes.Buffer
		require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]interface{}{
			"chain":     example.chain,
			"message":   example.message,
			"signature": example.signature,
		}))

		req := httptest.NewRequest(http.MethodPost, "http://localhost/token?grant_type=web3", &buffer)
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		ts.API.handler.ServeHTTP(w, req)

		assert.Equal(ts.T(), http.StatusBadRequest, w.Code)

		var firstResult struct {
			Error            string `json:"error"`
			ErrorDescription string `json:"error_description"`
		}

		assert.NoError(ts.T(), json.NewDecoder(w.Result().Body).Decode(&firstResult))

		assert.Equal(ts.T(), firstResult.Error, "invalid_grant")
		assert.Equal(ts.T(), firstResult.ErrorDescription, ChainMessagef("Signed %s message is using URI which does not use HTTPS", example.chain))
	}

}

func (ts *Web3TestSuite) TestValidationRules_URINotAllowed() {
	defer func() {
		ts.API.overrideTime = nil
	}()

	ts.API.overrideTime = func() time.Time {
		t, _ := time.Parse(time.RFC3339, "2025-03-29T00:00:00Z")
		return t
	}

	examples := []struct {
		chain     ChainType
		message   string
		signature string
	}{
		{
			chain:     ChainSolana,
			message:   "supabase.green wants you to sign in with your Solana account:\n2EZEiBdw47VHT6SpZSW9VnuSvBe7DxuYHBTxj19gxvv8\n\nStatement\n\nURI: https://supabase.green/\nVersion: 1\nIssued At: 2025-03-29T00:00:00Z\nExpiration Time: 2025-03-29T00:10:00Z",
			signature: "HlwIlZNfJO2yVqnJfeTz1sEHEbU0pag5yyfWVjmoL6wAXNshOlmQCgbzM8AvdF3/JpeWru2FUsC9cKHchHStDw==",
		},
		{
			chain:     ChainEthereum,
			message:   "supabase.green wants you to sign in with your Ethereum account:\n0x2F20F5A9089f09da8Cf8Ee98a65B8092b4c93506\n\nStatement\n\nURI: https://supabase.green/\nVersion: 1\nIssued At: 2025-03-29T00:00:00Z\nExpiration Time: 2025-03-29T00:10:00Z",
			signature: "0xcd161a261af6f5acaccce5319ac9b6c4b442a57aec2f7461cf965fb5059e77d55719ac9629d2f43f8c444e068cdbd8231af4164ba6fd6b28217cda254e898c9d1c",
		},
	}

	for _, example := range examples {
		var buffer bytes.Buffer
		require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]interface{}{
			"chain":     example.chain,
			"message":   example.message,
			"signature": example.signature,
		}))

		req := httptest.NewRequest(http.MethodPost, "http://localhost/token?grant_type=web3", &buffer)
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		ts.API.handler.ServeHTTP(w, req)

		assert.Equal(ts.T(), http.StatusBadRequest, w.Code)

		var firstResult struct {
			Error            string `json:"error"`
			ErrorDescription string `json:"error_description"`
		}

		assert.NoError(ts.T(), json.NewDecoder(w.Result().Body).Decode(&firstResult))

		assert.Equal(ts.T(), "invalid_grant", firstResult.Error)
		assert.Equal(ts.T(), ChainMessagef("Signed %s message is using URI which is not allowed on this server, message was signed for another app", example.chain), firstResult.ErrorDescription)
	}

}

func (ts *Web3TestSuite) TestValidationRules_URINotHTTPS() {
	defer func() {
		ts.API.overrideTime = nil
	}()

	ts.API.overrideTime = func() time.Time {
		t, _ := time.Parse(time.RFC3339, "2025-03-29T00:00:00Z")
		return t
	}

	examples := []struct {
		chain     ChainType
		message   string
		signature string
	}{
		{
			chain:     ChainSolana,
			message:   "supabase.com wants you to sign in with your Solana account:\n2EZEiBdw47VHT6SpZSW9VnuSvBe7DxuYHBTxj19gxvv8\n\nStatement\n\nURI: ftp://supaabse.com\nVersion: 1\nIssued At: 2025-03-29T00:00:00Z",
			signature: "jalHCMtaGNUy5q7BIZRXjdtMJDVDk+ABj/bsIISdbzxc4bjt643llZfjQ3qJJmV1CsnNRgoIyVt8HmGHkIu9CA==",
		},
		{
			chain:     ChainEthereum,
			message:   "supabase.com wants you to sign in with your Ethereum account:\n0xf39FB055D3888f142fb0329755ac53e741E885B7\n\nStatement\n\nURI: ftp://supaabse.com\nVersion: 1\nIssued At: 2025-03-29T00:00:00Z",
			signature: "0x45589b0e4c224f3a24f6b6005ec441b9873724fff479943777ce4d1aa7a1fdf64f62bb2d72debdc20b4975702220a93c390e09dec3c10fa71a50ec1a7d47ad301c",
		},
	}

	for _, example := range examples {
		var buffer bytes.Buffer
		require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]interface{}{
			"chain":     example.chain,
			"message":   example.message,
			"signature": example.signature,
		}))

		req := httptest.NewRequest(http.MethodPost, "http://localhost/token?grant_type=web3", &buffer)
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		ts.API.handler.ServeHTTP(w, req)

		assert.Equal(ts.T(), http.StatusBadRequest, w.Code)

		var firstResult struct {
			Error            string `json:"error"`
			ErrorDescription string `json:"error_description"`
		}

		assert.NoError(ts.T(), json.NewDecoder(w.Result().Body).Decode(&firstResult))

		assert.Equal(ts.T(), "invalid_grant", firstResult.Error)
		assert.Equal(ts.T(), ChainMessagef("Signed %s message is using URI which does not use HTTPS", example.chain), firstResult.ErrorDescription)
	}

}

func (ts *Web3TestSuite) TestValidationRules_InvalidDomain() {
	defer func() {
		ts.API.overrideTime = nil
	}()

	ts.API.overrideTime = func() time.Time {
		t, _ := time.Parse(time.RFC3339, "2025-03-29T00:00:00Z")
		return t
	}

	examples := []struct {
		chain     ChainType
		message   string
		signature string
	}{
		{
			chain:     ChainSolana,
			message:   "supabase.green wants you to sign in with your Solana account:\n2EZEiBdw47VHT6SpZSW9VnuSvBe7DxuYHBTxj19gxvv8\n\nStatement\n\nURI: https://supabase.com/\nVersion: 1\nIssued At: 2025-03-29T00:00:00Z",
			signature: "gB9SNz/fxpWir6ZV/oI3pJIYEce5FjSMkbHzDxMH7k6as2jYBVutMU50/UTH59jx3ULZeW3Xt7pDH+9qJCDjAQ==",
		},
		{
			chain:     ChainEthereum,
			message:   "supabase.green wants you to sign in with your Ethereum account:\n0xDba10e5Dc88B73d61c289891768f9a5647f8cea9\n\nStatement\n\nURI: https://supabase.com/\nVersion: 1\nIssued At: 2025-03-29T00:00:00Z",
			signature: "0x53fa28821050ac913b7bf5a700bc26ec7318620104af79803a18f63310195a20647f2ea0689830eee65f7eda77833edb6b011b6b4821d540ecd569804d1638801c",
		},
	}

	for _, example := range examples {
		var buffer bytes.Buffer
		require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]interface{}{
			"chain":     example.chain,
			"message":   example.message,
			"signature": example.signature,
		}))

		req := httptest.NewRequest(http.MethodPost, "http://localhost/token?grant_type=web3", &buffer)
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		ts.API.handler.ServeHTTP(w, req)

		assert.Equal(ts.T(), http.StatusBadRequest, w.Code)

		var firstResult struct {
			Error            string `json:"error"`
			ErrorDescription string `json:"error_description"`
		}

		assert.NoError(ts.T(), json.NewDecoder(w.Result().Body).Decode(&firstResult))

		assert.Equal(ts.T(), "invalid_grant", firstResult.Error)
		assert.Equal(ts.T(), ChainMessagef("Signed %s message is using a Domain that does not match the one in URI which is not allowed on this server", example.chain), firstResult.ErrorDescription)
	}
}

func (ts *Web3TestSuite) TestValidationRules_MismatchedDomainAndURIHostname() {
	defer func() {
		ts.API.overrideTime = nil
	}()

	ts.API.overrideTime = func() time.Time {
		t, _ := time.Parse(time.RFC3339, "2025-03-29T00:00:00Z")
		return t
	}

	examples := []struct {
		chain     ChainType
		message   string
		signature string
	}{
		{
			chain:     ChainSolana,
			message:   "supabase.green wants you to sign in with your Solana account:\n2EZEiBdw47VHT6SpZSW9VnuSvBe7DxuYHBTxj19gxvv8\n\nStatement\n\nURI: https://supabase.com/\nVersion: 1\nIssued At: 2025-03-29T00:00:00Z\nExpiration Time: 2025-03-29T00:10:00Z",
			signature: "KmRa5LqZnwLE5c+PX45QBhuIY2AXWtD8zi3O5lROKJYho8iIt8vZaVo/2utQ5C77LWNL3nI42q/cC8N80hYKAw==",
		},
		{
			chain:     ChainEthereum,
			message:   "supabase.green wants you to sign in with your Ethereum account:\n0x4501F36264e26b22C77C22b9e45e6E1d696f1c78\n\nStatement\n\nURI: https://supabase.com/\nVersion: 1\nIssued At: 2025-03-29T00:00:00Z\nExpiration Time: 2025-03-29T00:10:00Z",
			signature: "0xe9240ca582bad1421d17f4897adf7ade301358596405d191e0b1d3a856d569f168938e113cb0d6147928b24aeb6f61729dc9ae4c4653442f5dec845506a2de3d1c",
		},
	}

	for _, example := range examples {
		var buffer bytes.Buffer
		require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]interface{}{
			"chain":     example.chain,
			"message":   example.message,
			"signature": example.signature,
		}))

		req := httptest.NewRequest(http.MethodPost, "http://localhost/token?grant_type=web3", &buffer)
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		ts.API.handler.ServeHTTP(w, req)

		assert.Equal(ts.T(), http.StatusBadRequest, w.Code)

		var firstResult struct {
			Error            string `json:"error"`
			ErrorDescription string `json:"error_description"`
		}

		assert.NoError(ts.T(), json.NewDecoder(w.Result().Body).Decode(&firstResult))

		assert.Equal(ts.T(), "invalid_grant", firstResult.Error)
		assert.Equal(ts.T(), ChainMessagef("Signed %s message is using a Domain that does not match the one in URI which is not allowed on this server", example.chain), firstResult.ErrorDescription)
	}
}

func (ts *Web3TestSuite) TestValidationRules_ValidatedBeforeNotBefore() {
	defer func() {
		ts.API.overrideTime = nil
	}()

	ts.API.overrideTime = func() time.Time {
		t, _ := time.Parse(time.RFC3339, "2025-03-29T00:00:59Z")
		return t
	}

	examples := []struct {
		chain     ChainType
		message   string
		signature string
	}{
		{
			chain:     ChainSolana,
			message:   "supabase.com wants you to sign in with your Solana account:\n2EZEiBdw47VHT6SpZSW9VnuSvBe7DxuYHBTxj19gxvv8\n\nStatement\n\nURI: https://supabase.com/\nVersion: 1\nIssued At: 2025-03-29T00:00:00Z\nNot Before: 2025-03-29T00:01:00Z",
			signature: "Pe2PpPEK+SIsO3i26SsWNHeFyLKNdcms4Gf7jy8GGR6EvPlWfKNwAtRGMnQa9MvQHgY7QmVOUDSKmYQlvU2sAA==",
		},
		{
			chain:     ChainEthereum,
			message:   "supabase.com wants you to sign in with your Ethereum account:\n0x4e8fB55380cDf6951B52aF778F0B8c1A4DAcE3c5\n\nStatement\n\nURI: https://supabase.com/\nVersion: 1\nIssued At: 2025-03-29T00:00:00Z\nNot Before: 2025-03-29T00:01:00Z",
			signature: "0xb91e34fc4a4267a1edf4350ed684a8f9a7d79e6abb609e8a3add17b25040100041b3f2506f9bf5929da75311560e469a5581574972c64dfdb7d65a4dfe96f2d41c",
		},
	}

	for _, example := range examples {
		var buffer bytes.Buffer
		require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]interface{}{
			"chain":     example.chain,
			"message":   example.message,
			"signature": example.signature,
		}))

		req := httptest.NewRequest(http.MethodPost, "http://localhost/token?grant_type=web3", &buffer)
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		ts.API.handler.ServeHTTP(w, req)

		assert.Equal(ts.T(), http.StatusBadRequest, w.Code)

		var firstResult struct {
			Error            string `json:"error"`
			ErrorDescription string `json:"error_description"`
		}

		assert.NoError(ts.T(), json.NewDecoder(w.Result().Body).Decode(&firstResult))

		assert.Equal(ts.T(), "invalid_grant", firstResult.Error)
		assert.Equal(ts.T(), ChainMessagef("Signed %s message becomes valid in the future", example.chain), firstResult.ErrorDescription)
	}
}

func (ts *Web3TestSuite) TestValidationRules_Expired() {
	defer func() {
		ts.API.overrideTime = nil
	}()

	ts.API.overrideTime = func() time.Time {
		t, _ := time.Parse(time.RFC3339, "2025-03-29T00:10:01Z")
		return t
	}

	examples := []struct {
		chain     ChainType
		message   string
		signature string
	}{
		{
			chain:     ChainSolana,
			message:   "supabase.com wants you to sign in with your Solana account:\n2EZEiBdw47VHT6SpZSW9VnuSvBe7DxuYHBTxj19gxvv8\n\nStatement\n\nURI: https://supabase.com/\nVersion: 1\nIssued At: 2025-03-29T00:00:00Z\nExpiration Time: 2025-03-29T00:10:00Z\nNot Before: 2025-03-29T00:00:00Z",
			signature: "aiKn+PAoB1OoXxS8H34HrB456YD4sKAVjeTjsxgkaQy3bkdV51WBTmUUE9lBU9kuXr0hTLI+1aTn5TFRbIF8CA==",
		},
		{
			chain:     ChainEthereum,
			message:   "supabase.com wants you to sign in with your Ethereum account:\n0xDAEaF48CC1736705388Bb0cB2A22559d751FCBaC\n\nStatement\n\nURI: https://supabase.com/\nVersion: 1\nIssued At: 2025-03-29T00:00:00Z\nExpiration Time: 2025-03-29T00:10:00Z\nNot Before: 2025-03-29T00:00:00Z",
			signature: "0x3c1d21a56fcb057cc43f8a59a1de903022b30a31ff7bcf8e33387ba08d5f450337df6dfdd48dc941caf925e51c2e8d9987683822c9c413d16ef0ce03c6d1e12f1c"},
	}

	for _, example := range examples {
		var buffer bytes.Buffer
		require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]interface{}{
			"chain":     example.chain,
			"message":   example.message,
			"signature": example.signature,
		}))

		req := httptest.NewRequest(http.MethodPost, "http://localhost/token?grant_type=web3", &buffer)
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		ts.API.handler.ServeHTTP(w, req)

		assert.Equal(ts.T(), http.StatusBadRequest, w.Code)

		var firstResult struct {
			Error            string `json:"error"`
			ErrorDescription string `json:"error_description"`
		}

		assert.NoError(ts.T(), json.NewDecoder(w.Result().Body).Decode(&firstResult))

		assert.Equal(ts.T(), "invalid_grant", firstResult.Error)
		assert.Equal(ts.T(), ChainMessagef("Signed %s message is expired", example.chain), firstResult.ErrorDescription)
	}
}

func (ts *Web3TestSuite) TestValidationRules_Future() {
	defer func() {
		ts.API.overrideTime = nil
	}()

	ts.API.overrideTime = func() time.Time {
		t, _ := time.Parse(time.RFC3339, "2025-03-28T23:49:59Z")
		return t
	}

	examples := []struct {
		chain     ChainType
		message   string
		signature string
	}{
		{
			chain:     ChainSolana,
			message:   "supabase.com wants you to sign in with your Solana account:\n2EZEiBdw47VHT6SpZSW9VnuSvBe7DxuYHBTxj19gxvv8\n\nStatement\n\nURI: https://supabase.com/\nVersion: 1\nIssued At: 2025-03-29T00:00:00Z",
			signature: "BQxBJ+g2xbMh0LqwYR4ULJ4l7jXFmz33urmp534MS0x7nrGRe2xYdFq41FiGrySX6RipzGqX4kS2vkQmi/+JCg==",
		},
		{
			chain:     ChainEthereum,
			message:   "supabase.com wants you to sign in with your Ethereum account:\n0x07d4A4b507320CB5F546d865438E3C7d9405aF98\n\nStatement\n\nURI: https://supabase.com/\nVersion: 1\nIssued At: 2025-03-29T00:00:00Z",
			signature: "0xc62de543d24afb0b4d6caae9b6a2c7ffbfe5213a3be5adabc0cbb3493e63ffa32bb0de829b37df1ba4a4db174c4c698887966fabc0e92ca6fd9937cccea8c5fa1c"},
	}
	for _, example := range examples {
		var buffer bytes.Buffer
		require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]interface{}{
			"chain":     example.chain,
			"message":   example.message,
			"signature": example.signature,
		}))

		req := httptest.NewRequest(http.MethodPost, "http://localhost/token?grant_type=web3", &buffer)
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		ts.API.handler.ServeHTTP(w, req)

		assert.Equal(ts.T(), http.StatusBadRequest, w.Code)

		var firstResult struct {
			Error            string `json:"error"`
			ErrorDescription string `json:"error_description"`
		}

		assert.NoError(ts.T(), json.NewDecoder(w.Result().Body).Decode(&firstResult))

		assert.Equal(ts.T(), "invalid_grant", firstResult.Error)
		assert.Equal(ts.T(), ChainMessagef("%s message was issued too far in the future", example.chain), firstResult.ErrorDescription)
	}
}

func (ts *Web3TestSuite) TestValidationRules_IssedTooLongAgo() {
	defer func() {
		ts.API.overrideTime = nil
	}()

	ts.API.overrideTime = func() time.Time {
		t, _ := time.Parse(time.RFC3339, "2025-03-29T00:00:00Z")
		d, _ := time.ParseDuration("10m1s")

		return t.Add(d)
	}

	examples := []struct {
		chain     ChainType
		message   string
		signature string
	}{
		{
			chain:     ChainSolana,
			message:   "supabase.com wants you to sign in with your Solana account:\n2EZEiBdw47VHT6SpZSW9VnuSvBe7DxuYHBTxj19gxvv8\n\nStatement\n\nURI: https://supabase.com/\nVersion: 1\nIssued At: 2025-03-29T00:00:00Z\nNot Before: 2025-03-29T00:00:00Z",
			signature: "ds3yyRoevZ0CuyUFOfuAJV/QAA+m302JJjnkOQO3ou5AHPQBNdbwYDj2JzF/5Ox6qyAqN/phU8NnmK8eUtzMDw==",
		},
		{
			chain:     ChainEthereum,
			message:   "supabase.com wants you to sign in with your Ethereum account:\n0x5Af584D3902e60104FcA6016236B5bCDBc9e6F24\n\nStatement\n\nURI: https://supabase.com/\nVersion: 1\nIssued At: 2025-03-29T00:00:00Z\nNot Before: 2025-03-29T00:00:00Z",
			signature: "0x1b22e465a4d41c86af48973f204b363ad665b6e6aab8ecb2bd68c0ffb395ca5e055f9062ca312185230ebbc0e9c8c3af059563725ef37599552ada80d675f6e21c"},
	}

	for _, example := range examples {

		var buffer bytes.Buffer
		require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]interface{}{
			"chain":     example.chain,
			"message":   example.message,
			"signature": example.signature,
		}))

		req := httptest.NewRequest(http.MethodPost, "http://localhost/token?grant_type=web3", &buffer)
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		ts.API.handler.ServeHTTP(w, req)

		assert.Equal(ts.T(), http.StatusBadRequest, w.Code)

		var firstResult struct {
			Error            string `json:"error"`
			ErrorDescription string `json:"error_description"`
		}

		assert.NoError(ts.T(), json.NewDecoder(w.Result().Body).Decode(&firstResult))

		assert.Equal(ts.T(), "invalid_grant", firstResult.Error)
		assert.Equal(ts.T(), ChainMessagef("%s message was issued too long ago", example.chain), firstResult.ErrorDescription)
	}
}

func (ts *Web3TestSuite) TestValidationRules_InvalidSignature() {
	defer func() {
		ts.API.overrideTime = nil
	}()

	ts.API.overrideTime = func() time.Time {
		t, _ := time.Parse(time.RFC3339, "2025-03-29T00:00:00Z")
		return t
	}

	examples := []struct {
		chain     ChainType
		message   string
		signature string
	}{
		{
			chain:     ChainSolana,
			message:   "supabase.com wants you to sign in with your Solana account:\n2EZEiBdw47VHT6SpZSW9VnuSvBe7DxuYHBTxj19gxvv8\n\nStatement\n\nURI: https://supabase.com/\nVersion: 1\nIssued At: 2025-03-29T00:00:00Z\nExpiration Time: 2025-03-29T00:10:00Z\nNot Before: 2025-03-29T00:00:00Z",
			signature: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx==",
		},
		{
			chain:     ChainEthereum,
			message:   "supabase.com wants you to sign in with your Ethereum account:\n0xa28F6ff675D6409fB5b139A0Cc9E135AB83D9041\n\nStatement\n\nURI: https://supabase.com/\nVersion: 1\nIssued At: 2025-03-29T00:00:00Z\nExpiration Time: 2025-03-29T00:10:00Z\nNot Before: 2025-03-29T00:00:00Z",
			signature: "0x1b22e465a4d41c86af48973f204b363ad665b6e6aab8ecb2bd68c0ffb395ca5e055f9062ca312185230ebbc0e9c8c3af059563725ef37599552ada80d675f6e21c",
		}}

	for _, example := range examples {

		var buffer bytes.Buffer
		require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]interface{}{
			"chain":     example.chain,
			"message":   example.message,
			"signature": example.signature,
		}))

		req := httptest.NewRequest(http.MethodPost, "http://localhost/token?grant_type=web3", &buffer)
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		ts.API.handler.ServeHTTP(w, req)

		assert.Equal(ts.T(), http.StatusBadRequest, w.Code)

		var firstResult struct {
			Error            string `json:"error"`
			ErrorDescription string `json:"error_description"`
		}

		assert.NoError(ts.T(), json.NewDecoder(w.Result().Body).Decode(&firstResult))

		assert.Equal(ts.T(), firstResult.Error, "invalid_grant")
		assert.Equal(ts.T(), firstResult.ErrorDescription, "Signature does not match address in message")
	}
}

func (ts *Web3TestSuite) TestValidationRules_BasicValidation() {
	for _, chain := range []ChainType{ChainSolana, ChainSolana} {
		var buffer bytes.Buffer
		require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]interface{}{
			"chain":     chain,
			"message":   strings.Repeat(" ", 63),
			"signature": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx==",
		}))

		req := httptest.NewRequest(http.MethodPost, "http://localhost/token?grant_type=web3", &buffer)
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		ts.API.handler.ServeHTTP(w, req)

		assert.Equal(ts.T(), http.StatusBadRequest, w.Code)

		require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]interface{}{
			"chain":     chain,
			"message":   strings.Repeat(" ", 64),
			"signature": strings.Repeat("x", 85),
		}))

		req = httptest.NewRequest(http.MethodPost, "http://localhost/token?grant_type=web3", &buffer)
		req.Header.Set("Content-Type", "application/json")

		w = httptest.NewRecorder()
		ts.API.handler.ServeHTTP(w, req)

		assert.Equal(ts.T(), http.StatusBadRequest, w.Code)

		require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]interface{}{
			"chain":     chain,
			"message":   strings.Repeat(" ", 64),
			"signature": strings.Repeat("x", 89),
		}))

		req = httptest.NewRequest(http.MethodPost, "http://localhost/token?grant_type=web3", &buffer)
		req.Header.Set("Content-Type", "application/json")

		w = httptest.NewRecorder()
		ts.API.handler.ServeHTTP(w, req)

		assert.Equal(ts.T(), http.StatusBadRequest, w.Code)

		require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]interface{}{
			"chain":     chain,
			"message":   strings.Repeat(" ", 20*1024+1),
			"signature": strings.Repeat("x", 86),
		}))

		req = httptest.NewRequest(http.MethodPost, "http://localhost/token?grant_type=web3", &buffer)
		req.Header.Set("Content-Type", "application/json")

		w = httptest.NewRecorder()
		ts.API.handler.ServeHTTP(w, req)

		assert.Equal(ts.T(), http.StatusBadRequest, w.Code)

		require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]interface{}{
			"chain":     chain,
			"message":   strings.Repeat(" ", 64),
			"signature": strings.Repeat("\x00", 86),
		}))

		req = httptest.NewRequest(http.MethodPost, "http://localhost/token?grant_type=web3", &buffer)
		req.Header.Set("Content-Type", "application/json")

		w = httptest.NewRecorder()
		ts.API.handler.ServeHTTP(w, req)

		assert.Equal(ts.T(), http.StatusBadRequest, w.Code)

		require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]interface{}{
			"chain":     chain,
			"message":   strings.Repeat(" ", 64),
			"signature": strings.Repeat("x", 86),
		}))

		req = httptest.NewRequest(http.MethodPost, "http://localhost/token?grant_type=web3", &buffer)
		req.Header.Set("Content-Type", "application/json")

		w = httptest.NewRecorder()
		ts.API.handler.ServeHTTP(w, req)

		assert.Equal(ts.T(), http.StatusBadRequest, w.Code)
	}

}
