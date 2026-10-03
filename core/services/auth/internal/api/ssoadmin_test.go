package api_test

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"testing"
	"time"

	"github.com/crewjam/saml"
	"github.com/stretchr/testify/require"
	"github.com/supabase/auth/internal/api"
	"github.com/supabase/auth/internal/api/apierrors"
	"github.com/supabase/auth/internal/e2e"
	"github.com/supabase/auth/internal/e2e/e2eapi"
	"github.com/supabase/auth/internal/models"
)

const testMetadataXMLTemplate = `<?xml version="1.0" encoding="UTF-8"?><md:EntityDescriptor entityID="http://%[1]s.local/entityid" xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata"><md:IDPSSODescriptor WantAuthnRequestsSigned="false" protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol"><md:KeyDescriptor use="signing"><ds:KeyInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#"><ds:X509Data><ds:X509Certificate>MIIDqjCCApKgAwIBAgIGAZfq8svbMA0GCSqGSIb3DQEBCwUAMIGVMQswCQYDVQQGEwJVUzETMBEG
A1UECAwKQ2FsaWZvcm5pYTEWMBQGA1UEBwwNU2FuIEZyYW5jaXNjbzENMAsGA1UECgwET2t0YTEU
MBIGA1UECwwLU1NPUHJvdmlkZXIxFjAUBgNVBAMMDXRyaWFsLTgxNzg2MTQxHDAaBgkqhkiG9w0B
CQEWDWluZm9Ab2t0YS5jb20wHhcNMjUwNzA4MTY1MDA5WhcNMzUwNzA4MTY1MTA5WjCBlTELMAkG
A1UEBhMCVVMxEzARBgNVBAgMCkNhbGlmb3JuaWExFjAUBgNVBAcMDVNhbiBGcmFuY2lzY28xDTAL
BgNVBAoMBE9rdGExFDASBgNVBAsMC1NTT1Byb3ZpZGVyMRYwFAYDVQQDDA10cmlhbC04MTc4NjE0
MRwwGgYJKoZIhvcNAQkBFg1pbmZvQG9rdGEuY29tMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIB
CgKCAQEAviGBsGh17McdQQPdTkI5Stw9wh3SdTpqXQ2C7Us8GMXKmV5/07Gh1tgNKeQDACgdox9v
nhXyNBjAW5ANITAQAsDwD8k9unZhksEGe5A/v4/Reas8gtYXMj2iVO1TaaM3ZIGamCbMtDybsX+a
6HCcnWv0LcGXuQLqNApWcKdZ9mNiAMAf3ATucwced8Yl950FsXobEf6bVFiOpIoL5tE4AjOfgfrK
Vm+p9PxuQh4vl4j8Iw9UkCyiLOwcJyo5XikfM7BeYsoU9WVV85/pXuI6vWMk4zsOfVjsLRhsEI7K
jbjkIxClLB43V+YOa+IN03Zmsxulp4Tm7AEvw3rlDIUpcQIDAQABMA0GCSqGSIb3DQEBCwUAA4IB
AQAPpGUfNkFzDP2Xzzd8Y+MoWZshbZYLANWcNNIyb5ajqX7CU/vJmOniYpZVp0f7n3Yu6DV28KiL
AvB46YNtsAtuUtEendEiIO5vcef5o0I4pKUz9RVT1WZIycCHbW9/qhPHpuRVVgpJcp2hleq7eisl
TYE5YIIH7ovMWAc0RuC3YqNttdq8ampcTxDer9VSVsFFXK/TqxcB7rwgCv6Q9jqf/7dsVKKFyIuS
NvmYIdjXXfEV0OsftSN/+s+UqtDEqEXR0Bmd51k0OJUm+2iNyu8Nh5Sr2M2475Gk2PSdPbzYdEoi
nfcdcTq+SxjLzHdQyv2U8TiLwZhRNXcrY8kCqgby</ds:X509Certificate></ds:X509Data></ds:KeyInfo></md:KeyDescriptor><md:NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</md:NameIDFormat><md:SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="https://%[1]s/sso/saml"/><md:SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="https://%[1]s/sso/saml"/></md:IDPSSODescriptor></md:EntityDescriptor>`

func TestE2EAdmin(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
	defer cancel()

	t.Run("Admin", func(t *testing.T) {
		globalCfg := e2e.Must(e2e.Config())

		inst, err := e2eapi.New(globalCfg)
		require.NoError(t, err)
		defer inst.Close()

		t.Run("SSO", func(t *testing.T) {
			getTestMetadata := func(label string) string {
				return fmt.Sprintf(testMetadataXMLTemplate, label)
			}
			getTestAttributes := func() map[string]models.SAMLAttribute {
				return map[string]models.SAMLAttribute{
					"TestE2EAdmin": {
						Default: true,
					},
					"customAttr": {
						Default: "somevalue",
					},
					"email": {
						Name: "user.email",
					},
					"first_name": {
						Name: "user.firstName",
					},
					"last_name": {
						Name: "user.lastName",
					},
					"user_name": {
						Name: "user.login",
					},
				}
			}

			checkAPIError := func(t *testing.T, b []byte) {
				apiError := new(apierrors.HTTPError)
				if err := json.Unmarshal(b, &apiError); err != nil {
					return
				}

				if apiError.Message != "" {
					require.NoError(t, apiError)
				}
			}

			checkHTTPRes := func(t *testing.T, httpRes *http.Response, exp any) {
				require.GreaterOrEqual(t, httpRes.StatusCode, 200)
				require.LessOrEqual(t, httpRes.StatusCode, 201)

				body, err := io.ReadAll(httpRes.Body)
				require.NoError(t, err)

				checkAPIError(t, body)

				rdr := bytes.NewReader(body)
				err = json.NewDecoder(rdr).Decode(exp)
				require.NoError(t, err)
			}

			// basic check
			checkProvider := func(t *testing.T, pr *models.SSOProvider) {
				const zeroID = "00000000-0000-0000-0000-000000000000"
				require.NotNil(t, pr)
				require.NotNil(t, pr.ID)
				require.NotEqual(t, pr.ID.String(), zeroID)

				require.True(t, len(pr.ID.String()) > 0)
				require.NotNil(t,
					pr.SAMLProvider.NameIDFormat)
				require.Equal(t,
					*pr.SAMLProvider.NameIDFormat,
					string(saml.EmailAddressNameIDFormat))

				require.True(t, len(pr.SSODomains) > 0)
				for _, domain := range pr.SSODomains {
					require.NotEmpty(t, domain.Domain)
				}

				require.True(t, len(pr.SSODomains) > 0)
				require.LessOrEqual(t, pr.CreatedAt, pr.UpdatedAt)
			}

			checkProviderMap := func(t *testing.T, m map[string]*models.SSOProvider) {
				for k, v := range m {
					require.Equal(t, k, v.ID.String())
					checkProvider(t, v)
				}
			}

			equalProviderParams := func(t *testing.T,
				params *api.CreateSSOProviderParams,
				pr *models.SSOProvider,
			) {
				checkProvider(t, pr)

				require.NotNil(t, params)

				if params.ResourceID != nil {
					require.NotNil(t, pr.ResourceID)
					require.Equal(t, *params.ResourceID, *pr.ResourceID)
				}

				if len(params.Domains) > 0 {
					require.Equal(t, len(params.Domains), len(pr.SSODomains))
				}

				if params.NameIDFormat != "" {
					require.NotNil(t, pr.SAMLProvider.NameIDFormat)
					require.Equal(t,
						*pr.SAMLProvider.NameIDFormat,
						params.NameIDFormat)
				}

				if len(params.Domains) > 0 {
					require.Equal(t, len(params.Domains), len(pr.SSODomains))
					for _, domain := range params.Domains {
						var ok bool
						for _, v := range pr.SSODomains {
							if domain == v.Domain {
								ok = true
							}
						}
						require.True(t, ok, "Could not find domain %s", domain)
					}
				}

				if len(params.AttributeMapping.Keys) > 0 {
					require.True(t,
						params.AttributeMapping.Equal(
							&pr.SAMLProvider.AttributeMapping))
				}
			}

			equalProvider := func(t *testing.T, a, b *models.SSOProvider) {
				checkProvider(t, a)
				checkProvider(t, b)

				require.Equal(t, a.ID, b.ID)
				require.Equal(t,
					a.ResourceID,
					b.ResourceID)

				require.Equal(t, a.SSODomains, b.SSODomains)

				require.Equal(t,
					a.SAMLProvider.ID,
					b.SAMLProvider.ID)
				require.Equal(t,
					a.SAMLProvider.EntityID,
					b.SAMLProvider.EntityID)
				require.True(t,
					a.SAMLProvider.AttributeMapping.Equal(
						&b.SAMLProvider.AttributeMapping))
				require.Equal(t,
					a.SAMLProvider.NameIDFormat,
					b.SAMLProvider.NameIDFormat)
				require.Equal(t,
					a.SAMLProvider.CreatedAt,
					b.SAMLProvider.CreatedAt)
				require.Equal(t,
					a.SAMLProvider.UpdatedAt,
					b.SAMLProvider.UpdatedAt)
			}

			equalProviderMaps := func(t *testing.T, a, b map[string]*models.SSOProvider) {
				for expKey, expPr := range a {
					gotPr, ok := b[expKey]
					require.True(t, ok)
					equalProvider(t, expPr, gotPr)
				}
			}

			listToMap := func(list []*models.SSOProvider) map[string]*models.SSOProvider {
				out := make(map[string]*models.SSOProvider)
				for _, pr := range list {
					out[pr.ID.String()] = pr
				}
				return out
			}

			listProvidersWithFilter := func(
				t *testing.T,
				filter url.Values,
			) map[string]*models.SSOProvider {
				url := "/admin/sso/providers?" + filter.Encode()

				httpReq, err := http.NewRequestWithContext(
					ctx, "GET", url, nil)
				require.NoError(t, err)

				httpRes, err := inst.DoAdmin(httpReq)
				require.NoError(t, err)

				var res struct {
					Items []*models.SSOProvider `json:"items"`
				}
				checkHTTPRes(t, httpRes, &res)

				prMap := listToMap(res.Items)
				checkProviderMap(t, prMap)
				return prMap
			}

			listProviders := func(t *testing.T) map[string]*models.SSOProvider {
				prMap := listProvidersWithFilter(t, nil)
				for k, pr := range prMap {
					keys := pr.SAMLProvider.AttributeMapping.Keys
					if _, ok := keys["TestE2EAdmin"]; !ok {
						delete(prMap, k)
					}
				}
				return prMap
			}

			getProvider := func(
				t *testing.T,
				urlSegment string,
			) (res *models.SSOProvider) {
				t.Run("Get/"+urlSegment, func(t *testing.T) {
					url := "/admin/sso/" + urlSegment
					httpReq, err := http.NewRequestWithContext(
						ctx, "GET", url, nil)
					require.NoError(t, err)

					httpRes, err := inst.DoAdmin(httpReq)
					require.NoError(t, err)

					res = new(models.SSOProvider)
					checkHTTPRes(t, httpRes, res)
					checkProvider(t, res)
				})
				return
			}

			updateProvider := func(
				t *testing.T,
				urlSegment string,
				req *api.CreateSSOProviderParams,
			) (res *models.SSOProvider) {
				t.Run("Update/"+urlSegment, func(t *testing.T) {
					url := "/admin/sso/" + urlSegment
					body := new(bytes.Buffer)
					err := json.NewEncoder(body).Encode(req)
					require.NoError(t, err)

					httpReq, err := http.NewRequestWithContext(
						ctx, "PUT", url, body)
					require.NoError(t, err)

					httpRes, err := inst.DoAdmin(httpReq)
					require.NoError(t, err)

					res = new(models.SSOProvider)
					checkHTTPRes(t, httpRes, res)
					checkProvider(t, res)
					equalProviderParams(t, req, res)
				})
				return
			}

			deleteProvider := func(
				t *testing.T,
				urlSegment string,
			) (res *models.SSOProvider) {
				t.Run("Delete/"+urlSegment, func(t *testing.T) {
					url := "/admin/sso/" + urlSegment
					httpReq, err := http.NewRequestWithContext(
						ctx, "DELETE", url, nil)
					require.NoError(t, err)

					httpRes, err := inst.DoAdmin(httpReq)
					require.NoError(t, err)

					res = new(models.SSOProvider)
					checkHTTPRes(t, httpRes, res)
					checkProvider(t, res)
				})
				return
			}

			cleanProviders := func(t *testing.T, name string) {
				t.Run("Clean/"+name, func(t *testing.T) {
					prMap := listProviders(t)
					for _, pr := range prMap {
						keys := pr.SAMLProvider.AttributeMapping.Keys
						if _, ok := keys["TestE2EAdmin"]; ok {
							deleteProvider(t, "providers/"+pr.ID.String())
						}
					}
				})
			}

			// cleanup providers before & after tests
			cleanProviders(t, "Before")
			defer cleanProviders(t, "After")

			createProvider := func(
				t *testing.T,
				req *api.CreateSSOProviderParams,
			) (res *models.SSOProvider) {
				t.Run("Create", func(t *testing.T) {
					body := new(bytes.Buffer)
					err := json.NewEncoder(body).Encode(req)
					require.NoError(t, err)

					httpReq, err := http.NewRequestWithContext(
						ctx, "POST", "/admin/sso/providers", body)
					require.NoError(t, err)

					httpRes, err := inst.DoAdmin(httpReq)
					require.NoError(t, err)

					res = new(models.SSOProvider)
					checkHTTPRes(t, httpRes, res)

					checkProvider(t, res)
					equalProviderParams(t, req, res)
				})
				return
			}

			t.Run("ByProviderID", func(t *testing.T) {
				const label = "by-provider-id"

				createReq := &api.CreateSSOProviderParams{
					Type:        "saml",
					MetadataURL: "",
					MetadataXML: getTestMetadata(label),
					Domains: []string{
						label + ".local",
					},
					AttributeMapping: models.SAMLAttributeMapping{
						Keys: getTestAttributes(),
					},
					NameIDFormat: string(saml.EmailAddressNameIDFormat),
				}
				createRes := createProvider(t, createReq)
				equalProviderParams(t, createReq, createRes)

				providerSeg := "providers/" + createRes.ID.String()
				getRes := getProvider(t, providerSeg)
				equalProvider(t, createRes, getRes)

				updateReq := &api.CreateSSOProviderParams{
					Domains: []string{
						label + ".local",
						label + "-new.local",
					},
				}
				updateRes := updateProvider(t, providerSeg, updateReq)
				getRes = getProvider(t, providerSeg)
				equalProvider(t, updateRes, getRes)

				{
					currentProviderMap := map[string]*models.SSOProvider{
						getRes.ID.String(): getRes,
					}
					prMap := listProviders(t)
					equalProviderMaps(t, currentProviderMap, prMap)
				}

				{
					deleteRes := deleteProvider(t, providerSeg)
					equalProvider(t, getRes, deleteRes)

					url := "/admin/sso/" + providerSeg
					httpReq, err := http.NewRequestWithContext(
						ctx, "GET", url, nil)
					require.NoError(t, err)

					httpRes, err := inst.DoAdmin(httpReq)
					require.NoError(t, err)
					require.Equal(t, 404, httpRes.StatusCode)
				}
			})

			t.Run("ByResourceID", func(t *testing.T) {
				const label = "by-resource-id"

				currentProviderMap := make(map[string]*models.SSOProvider)
				suffixes := []string{"live", "testing"}
				for _, suffix := range suffixes {
					t.Run("WithSuffix/"+suffix, func(t *testing.T) {
						resourceID := label + ":" + suffix
						createReq := &api.CreateSSOProviderParams{
							Type:        "saml",
							ResourceID:  &resourceID,
							MetadataURL: "",
							MetadataXML: getTestMetadata(label + "-" + suffix),
							Domains: []string{
								label + "-" + suffix + ".local",
							},
							AttributeMapping: models.SAMLAttributeMapping{
								Keys: getTestAttributes(),
							},
							NameIDFormat: string(saml.EmailAddressNameIDFormat),
						}

						createRes := createProvider(t, createReq)
						equalProviderParams(t, createReq, createRes)
						require.Nil(t, createRes.Disabled)
						require.True(t, createRes.IsEnabled())

						resourceSeg := "providers/resource_" + resourceID
						getRes := getProvider(t, resourceSeg)
						equalProvider(t, createRes, getRes)
						require.Nil(t, getRes.Disabled)
						require.True(t, getRes.IsEnabled())

						t.Run("AddDomain", func(t *testing.T) {
							updateReq := &api.CreateSSOProviderParams{
								Domains: []string{
									label + "-" + suffix + ".local",
									label + "-" + suffix + "-new.local",
								},
							}
							updateRes := updateProvider(t, resourceSeg, updateReq)
							require.Nil(t, updateRes.Disabled)
							require.True(t, updateRes.IsEnabled())

							getRes = getProvider(t, resourceSeg)
							equalProvider(t, updateRes, getRes)
							require.Nil(t, getRes.Disabled)
							require.True(t, getRes.IsEnabled())

							currentProviderMap[getRes.ID.String()] = getRes
						})

						disabled := true
						t.Run("DisabledFlag/true", func(t *testing.T) {
							updateReq := &api.CreateSSOProviderParams{
								Disabled: &disabled,
							}
							updateRes := updateProvider(t, resourceSeg, updateReq)
							require.NotNil(t, updateRes.Disabled)
							require.True(t, *updateRes.Disabled)
							require.False(t, updateRes.IsEnabled())

							getRes = getProvider(t, resourceSeg)
							equalProvider(t, updateRes, getRes)
							require.NotNil(t, getRes.Disabled)
							require.True(t, *getRes.Disabled)
							require.False(t, getRes.IsEnabled())

							currentProviderMap[getRes.ID.String()] = getRes
						})

						disabled = false
						t.Run("DisabledFlag/false", func(t *testing.T) {
							updateReq := &api.CreateSSOProviderParams{
								Disabled: &disabled,
							}
							updateRes := updateProvider(t, resourceSeg, updateReq)
							require.NotNil(t, updateRes.Disabled)
							require.False(t, *updateRes.Disabled)
							require.True(t, updateRes.IsEnabled())

							getRes = getProvider(t, resourceSeg)
							equalProvider(t, updateRes, getRes)
							require.NotNil(t, getRes.Disabled)
							require.False(t, *getRes.Disabled)
							require.True(t, getRes.IsEnabled())

							currentProviderMap[getRes.ID.String()] = getRes
						})
					})
				}

				t.Run("ListByFilter", func(t *testing.T) {

					t.Run("NoFilter", func(t *testing.T) {
						prMap := listProviders(t)
						equalProviderMaps(t, currentProviderMap, prMap)
					})

					t.Run("WithResourceID", func(t *testing.T) {
						for _, pr := range currentProviderMap {
							q := make(url.Values)
							q.Add("resource_id", *pr.ResourceID)

							prMap := listProvidersWithFilter(t, q)
							require.Len(t, prMap, 1)

							got, ok := prMap[pr.ID.String()]
							require.True(t, ok)
							require.NotNil(t, got)

							equalProvider(t, pr, got)
						}
					})

					t.Run("WithResourceIDPrefix", func(t *testing.T) {
						q := make(url.Values)
						q.Add("resource_id_prefix", label+":")

						prMap := listProvidersWithFilter(t, q)
						require.Len(t, prMap, 2)

						for _, pr := range currentProviderMap {
							got, ok := prMap[pr.ID.String()]
							require.True(t, ok)
							require.NotNil(t, got)

							equalProvider(t, pr, got)
						}
					})
				})

				t.Run("Delete", func(t *testing.T) {
					for _, pr := range currentProviderMap {
						resourceSeg := "providers/resource_" + *pr.ResourceID
						deleteRes := deleteProvider(t, resourceSeg)
						equalProvider(t, pr, deleteRes)

						url := "/admin/sso/" + resourceSeg
						httpReq, err := http.NewRequestWithContext(
							ctx, "GET", url, nil)
						require.NoError(t, err)

						httpRes, err := inst.DoAdmin(httpReq)
						require.NoError(t, err)
						require.Equal(t, 404, httpRes.StatusCode)
					}
				})
			})
		})
	})
}
