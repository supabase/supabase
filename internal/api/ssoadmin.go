package api

import (
	"context"
	"io"
	"net/http"
	"net/url"
	"strings"
	"unicode/utf8"

	"github.com/crewjam/saml"
	"github.com/crewjam/saml/samlsp"
	"github.com/go-chi/chi/v5"
	"github.com/gofrs/uuid"
	"github.com/supabase/auth/internal/api/apierrors"
	"github.com/supabase/auth/internal/models"
	"github.com/supabase/auth/internal/observability"
	"github.com/supabase/auth/internal/storage"
	"github.com/supabase/auth/internal/utilities"
)

// loadSSOProvider looks for an idp_id and first checks it for a "resource_"
// prefix, if present the provider is loaded by resource_id. Otherwise the
// provider is loaded by id.
func (a *API) loadSSOProvider(w http.ResponseWriter, r *http.Request) (context.Context, error) {
	ctx := r.Context()
	db := a.db.WithContext(ctx)

	var (
		provider *models.SSOProvider
		err      error
	)

	const resourcePrefix = "resource_"
	idpParam := chi.URLParam(r, "idp_id")
	switch {
	case strings.HasPrefix(idpParam, resourcePrefix):
		resourceID := strings.TrimPrefix(idpParam, resourcePrefix)
		provider, err = models.FindSSOProviderByResourceID(db, resourceID)
	default:
		idpID, idpErr := uuid.FromString(idpParam)
		if idpErr != nil {
			return nil, apierrors.NewNotFoundError(apierrors.ErrorCodeSSOProviderNotFound, "SSO Identity Provider not found")
		}
		provider, err = models.FindSSOProviderByID(db, idpID)
	}

	if err != nil {
		if models.IsNotFoundError(err) {
			return nil, apierrors.NewNotFoundError(apierrors.ErrorCodeSSOProviderNotFound, "SSO Identity Provider not found")
		} else {
			return nil, apierrors.NewInternalServerError("Database error finding SSO Identity Provider").WithInternalError(err)
		}
	}

	observability.LogEntrySetField(r, "sso_provider_id", provider.ID.String())
	return withSSOProvider(r.Context(), provider), nil
}

// adminSSOProvidersList lists all SSO Identity Providers in the system. Does
// not deal with pagination at this time.
func (a *API) adminSSOProvidersList(w http.ResponseWriter, r *http.Request) error {
	ctx := r.Context()
	db := a.db.WithContext(ctx)

	providers, err := models.FindAllSSOProvidersByFilter(db, r.URL.Query())
	if err != nil {
		return err
	}

	for i := range providers {
		// remove metadata XML so that the returned JSON is not ginormous
		providers[i].SAMLProvider.MetadataXML = ""
	}

	return sendJSON(w, http.StatusOK, map[string]interface{}{
		"items": providers,
	})
}

type CreateSSOProviderParams struct {
	Type string `json:"type"`

	MetadataURL      string                      `json:"metadata_url"`
	MetadataXML      string                      `json:"metadata_xml"`
	Domains          []string                    `json:"domains"`
	AttributeMapping models.SAMLAttributeMapping `json:"attribute_mapping"`
	NameIDFormat     string                      `json:"name_id_format"`

	ResourceID *string `json:"resource_id,omitempty"`
	Disabled   *bool   `json:"disabled,omitempty"`
}

func (p *CreateSSOProviderParams) validate(forUpdate bool) error {
	if !forUpdate && p.Type != SAMLProvider {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "Only 'saml' supported for SSO provider type")
	} else if p.MetadataURL != "" && p.MetadataXML != "" {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "Only one of metadata_xml or metadata_url needs to be set")
	} else if !forUpdate && p.MetadataURL == "" && p.MetadataXML == "" {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "Either metadata_xml or metadata_url must be set")
	} else if p.MetadataURL != "" {
		metadataURL, err := url.ParseRequestURI(p.MetadataURL)
		if err != nil {
			return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "metadata_url is not a valid URL")
		}

		if metadataURL.Scheme != "https" {
			return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "metadata_url is not a HTTPS URL")
		}
	}

	switch p.NameIDFormat {
	case "",
		string(saml.PersistentNameIDFormat),
		string(saml.EmailAddressNameIDFormat),
		string(saml.TransientNameIDFormat),
		string(saml.UnspecifiedNameIDFormat):
		// it's valid

	default:
		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "name_id_format must be unspecified or one of %v", strings.Join([]string{
			string(saml.PersistentNameIDFormat),
			string(saml.EmailAddressNameIDFormat),
			string(saml.TransientNameIDFormat),
			string(saml.UnspecifiedNameIDFormat),
		}, ", "))
	}

	return nil
}

func (p *CreateSSOProviderParams) metadata(ctx context.Context) ([]byte, *saml.EntityDescriptor, error) {
	var rawMetadata []byte
	var err error

	if p.MetadataXML != "" {
		rawMetadata = []byte(p.MetadataXML)
	} else if p.MetadataURL != "" {
		rawMetadata, err = fetchSAMLMetadata(ctx, p.MetadataURL)
		if err != nil {
			return nil, nil, err
		}
	} else {
		// impossible situation if you called validate() prior
		return nil, nil, nil
	}

	metadata, err := parseSAMLMetadata(rawMetadata)
	if err != nil {
		return nil, nil, err
	}

	return rawMetadata, metadata, nil
}

func parseSAMLMetadata(rawMetadata []byte) (*saml.EntityDescriptor, error) {
	if !utf8.Valid(rawMetadata) {
		return nil, apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "SAML Metadata XML contains invalid UTF-8 characters, which are not supported at this time")
	}

	metadata, err := samlsp.ParseMetadata(rawMetadata)
	if err != nil {
		return nil, err
	}

	if metadata.EntityID == "" {
		return nil, apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "SAML Metadata does not contain an EntityID")
	}

	if len(metadata.IDPSSODescriptors) < 1 {
		return nil, apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "SAML Metadata does not contain any IDPSSODescriptor")
	}

	if len(metadata.IDPSSODescriptors) > 1 {
		return nil, apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "SAML Metadata contains multiple IDPSSODescriptors")
	}

	return metadata, nil
}

func fetchSAMLMetadata(ctx context.Context, url string) ([]byte, error) {
	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		return nil, apierrors.NewInternalServerError("Unable to create a request to metadata_url").WithInternalError(err)
	}

	req = req.WithContext(ctx)

	req.Header.Set("Accept", "application/xml;charset=UTF-8")
	req.Header.Set("Accept-Charset", "UTF-8")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}

	defer utilities.SafeClose(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return nil, apierrors.NewBadRequestError(apierrors.ErrorCodeSAMLMetadataFetchFailed, "HTTP %v error fetching SAML Metadata from URL '%s'", resp.StatusCode, url)
	}

	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	return data, nil
}

// adminSSOProvidersCreate creates a new SAML Identity Provider in the system.
func (a *API) adminSSOProvidersCreate(w http.ResponseWriter, r *http.Request) error {
	ctx := r.Context()
	db := a.db.WithContext(ctx)

	params := &CreateSSOProviderParams{}
	if err := retrieveRequestParams(r, params); err != nil {
		return err
	}

	if err := params.validate(false /* <- forUpdate */); err != nil {
		return err
	}

	rawMetadata, metadata, err := params.metadata(ctx)
	if err != nil {
		return err
	}

	existingProvider, err := models.FindSAMLProviderByEntityID(db, metadata.EntityID)
	if err != nil && !models.IsNotFoundError(err) {
		return err
	}
	if existingProvider != nil {
		return apierrors.NewUnprocessableEntityError(apierrors.ErrorCodeSAMLIdPAlreadyExists, "SAML Identity Provider with this EntityID (%s) already exists", metadata.EntityID)
	}

	provider := &models.SSOProvider{

		// TODO handle Name, Description, Attribute Mapping
		SAMLProvider: models.SAMLProvider{
			EntityID:    metadata.EntityID,
			MetadataXML: string(rawMetadata),
		},
	}

	if params.ResourceID != nil {
		provider.ResourceID = params.ResourceID
	}
	if params.Disabled != nil {
		provider.Disabled = params.Disabled
	}
	if params.MetadataURL != "" {
		provider.SAMLProvider.MetadataURL = &params.MetadataURL
	}
	if params.NameIDFormat != "" {
		provider.SAMLProvider.NameIDFormat = &params.NameIDFormat
	}

	provider.SAMLProvider.AttributeMapping = params.AttributeMapping

	for _, domain := range params.Domains {
		existingProvider, err := models.FindSSOProviderByDomain(db, domain)
		if err != nil && !models.IsNotFoundError(err) {
			return err
		}
		if existingProvider != nil {
			return apierrors.NewBadRequestError(apierrors.ErrorCodeSSODomainAlreadyExists, "SSO Domain '%s' is already assigned to an SSO identity provider (%s)", domain, existingProvider.ID.String())
		}

		provider.SSODomains = append(provider.SSODomains, models.SSODomain{
			Domain: domain,
		})
	}

	if err := db.Transaction(func(tx *storage.Connection) error {
		if terr := tx.Eager().Create(provider); terr != nil {
			return terr
		}

		return tx.Eager().Load(provider)
	}); err != nil {
		return err
	}

	return sendJSON(w, http.StatusCreated, provider)
}

// adminSSOProvidersGet returns an existing SAML Identity Provider in the system.
func (a *API) adminSSOProvidersGet(w http.ResponseWriter, r *http.Request) error {
	provider := getSSOProvider(r.Context())

	return sendJSON(w, http.StatusOK, provider)
}

// adminSSOProvidersUpdate updates a provider with the provided diff values.
func (a *API) adminSSOProvidersUpdate(w http.ResponseWriter, r *http.Request) error {
	ctx := r.Context()
	db := a.db.WithContext(ctx)

	params := &CreateSSOProviderParams{}
	if err := retrieveRequestParams(r, params); err != nil {
		return err
	}

	if err := params.validate(true /* <- forUpdate */); err != nil {
		return err
	}

	modified := false
	updateSAMLProvider := false

	provider := getSSOProvider(ctx)

	if params.MetadataXML != "" || params.MetadataURL != "" {
		// metadata is being updated
		rawMetadata, metadata, err := params.metadata(ctx)
		if err != nil {
			return err
		}

		if provider.SAMLProvider.EntityID != metadata.EntityID {
			return apierrors.NewBadRequestError(apierrors.ErrorCodeSAMLEntityIDMismatch, "SAML Metadata can be updated only if the EntityID matches for the provider; expected '%s' but got '%s'", provider.SAMLProvider.EntityID, metadata.EntityID)
		}

		if params.MetadataURL != "" {
			provider.SAMLProvider.MetadataURL = &params.MetadataURL
		}

		provider.SAMLProvider.MetadataXML = string(rawMetadata)
		updateSAMLProvider = true
		modified = true
	}

	// domains are being "updated" only when params.Domains is not nil, if
	// it was nil (but not `[]`) then the caller is expecting not to modify
	// the domains
	updateDomains := params.Domains != nil

	var createDomains, deleteDomains []models.SSODomain
	keepDomains := make(map[string]bool)

	for _, domain := range params.Domains {
		existingProvider, err := models.FindSSOProviderByDomain(db, domain)
		if err != nil && !models.IsNotFoundError(err) {
			return err
		}
		if existingProvider != nil {
			if existingProvider.ID == provider.ID {
				keepDomains[domain] = true
			} else {
				return apierrors.NewBadRequestError(apierrors.ErrorCodeSSODomainAlreadyExists, "SSO domain '%s' already assigned to another provider (%s)", domain, existingProvider.ID.String())
			}
		} else {
			modified = true
			createDomains = append(createDomains, models.SSODomain{
				Domain:        domain,
				SSOProviderID: provider.ID,
			})
		}
	}

	if updateDomains {
		for i, domain := range provider.SSODomains {
			if !keepDomains[domain.Domain] {
				modified = true
				deleteDomains = append(deleteDomains, provider.SSODomains[i])
			}
		}
	}

	updateAttributeMapping := false
	if params.AttributeMapping.Keys != nil {
		updateAttributeMapping = !provider.SAMLProvider.AttributeMapping.Equal(&params.AttributeMapping)
		if updateAttributeMapping {
			modified = true
			provider.SAMLProvider.AttributeMapping = params.AttributeMapping
		}
	}

	nameIDFormat := ""
	if provider.SAMLProvider.NameIDFormat != nil {
		nameIDFormat = *provider.SAMLProvider.NameIDFormat
	}

	if params.NameIDFormat != nameIDFormat {
		modified = true

		if params.NameIDFormat == "" {
			provider.SAMLProvider.NameIDFormat = nil
		} else {
			provider.SAMLProvider.NameIDFormat = &params.NameIDFormat
		}
	}

	if params.ResourceID != nil {
		resourceID := *params.ResourceID
		switch {
		case resourceID == "" && provider.ResourceID != nil:
			provider.ResourceID = nil
			modified = true
		case resourceID != "" &&
			(provider.ResourceID == nil ||
				*provider.ResourceID != resourceID):
			provider.ResourceID = &resourceID
			modified = true
		}
	}

	if params.Disabled != nil {
		disabled := *params.Disabled
		if provider.Disabled == nil || *provider.Disabled != disabled {
			provider.Disabled = &disabled
			modified = true
		}
	}

	if modified {
		if err := db.Transaction(func(tx *storage.Connection) error {
			if terr := tx.Eager().Update(provider); terr != nil {
				return terr
			}

			if updateDomains {
				if terr := tx.Destroy(deleteDomains); terr != nil {
					return terr
				}

				if terr := tx.Eager().Create(createDomains); terr != nil {
					return terr
				}
			}

			if updateAttributeMapping || updateSAMLProvider {
				if terr := tx.Eager().Update(&provider.SAMLProvider); terr != nil {
					return terr
				}
			}

			return tx.Eager().Load(provider)
		}); err != nil {
			return apierrors.NewUnprocessableEntityError(apierrors.ErrorCodeConflict, "Updating SSO provider failed, likely due to a conflict. Try again?").WithInternalError(err)
		}
	}

	return sendJSON(w, http.StatusOK, provider)
}

// adminSSOProvidersDelete deletes a SAML identity provider.
func (a *API) adminSSOProvidersDelete(w http.ResponseWriter, r *http.Request) error {
	ctx := r.Context()
	db := a.db.WithContext(ctx)

	provider := getSSOProvider(ctx)

	if err := db.Transaction(func(tx *storage.Connection) error {
		return tx.Eager().Destroy(provider)
	}); err != nil {
		return err
	}

	return sendJSON(w, http.StatusOK, provider)
}
