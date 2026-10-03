package api

import (
	tst "testing"

	"encoding/xml"

	"github.com/crewjam/saml"
	"github.com/stretchr/testify/require"
	"github.com/supabase/auth/internal/models"
)

func TestSAMLAssertionUserID(t *tst.T) {
	type spec struct {
		xml    string
		userID string
	}

	examples := []spec{
		{
			xml: `<?xml version="1.0" encoding="UTF-8"?>
<saml2:Assertion xmlns:saml2="urn:oasis:names:tc:SAML:2.0:assertion" xmlns:xsd="http://www.w3.org/2001/XMLSchema" ID="_72591c79da230cac1457d0ea0f2771ab" IssueInstant="2022-08-11T14:53:38.260Z" Version="2.0">
	<saml2:Issuer>https://example.com/saml</saml2:Issuer>
	<ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#"></ds:Signature>
	<saml2:Subject>
		<saml2:NameID xmlns:saml2="urn:oasis:names:tc:SAML:2.0:assertion" Format="urn:oasis:names:tc:SAML:2.0:nameid-format:transient" NameQualifier="https://samltest.id/saml/idp" SPNameQualifier="http://localhost:9999/saml/metadata">transient-name-id</saml2:NameID>
		<saml2:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer">
			<saml2:SubjectConfirmationData Address="127.0.0.1" NotOnOrAfter="2022-08-11T14:58:38.272Z" Recipient="http://localhost:9999/saml/acs"/>
		</saml2:SubjectConfirmation>
	</saml2:Subject>
	<saml2:Conditions NotBefore="2022-08-11T14:53:38.260Z" NotOnOrAfter="2022-08-11T14:58:38.260Z">
		<saml2:AudienceRestriction>
			<saml2:Audience>http://localhost:9999/saml/metadata</saml2:Audience>
		</saml2:AudienceRestriction>
	</saml2:Conditions>
	<saml2:AuthnStatement AuthnInstant="2022-08-11T14:53:34.809Z" SessionIndex="_a5e14df3066529ca462930030712b65a">
		<saml2:SubjectLocality Address="127.0.0.1"/>
	<saml2:AuthnContext>
		<saml2:AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport</saml2:AuthnContextClassRef>
	</saml2:AuthnContext>
	</saml2:AuthnStatement>
	<saml2:AttributeStatement>
	</saml2:AttributeStatement>
</saml2:Assertion>
`,
			userID: "",
		},
		{
			xml: `<?xml version="1.0" encoding="UTF-8"?>
<saml2:Assertion xmlns:saml2="urn:oasis:names:tc:SAML:2.0:assertion" xmlns:xsd="http://www.w3.org/2001/XMLSchema" ID="_72591c79da230cac1457d0ea0f2771ab" IssueInstant="2022-08-11T14:53:38.260Z" Version="2.0">
	<saml2:Issuer>https://example.com/saml</saml2:Issuer>
	<ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#"></ds:Signature>
	<saml2:Subject>
		<saml2:NameID xmlns:saml2="urn:oasis:names:tc:SAML:2.0:assertion" Format="urn:oasis:names:tc:SAML:2.0:nameid-format:persistent" NameQualifier="https://example.com/saml" SPNameQualifier="http://localhost:9999/saml/metadata">persistent-name-id</saml2:NameID>
		<saml2:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer">
			<saml2:SubjectConfirmationData Address="79.125.170.79" NotOnOrAfter="2022-08-11T14:58:38.272Z" Recipient="http://localhost:9999/saml/acs"/>
		</saml2:SubjectConfirmation>
	</saml2:Subject>
	<saml2:Conditions NotBefore="2022-08-11T14:53:38.260Z" NotOnOrAfter="2022-08-11T14:58:38.260Z">
		<saml2:AudienceRestriction>
			<saml2:Audience>http://localhost:9999/saml/metadata</saml2:Audience>
		</saml2:AudienceRestriction>
	</saml2:Conditions>
	<saml2:AuthnStatement AuthnInstant="2022-08-11T14:53:34.809Z" SessionIndex="_a5e14df3066529ca462930030712b65a">
		<saml2:SubjectLocality Address="127.0.0.1"/>
	<saml2:AuthnContext>
		<saml2:AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport</saml2:AuthnContextClassRef>
	</saml2:AuthnContext>
	</saml2:AuthnStatement>
	<saml2:AttributeStatement>
	</saml2:AttributeStatement>
</saml2:Assertion>
`,
			userID: "persistent-name-id",
		},
		{
			xml: `<?xml version="1.0" encoding="UTF-8"?>
<saml2:Assertion xmlns:saml2="urn:oasis:names:tc:SAML:2.0:assertion" xmlns:xsd="http://www.w3.org/2001/XMLSchema" ID="_72591c79da230cac1457d0ea0f2771ab" IssueInstant="2022-08-11T14:53:38.260Z" Version="2.0">
	<saml2:Issuer>https://example.com/saml</saml2:Issuer>
	<ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#"></ds:Signature>
	<saml2:Subject>
		<saml2:NameID xmlns:saml2="urn:oasis:names:tc:SAML:2.0:assertion" Format="urn:oasis:names:tc:SAML:2.0:nameid-format:emailAddress" NameQualifier="https://example.com/saml" SPNameQualifier="http://localhost:9999/saml/metadata">name-id@example.com</saml2:NameID>
		<saml2:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer">
			<saml2:SubjectConfirmationData Address="79.125.170.79" NotOnOrAfter="2022-08-11T14:58:38.272Z" Recipient="http://localhost:9999/saml/acs"/>
		</saml2:SubjectConfirmation>
	</saml2:Subject>
	<saml2:Conditions NotBefore="2022-08-11T14:53:38.260Z" NotOnOrAfter="2022-08-11T14:58:38.260Z">
		<saml2:AudienceRestriction>
			<saml2:Audience>http://localhost:9999/saml/metadata</saml2:Audience>
		</saml2:AudienceRestriction>
	</saml2:Conditions>
	<saml2:AuthnStatement AuthnInstant="2022-08-11T14:53:34.809Z" SessionIndex="_a5e14df3066529ca462930030712b65a">
		<saml2:SubjectLocality Address="127.0.0.1"/>
	<saml2:AuthnContext>
		<saml2:AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport</saml2:AuthnContextClassRef>
	</saml2:AuthnContext>
	</saml2:AuthnStatement>
	<saml2:AttributeStatement>
	</saml2:AttributeStatement>
</saml2:Assertion>
`,
			userID: "name-id@example.com",
		},
		{
			xml: `<?xml version="1.0" encoding="UTF-8"?>
<saml2:Assertion xmlns:saml2="urn:oasis:names:tc:SAML:2.0:assertion" xmlns:xsd="http://www.w3.org/2001/XMLSchema" ID="_72591c79da230cac1457d0ea0f2771ab" IssueInstant="2022-08-11T14:53:38.260Z" Version="2.0">
	<saml2:Issuer>https://example.com/saml</saml2:Issuer>
	<ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#"></ds:Signature>
	<saml2:Subject>
		<saml2:NameID xmlns:saml2="urn:oasis:names:tc:SAML:2.0:assertion" Format="urn:oasis:names:tc:SAML:2.0:nameid-format:emailAddress" NameQualifier="https://example.com/saml" SPNameQualifier="http://localhost:9999/saml/metadata">name-id@example.com</saml2:NameID>
		<saml2:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer">
			<saml2:SubjectConfirmationData Address="79.125.170.79" NotOnOrAfter="2022-08-11T14:58:38.272Z" Recipient="http://localhost:9999/saml/acs"/>
		</saml2:SubjectConfirmation>
	</saml2:Subject>
	<saml2:Conditions NotBefore="2022-08-11T14:53:38.260Z" NotOnOrAfter="2022-08-11T14:58:38.260Z">
		<saml2:AudienceRestriction>
			<saml2:Audience>http://localhost:9999/saml/metadata</saml2:Audience>
		</saml2:AudienceRestriction>
	</saml2:Conditions>
	<saml2:AuthnStatement AuthnInstant="2022-08-11T14:53:34.809Z" SessionIndex="_a5e14df3066529ca462930030712b65a">
		<saml2:SubjectLocality Address="127.0.0.1"/>
	<saml2:AuthnContext>
		<saml2:AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport</saml2:AuthnContextClassRef>
	</saml2:AuthnContext>
	</saml2:AuthnStatement>
	<saml2:AttributeStatement>
		<saml2:Attribute Name="urn:oasis:names:tc:SAML:attribute:subject-id" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:uri">
			<saml2:AttributeValue xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="xsd:string">subject-id</saml2:AttributeValue>
		</saml2:Attribute>
	</saml2:AttributeStatement>
</saml2:Assertion>
`,
			userID: "subject-id",
		},
	}

	for i, example := range examples {
		rawAssertion := saml.Assertion{}
		require.NoError(t, xml.Unmarshal([]byte(example.xml), &rawAssertion))

		assertion := SAMLAssertion{
			&rawAssertion,
		}

		userID := assertion.UserID()

		require.Equal(t, userID, example.userID, "example %d had different user ID", i)
	}
}

func TestSAMLAssertionProcessing(t *tst.T) {
	type spec struct {
		desc     string
		xml      string
		mapping  models.SAMLAttributeMapping
		expected map[string]interface{}
	}

	examples := []spec{
		{
			desc: "valid attribute and mapping",
			xml: `<?xml version="1.0" encoding="UTF-8"?>
		<saml2:Assertion xmlns:saml2="urn:oasis:names:tc:SAML:2.0:assertion" xmlns:xsd="http://www.w3.org/2001/XMLSchema" ID="_72591c79da230cac1457d0ea0f2771ab" IssueInstant="2022-08-11T14:53:38.260Z" Version="2.0">
			<saml2:AttributeStatement>
				<saml2:Attribute Name="urn:oid:0.9.2342.19200300.100.1.3" FriendlyName="mail" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:uri">
					<saml2:AttributeValue xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="xsd:string">someone@example.com</saml2:AttributeValue>
				</saml2:Attribute>
			</saml2:AttributeStatement>
		</saml2:Assertion>
		`,
			mapping: models.SAMLAttributeMapping{
				Keys: map[string]models.SAMLAttribute{
					"email": {
						Name: "mail",
					},
				},
			},
			expected: map[string]interface{}{
				"email": "someone@example.com",
			},
		},
		{
			desc: "valid attributes, use first attribute found in Names",
			xml: `<?xml version="1.0" encoding="UTF-8"?>
		<saml2:Assertion xmlns:saml2="urn:oasis:names:tc:SAML:2.0:assertion" xmlns:xsd="http://www.w3.org/2001/XMLSchema" ID="_72591c79da230cac1457d0ea0f2771ab" IssueInstant="2022-08-11T14:53:38.260Z" Version="2.0">
			<saml2:AttributeStatement>
				<saml2:Attribute Name="http://schemas.xmlsoap.org/claims/EmailAddress" FriendlyName="mail" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:uri">
					<saml2:AttributeValue xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="xsd:string">old-soap@example.com</saml2:AttributeValue>
				</saml2:Attribute>
				<saml2:Attribute Name="http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress" FriendlyName="mail" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:uri">
					<saml2:AttributeValue xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="xsd:string">soap@example.com</saml2:AttributeValue>
				</saml2:Attribute>
			</saml2:AttributeStatement>
		</saml2:Assertion>
		`,
			mapping: models.SAMLAttributeMapping{
				Keys: map[string]models.SAMLAttribute{
					"email": {
						Names: []string{
							"http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
							"http://schemas.xmlsoap.org/claims/EmailAddress",
						},
					},
				},
			},
			expected: map[string]interface{}{
				"email": "soap@example.com",
			},
		},
		{
			desc: "valid groups attribute",
			xml: `<?xml version="1.0" encoding="UTF-8"?>
		<saml2:Assertion xmlns:saml2="urn:oasis:names:tc:SAML:2.0:assertion" xmlns:xsd="http://www.w3.org/2001/XMLSchema" ID="_72591c79da230cac1457d0ea0f2771ab" IssueInstant="2022-08-11T14:53:38.260Z" Version="2.0">
			<saml2:AttributeStatement>
				<saml2:Attribute Name="http://whatever.com/groups" FriendlyName="groups" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:string">
					<saml2:AttributeValue xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="xsd:string">group1</saml2:AttributeValue>
					<saml2:AttributeValue xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="xsd:string">group2</saml2:AttributeValue>
				</saml2:Attribute>
				<saml2:Attribute Name="http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress" FriendlyName="mail" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:uri">
					<saml2:AttributeValue xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="xsd:string">soap@example.com</saml2:AttributeValue>
				</saml2:Attribute>
			</saml2:AttributeStatement>
		</saml2:Assertion>
		`,
			mapping: models.SAMLAttributeMapping{
				Keys: map[string]models.SAMLAttribute{
					"email": {
						Names: []string{
							"http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
							"http://schemas.xmlsoap.org/claims/EmailAddress",
						},
					},
					"groups": {
						Name:  "groups",
						Array: true,
					},
				},
			},
			expected: map[string]interface{}{
				"email": "soap@example.com",
				"groups": []string{
					"group1",
					"group2",
				},
			},
		},
		{
			desc: "missing attribute use default value",
			xml: `<?xml version="1.0" encoding="UTF-8"?>
<saml2:Assertion xmlns:saml2="urn:oasis:names:tc:SAML:2.0:assertion" xmlns:xsd="http://www.w3.org/2001/XMLSchema" ID="_72591c79da230cac1457d0ea0f2771ab" IssueInstant="2022-08-11T14:53:38.260Z" Version="2.0">
	<saml2:AttributeStatement>
		<saml2:Attribute Name="email" FriendlyName="" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic">
			<saml2:AttributeValue xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="xsd:string">someone@example.com</saml2:AttributeValue>
		</saml2:Attribute>
	</saml2:AttributeStatement>
</saml2:Assertion>
`,
			mapping: models.SAMLAttributeMapping{
				Keys: map[string]models.SAMLAttribute{
					"email": {
						Name: "email",
					},
					"role": {
						Default: "member",
					},
				},
			},
			expected: map[string]interface{}{
				"email": "someone@example.com",
				"role":  "member",
			},
		},
		{
			desc: "use default value even if attribute exists but is not specified in mapping",
			xml: `<?xml version="1.0" encoding="UTF-8"?>
		<saml2:Assertion xmlns:saml2="urn:oasis:names:tc:SAML:2.0:assertion" xmlns:xsd="http://www.w3.org/2001/XMLSchema" ID="_72591c79da230cac1457d0ea0f2771ab" IssueInstant="2022-08-11T14:53:38.260Z" Version="2.0">
			<saml2:AttributeStatement>
				<saml2:Attribute Name="urn:oid:0.9.2342.19200300.100.1.3" FriendlyName="mail" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:uri">
					<saml2:AttributeValue xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="xsd:string">someone@example.com</saml2:AttributeValue>
				</saml2:Attribute>
				<saml2:Attribute Name="urn:oid:0.9.2342.19200300.100.1.3" FriendlyName="role" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:uri">
					<saml2:AttributeValue xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="xsd:string">admin</saml2:AttributeValue>
				</saml2:Attribute>
			</saml2:AttributeStatement>
		</saml2:Assertion>
		`,
			mapping: models.SAMLAttributeMapping{
				Keys: map[string]models.SAMLAttribute{
					"email": {
						Name: "mail",
					},
					"role": {
						Default: "member",
					},
				},
			},
			expected: map[string]interface{}{
				"email": "someone@example.com",
				"role":  "member",
			},
		},
		{
			desc: "use value in XML when attribute exists and is specified in mapping",
			xml: `<?xml version="1.0" encoding="UTF-8"?>
		<saml2:Assertion xmlns:saml2="urn:oasis:names:tc:SAML:2.0:assertion" xmlns:xsd="http://www.w3.org/2001/XMLSchema" ID="_72591c79da230cac1457d0ea0f2771ab" IssueInstant="2022-08-11T14:53:38.260Z" Version="2.0">
			<saml2:AttributeStatement>
				<saml2:Attribute Name="urn:oid:0.9.2342.19200300.100.1.3" FriendlyName="mail" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:uri">
					<saml2:AttributeValue xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="xsd:string">someone@example.com</saml2:AttributeValue>
				</saml2:Attribute>
				<saml2:Attribute Name="urn:oid:0.9.2342.19200300.100.1.3" FriendlyName="role" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:uri">
					<saml2:AttributeValue xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="xsd:string">admin</saml2:AttributeValue>
				</saml2:Attribute>
			</saml2:AttributeStatement>
		</saml2:Assertion>
		`,
			mapping: models.SAMLAttributeMapping{
				Keys: map[string]models.SAMLAttribute{
					"email": {
						Name: "mail",
					},
					"role": {
						Name:    "role",
						Default: "member",
					},
				},
			},
			expected: map[string]interface{}{
				"email": "someone@example.com",
				"role":  "admin",
			},
		},
	}

	for i, example := range examples {
		t.Run(example.desc, func(t *tst.T) {
			rawAssertion := saml.Assertion{}
			require.NoError(t, xml.Unmarshal([]byte(example.xml), &rawAssertion))

			assertion := SAMLAssertion{
				&rawAssertion,
			}

			result := assertion.Process(example.mapping)
			require.Equal(t, example.expected, result, "example %d had different processing", i)
		})
	}
}
