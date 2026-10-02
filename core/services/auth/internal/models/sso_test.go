package models

import (
	"net/url"
	"slices"
	"testing"

	"github.com/gofrs/uuid"
	"github.com/stretchr/testify/require"
	"github.com/stretchr/testify/suite"
	"github.com/supabase/auth/internal/conf/confload"
	"github.com/supabase/auth/internal/storage"
	"github.com/supabase/auth/internal/storage/test"
)

type SSOTestSuite struct {
	suite.Suite

	db *storage.Connection
}

func (ts *SSOTestSuite) SetupTest() {
	TruncateAll(ts.db)
}

func TestSSO(t *testing.T) {
	globalConfig, err := confload.LoadGlobal(modelsTestConfig)
	require.NoError(t, err)

	conn, err := test.SetupDBConnection(globalConfig)
	require.NoError(t, err)

	ts := &SSOTestSuite{
		db: conn,
	}
	defer ts.db.Close()

	suite.Run(t, ts)
}

func (ts *SSOTestSuite) TestConstraints() {
	type exampleSpec struct {
		Provider *SSOProvider
	}

	examples := []exampleSpec{
		{
			Provider: &SSOProvider{
				SAMLProvider: SAMLProvider{
					EntityID:    "",
					MetadataXML: "<example />",
				},
			},
		},
		{
			Provider: &SSOProvider{
				SAMLProvider: SAMLProvider{
					EntityID:    "https://example.com/saml/metadata",
					MetadataXML: "",
				},
			},
		},
		{
			Provider: &SSOProvider{
				SAMLProvider: SAMLProvider{
					EntityID:    "https://example.com/saml/metadata",
					MetadataXML: "<example />",
				},
				SSODomains: []SSODomain{
					{
						Domain: "",
					},
				},
			},
		},
	}

	for i, example := range examples {
		require.Error(ts.T(), ts.db.Eager().Create(example.Provider), "Example %d should have failed with error", i)
	}
}

func (ts *SSOTestSuite) TestDomainUniqueness() {
	require.NoError(ts.T(), ts.db.Eager().Create(&SSOProvider{
		SAMLProvider: SAMLProvider{
			EntityID:    "https://example.com/saml/metadata1",
			MetadataXML: "<example />",
		},
		SSODomains: []SSODomain{
			{
				Domain: "example.com",
			},
		},
	}))

	require.Error(ts.T(), ts.db.Eager().Create(&SSOProvider{
		SAMLProvider: SAMLProvider{
			EntityID:    "https://example.com/saml/metadata2",
			MetadataXML: "<example />",
		},
		SSODomains: []SSODomain{
			{
				Domain: "example.com",
			},
		},
	}))
}

func (ts *SSOTestSuite) TestEntityIDUniqueness() {
	require.NoError(ts.T(), ts.db.Eager().Create(&SSOProvider{
		SAMLProvider: SAMLProvider{
			EntityID:    "https://example.com/saml/metadata",
			MetadataXML: "<example />",
		},
		SSODomains: []SSODomain{
			{
				Domain: "example.com",
			},
		},
	}))

	require.Error(ts.T(), ts.db.Eager().Create(&SSOProvider{
		SAMLProvider: SAMLProvider{
			EntityID:    "https://example.com/saml/metadata",
			MetadataXML: "<example />",
		},
		SSODomains: []SSODomain{
			{
				Domain: "example.net",
			},
		},
	}))
}

func (ts *SSOTestSuite) TestFindSSOProviderForEmailAddress() {
	provider := &SSOProvider{
		SAMLProvider: SAMLProvider{
			EntityID:    "https://example.com/saml/metadata",
			MetadataXML: "<example />",
		},
		SSODomains: []SSODomain{
			{
				Domain: "example.com",
			},
			{
				Domain: "example.org",
			},
		},
	}

	require.NoError(ts.T(), ts.db.Eager().Create(provider), "provider creation failed")

	type exampleSpec struct {
		Address  string
		Provider *SSOProvider
	}

	examples := []exampleSpec{
		{
			Address:  "someone@example.com",
			Provider: provider,
		},
		{
			Address:  "someone@example.org",
			Provider: provider,
		},
		{
			Address:  "someone@example.net",
			Provider: nil,
		},
	}

	for i, example := range examples {
		rp, err := FindSSOProviderForEmailAddress(ts.db, example.Address)

		if nil == example.Provider {
			require.Nil(ts.T(), rp)
			require.True(ts.T(), IsNotFoundError(err), "Example %d failed with error %w", i, err)
		} else {
			require.Nil(ts.T(), err, "Example %d failed with error %w", i, err)
			require.Equal(ts.T(), rp.ID, example.Provider.ID)
		}
	}
}

func (ts *SSOTestSuite) TestFindSAMLProviderByEntityID() {
	provider := &SSOProvider{
		SAMLProvider: SAMLProvider{
			EntityID:    "https://example.com/saml/metadata",
			MetadataXML: "<example />",
		},
		SSODomains: []SSODomain{
			{
				Domain: "example.com",
			},
			{
				Domain: "example.org",
			},
		},
	}

	require.NoError(ts.T(), ts.db.Eager().Create(provider))

	type exampleSpec struct {
		EntityID string
		Provider *SSOProvider
	}

	examples := []exampleSpec{
		{
			EntityID: "https://example.com/saml/metadata",
			Provider: provider,
		},
		{
			EntityID: "https://example.com/saml/metadata/",
			Provider: nil,
		},
		{
			EntityID: "",
			Provider: nil,
		},
	}

	for i, example := range examples {
		rp, err := FindSAMLProviderByEntityID(ts.db, example.EntityID)

		if nil == example.Provider {
			require.True(ts.T(), IsNotFoundError(err), "Example %d failed with error", i)
			require.Nil(ts.T(), rp)
		} else {
			require.Nil(ts.T(), err, "Example %d failed with error %w", i, err)
			require.Equal(ts.T(), rp.ID, example.Provider.ID)
		}
	}
}

func (ts *SSOTestSuite) TestFindSSOProviderByResourceID() {
	const (
		g1Prefix = "group_one:"
		g1Test   = g1Prefix + "test"
		g1Live   = g1Prefix + "live"

		g2Prefix = "group_two:"
		g2Test   = g2Prefix + "test"
		g2Live   = g2Prefix + "live"
	)

	genStr := func() string {
		return uuid.Must(uuid.NewV4()).String()
	}

	genProvider := func(resourceID string) *SSOProvider {
		str := genStr()
		pr := &SSOProvider{
			SAMLProvider: SAMLProvider{
				EntityID:    "https://example.com/saml/metadata/" + str,
				MetadataXML: "<example />",
			},
			SSODomains: []SSODomain{
				{
					Domain: str + ".local",
				},
			},
		}
		if resourceID != "" {
			pr.ResourceID = &resourceID
		}
		return pr
	}

	var (
		ssoProviderG1Test        = genProvider(g1Test)
		ssoProviderG1Live        = genProvider(g1Live)
		ssoProviderG2Test        = genProvider(g2Test)
		ssoProviderG2Live        = genProvider(g2Live)
		ssoProviderNoResourceID1 = genProvider("")
		ssoProviderNoResourceID2 = genProvider("")
	)

	noProviders := []*SSOProvider{
		ssoProviderNoResourceID1,
		ssoProviderNoResourceID2,
	}
	g1Providers := []*SSOProvider{
		ssoProviderG1Test,
		ssoProviderG1Live,
	}
	g2Providers := []*SSOProvider{
		ssoProviderG2Test,
		ssoProviderG2Live,
	}
	gProviders := slices.Concat(g1Providers, g2Providers)
	allProviders := slices.Concat(g1Providers, g2Providers, noProviders)

	defer func() {
		for _, pr := range allProviders {
			ts.db.Eager().Destroy(pr)
		}
	}()

	for i := range allProviders {
		pr := allProviders[i]
		require.NoError(ts.T(), ts.db.Eager().Create(pr))
		ts.db.Eager().Q().Where("id = ?", pr.ID).First(pr)
	}

	type testsSpec struct {
		query url.Values
		exp   []*SSOProvider
	}

	tests := []testsSpec{

		// no filters
		{
			query: nil,
			exp:   allProviders,
		},

		// resource_id
		{
			query: url.Values{"resource_id": []string{g1Prefix}},
			exp:   nil,
		},
		{
			query: url.Values{"resource_id": []string{g1Test}},
			exp:   []*SSOProvider{ssoProviderG1Test},
		},
		{
			query: url.Values{"resource_id": []string{g1Live}},
			exp:   []*SSOProvider{ssoProviderG1Live},
		},
		{
			query: url.Values{"resource_id": []string{g2Test}},
			exp:   []*SSOProvider{ssoProviderG2Test},
		},
		{
			query: url.Values{"resource_id": []string{g2Live}},
			exp:   []*SSOProvider{ssoProviderG2Live},
		},

		// resource_id - negative
		{
			query: url.Values{"resource_id": []string{g1Test[:len(g1Test)-1]}},
			exp:   nil,
		},

		// resource_id_prefix
		{
			query: url.Values{"resource_id_prefix": []string{g1Prefix}},
			exp:   g1Providers,
		},
		{
			query: url.Values{"resource_id_prefix": []string{g2Prefix}},
			exp:   g2Providers,
		},

		// resource_id_prefix - partial
		{
			query: url.Values{"resource_id_prefix": []string{"group"}},
			exp:   gProviders,
		},
		{
			query: url.Values{"resource_id_prefix": []string{"group_one:"}},
			exp:   g1Providers,
		},
		{
			query: url.Values{"resource_id_prefix": []string{"group_two:"}},
			exp:   g2Providers,
		},
		{
			query: url.Values{"resource_id_prefix": []string{g1Test[:len(g1Test)-2]}},
			exp:   []*SSOProvider{ssoProviderG1Test},
		},
		{
			query: url.Values{"resource_id_prefix": []string{g1Live[:len(g1Live)-2]}},
			exp:   []*SSOProvider{ssoProviderG1Live},
		},

		// resource_id_prefix - exact matches
		{
			query: url.Values{"resource_id_prefix": []string{g1Test}},
			exp:   []*SSOProvider{ssoProviderG1Test},
		},
		{
			query: url.Values{"resource_id_prefix": []string{g1Live}},
			exp:   []*SSOProvider{ssoProviderG1Live},
		},
		{
			query: url.Values{"resource_id_prefix": []string{g2Test}},
			exp:   []*SSOProvider{ssoProviderG2Test},
		},
		{
			query: url.Values{"resource_id_prefix": []string{g2Live}},
			exp:   []*SSOProvider{ssoProviderG2Live},
		},

		{
			query: url.Values{"resource_id_prefix": []string{"invalid:"}},
			exp:   nil,
		},
		{
			query: url.Values{"resource_id_prefix": []string{"invalid:"}},
			exp:   nil,
		},
	}

	getIDs := func(providers []*SSOProvider) []uuid.UUID {
		ids := make([]uuid.UUID, len(providers))
		for i, p := range providers {
			ids[i] = p.ID
		}
		return ids
	}

	check := func(t *testing.T, exp, got []*SSOProvider) {
		t.Helper()
		require.ElementsMatch(t, getIDs(exp), getIDs(got))
	}

	for _, test := range tests {
		ts.Run("FindAllSSOProvidersByFilter/query='"+test.query.Encode()+"'", func() {
			prs, err := FindAllSSOProvidersByFilter(ts.db, test.query)
			require.NoError(ts.T(), err)
			require.NotNil(ts.T(), prs)
			check(ts.T(), test.exp, prs)
		})
	}

	for _, exp := range allProviders {

		{
			got, err := FindSSOProviderByID(ts.db, exp.ID)
			require.NoError(ts.T(), err)
			require.NotNil(ts.T(), got)
			check(ts.T(), []*SSOProvider{exp}, []*SSOProvider{got})
		}

		if exp.ResourceID != nil {
			got, err := FindSSOProviderByResourceID(ts.db, *exp.ResourceID)
			require.NoError(ts.T(), err)
			require.NotNil(ts.T(), got)
			check(ts.T(), []*SSOProvider{exp}, []*SSOProvider{got})
		}

		for _, domain := range exp.SSODomains {
			got, err := FindSSOProviderByDomain(ts.db, domain.Domain)
			require.NoError(ts.T(), err)
			require.NotNil(ts.T(), got)
			check(ts.T(), []*SSOProvider{exp}, []*SSOProvider{got})
		}
	}

	{
		got, err := FindSSOProviderByResourceID(ts.db, "")
		require.Error(ts.T(), err)
		require.Nil(ts.T(), got)
	}

	{
		got, err := FindSSOProviderByID(ts.db, uuid.Nil)
		require.Error(ts.T(), err)
		require.Nil(ts.T(), got)
	}

	{
		got, err := FindSSOProviderByDomain(ts.db, "_test_invalid_")
		require.Error(ts.T(), err)
		require.Nil(ts.T(), got)
	}
}
