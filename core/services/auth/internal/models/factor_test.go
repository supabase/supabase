package models

import (
	"encoding/json"
	"fmt"
	"testing"

	"github.com/gofrs/uuid"
	"github.com/stretchr/testify/require"
	"github.com/stretchr/testify/suite"

	"github.com/supabase/auth/internal/conf/confload"
	"github.com/supabase/auth/internal/storage"
	"github.com/supabase/auth/internal/storage/test"
)

type FactorTestSuite struct {
	suite.Suite
	db         *storage.Connection
	TestFactor *Factor
}

func TestFactor(t *testing.T) {
	globalConfig, err := confload.LoadGlobal(modelsTestConfig)
	require.NoError(t, err)
	conn, err := test.SetupDBConnection(globalConfig)
	require.NoError(t, err)
	ts := &FactorTestSuite{
		db: conn,
	}
	defer ts.db.Close()
	suite.Run(t, ts)
}

// TestAMRMethodForFactorType pins the factor-type -> AMR method mapping.
func TestAMRMethodForFactorType(t *testing.T) {
	for factorType, want := range map[string]AuthenticationMethod{
		TOTP:         TOTPSignIn,
		Phone:        MFAPhone,
		WebAuthn:     MFAWebAuthn,
		RecoveryCode: MFARecoveryCode,
	} {
		got, err := amrMethodForFactorType(factorType)
		require.NoError(t, err, "factor type %q must map", factorType)
		require.Equal(t, want.String(), got)
	}

	_, err := amrMethodForFactorType("not-a-real-factor-type")
	require.Error(t, err)
}

// TestAuthenticationMethodRoundTrip guards the String() <-> ParseAuthenticationMethod symmetry.
func TestAuthenticationMethodRoundTrip(t *testing.T) {
	for _, m := range []AuthenticationMethod{TOTPSignIn, MFAPhone, MFAWebAuthn, MFARecoveryCode} {
		parsed, err := ParseAuthenticationMethod(m.String())
		require.NoError(t, err, "method %q must round-trip", m.String())
		require.Equal(t, m, parsed)
	}
}

func (ts *FactorTestSuite) SetupTest() {
	TruncateAll(ts.db)
	user, err := NewUser("", "agenericemail@gmail.com", "secret", "test", nil)
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.db.Create(user))

	factor := NewTOTPFactor(user, "asimplename")
	require.NoError(ts.T(), factor.SetSecret("topsecret", false, "", ""))
	require.NoError(ts.T(), ts.db.Create(factor))
	ts.TestFactor = factor
}

func (ts *FactorTestSuite) TestFindFactorByFactorID() {
	n, err := FindFactorByFactorID(ts.db, ts.TestFactor.ID)
	require.NoError(ts.T(), err)
	require.Equal(ts.T(), ts.TestFactor.ID, n.ID)

	_, err = FindFactorByFactorID(ts.db, uuid.Nil)
	require.EqualError(ts.T(), err, FactorNotFoundError{}.Error())
}

func (ts *FactorTestSuite) TestNewRecoveryCodeFactor() {
	user, err := NewUser("", "recoveryfactor@example.com", "secret", "test", nil)
	require.NoError(ts.T(), err)

	factor := NewRecoveryCodeFactor(user, "my recovery codes")
	require.Equal(ts.T(), RecoveryCode, factor.FactorType)
	require.Equal(ts.T(), FactorStateVerified.String(), factor.Status)
	require.True(ts.T(), factor.IsVerified())
	require.Equal(ts.T(), "my recovery codes", factor.FriendlyName)
	require.True(ts.T(), factor.IsRecoveryCodeFactor())
	require.False(ts.T(), ts.TestFactor.IsRecoveryCodeFactor())

	// blank names fall back to the default
	require.Equal(ts.T(), DefaultRecoveryCodeFriendlyName, NewRecoveryCodeFactor(user, "").FriendlyName)
	require.Equal(ts.T(), DefaultRecoveryCodeFriendlyName, NewRecoveryCodeFactor(user, "   ").FriendlyName)
}

func (ts *FactorTestSuite) TestFindRecoveryCodeFactorByUser() {
	// the fixture user has only a TOTP factor
	_, err := FindRecoveryCodeFactorByUser(ts.db, ts.TestFactor.UserID)
	require.EqualError(ts.T(), err, FactorNotFoundError{}.Error())

	user, err := NewUser("", "findrecovery@example.com", "secret", "test", nil)
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.db.Create(user))

	factor := NewRecoveryCodeFactor(user, "")
	require.NoError(ts.T(), ts.db.Create(factor))

	found, err := FindRecoveryCodeFactorByUser(ts.db, user.ID)
	require.NoError(ts.T(), err)
	require.Equal(ts.T(), factor.ID, found.ID)
	require.True(ts.T(), found.IsRecoveryCodeFactor())
}

func (ts *FactorTestSuite) TestUpdateStatus() {
	newFactorStatus := FactorStateVerified
	require.NoError(ts.T(), ts.TestFactor.UpdateStatus(ts.db, newFactorStatus))
	require.Equal(ts.T(), newFactorStatus.String(), ts.TestFactor.Status)
}

func (ts *FactorTestSuite) TestUpdateFriendlyName() {
	newName := "newfactorname"
	require.NoError(ts.T(), ts.TestFactor.UpdateFriendlyName(ts.db, newName))
	require.Equal(ts.T(), newName, ts.TestFactor.FriendlyName)
}

func (ts *FactorTestSuite) TestEncodedFactorDoesNotLeakSecret() {
	encodedFactor, err := json.Marshal(ts.TestFactor)
	require.NoError(ts.T(), err)

	decodedFactor := Factor{}
	json.Unmarshal(encodedFactor, &decodedFactor)
	require.Equal(ts.T(), decodedFactor.Secret, "")
}

// TestDowngradeSessionsToAAL1RemovesAMRClaim asserts that unenrolling a verified
// factor strips the AMR claim it granted, dropping the session back to AAL1.
func (ts *FactorTestSuite) TestDowngradeSessionsToAAL1RemovesAMRClaim() {
	cases := []struct {
		desc       string
		newFactor  func(u *User) *Factor
		authMethod AuthenticationMethod
	}{
		{
			desc:       "phone",
			newFactor:  func(u *User) *Factor { return NewPhoneFactor(u, "+15555555555", "") },
			authMethod: MFAPhone,
		},
		{
			desc:       "webauthn",
			newFactor:  func(u *User) *Factor { return NewWebAuthnFactor(u, "webauthnfactor") },
			authMethod: MFAWebAuthn,
		},
		{
			desc:       "totp",
			newFactor:  func(u *User) *Factor { return NewTOTPFactor(u, "totpfactor") },
			authMethod: TOTPSignIn,
		},
		{
			desc:       "recovery_code",
			newFactor:  func(u *User) *Factor { return NewRecoveryCodeFactor(u, "") },
			authMethod: MFARecoveryCode,
		},
	}

	for i, c := range cases {
		ts.Run(c.desc, func() {
			user, err := NewUser("", fmt.Sprintf("downgrade-%d@example.com", i), "secret", "test", nil)
			require.NoError(ts.T(), err)
			require.NoError(ts.T(), ts.db.Create(user))

			factor := c.newFactor(user)
			require.NoError(ts.T(), factor.SetSecret("secretkey", false, "", ""))
			require.NoError(ts.T(), ts.db.Create(factor))
			require.NoError(ts.T(), factor.UpdateStatus(ts.db, FactorStateVerified))

			session, err := NewSession(user.ID, &factor.ID)
			require.NoError(ts.T(), err)
			require.NoError(ts.T(), ts.db.Create(session))
			require.NoError(ts.T(), AddClaimToSession(ts.db, session.ID, c.authMethod))
			require.NoError(ts.T(), session.UpdateAALAndAssociatedFactor(ts.db, AAL2, &factor.ID))

			// the claim upgrades the session to AAL2.
			loaded, err := FindSessionByID(ts.db, session.ID, false)
			require.NoError(ts.T(), err)
			aal, _, err := loaded.CalculateAALAndAMR(user)
			require.NoError(ts.T(), err)
			require.Equal(ts.T(), AAL2, aal)

			require.NoError(ts.T(), factor.DowngradeSessionsToAAL1(ts.db))

			downgraded, err := FindSessionByID(ts.db, session.ID, false)
			require.NoError(ts.T(), err)
			require.Equal(ts.T(), AAL1.String(), downgraded.GetAAL())
			require.Nil(ts.T(), downgraded.FactorID)

			aal, _, err = downgraded.CalculateAALAndAMR(user)
			require.NoError(ts.T(), err)
			require.Equal(ts.T(), AAL1, aal)
			for _, claim := range downgraded.AMRClaims {
				require.NotEqual(ts.T(), c.authMethod.String(), claim.GetAuthenticationMethod())
			}
		})
	}
}
