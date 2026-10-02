package models

import (
	"database/sql"
	"database/sql/driver"
	"encoding/json"
	"net/url"
	"reflect"
	"strings"
	"time"

	"github.com/crewjam/saml"
	"github.com/crewjam/saml/samlsp"
	"github.com/gofrs/uuid"
	"github.com/pkg/errors"
	"github.com/supabase/auth/internal/storage"
)

type SSOProvider struct {
	ID           uuid.UUID    `db:"id" json:"id"`
	ResourceID   *string      `db:"resource_id" json:"resource_id,omitempty"`
	Disabled     *bool        `db:"disabled" json:"disabled"`
	SAMLProvider SAMLProvider `has_one:"saml_providers" fk_id:"sso_provider_id" json:"saml,omitempty"`
	SSODomains   []SSODomain  `has_many:"sso_domains" fk_id:"sso_provider_id" json:"domains"`

	CreatedAt time.Time `db:"created_at" json:"created_at"`
	UpdatedAt time.Time `db:"updated_at" json:"updated_at"`
}

func (p SSOProvider) IsEnabled() bool {
	return p.Disabled == nil || !*p.Disabled
}

func (p SSOProvider) TableName() string {
	return "sso_providers"
}

func (p SSOProvider) Type() string {
	return "saml"
}

type SAMLAttribute struct {
	Name    string      `json:"name,omitempty"`
	Names   []string    `json:"names,omitempty"`
	Default interface{} `json:"default,omitempty"`
	Array   bool        `json:"array,omitempty"`
}

type SAMLAttributeMapping struct {
	Keys map[string]SAMLAttribute `json:"keys,omitempty"`
}

func (m *SAMLAttributeMapping) Equal(o *SAMLAttributeMapping) bool {
	if m == o {
		return true
	}

	if m == nil || o == nil {
		return false
	}

	if m.Keys == nil && o.Keys == nil {
		return true
	}

	if len(m.Keys) != len(o.Keys) {
		return false
	}

	for mkey, mvalue := range m.Keys {
		value, ok := o.Keys[mkey]
		if !ok {
			return false
		}

		if mvalue.Name != value.Name || len(mvalue.Names) != len(value.Names) {
			return false
		}

		for i := 0; i < len(mvalue.Names); i += 1 {
			if mvalue.Names[i] != value.Names[i] {
				return false
			}
		}

		if !reflect.DeepEqual(mvalue.Default, value.Default) {
			return false
		}

		if mvalue.Array != value.Array {
			return false
		}
	}

	return true
}

func (m *SAMLAttributeMapping) Scan(src interface{}) error {
	b, ok := src.([]byte)
	if !ok {
		return errors.New("scan source was not []byte")
	}
	err := json.Unmarshal(b, m)
	if err != nil {
		return err
	}
	return nil
}

func (m SAMLAttributeMapping) Value() (driver.Value, error) {
	b, err := json.Marshal(m)
	if err != nil {
		return nil, err
	}
	return string(b), nil
}

type SAMLProvider struct {
	ID uuid.UUID `db:"id" json:"-"`

	SSOProvider   *SSOProvider `belongs_to:"sso_providers" json:"-"`
	SSOProviderID uuid.UUID    `db:"sso_provider_id" json:"-"`

	EntityID    string  `db:"entity_id" json:"entity_id"`
	MetadataXML string  `db:"metadata_xml" json:"metadata_xml,omitempty"`
	MetadataURL *string `db:"metadata_url" json:"metadata_url,omitempty"`

	AttributeMapping SAMLAttributeMapping `db:"attribute_mapping" json:"attribute_mapping,omitempty"`

	NameIDFormat *string `db:"name_id_format" json:"name_id_format,omitempty"`

	CreatedAt time.Time `db:"created_at" json:"-"`
	UpdatedAt time.Time `db:"updated_at" json:"-"`
}

func (p SAMLProvider) TableName() string {
	return "saml_providers"
}

func (p SAMLProvider) EntityDescriptor() (*saml.EntityDescriptor, error) {
	return samlsp.ParseMetadata([]byte(p.MetadataXML))
}

type SSODomain struct {
	ID uuid.UUID `db:"id" json:"-"`

	SSOProvider   *SSOProvider `belongs_to:"sso_providers" json:"-"`
	SSOProviderID uuid.UUID    `db:"sso_provider_id" json:"-"`

	Domain string `db:"domain" json:"domain"`

	CreatedAt time.Time `db:"created_at" json:"-"`
	UpdatedAt time.Time `db:"updated_at" json:"-"`
}

func (d SSODomain) TableName() string {
	return "sso_domains"
}

type SAMLRelayState struct {
	ID uuid.UUID `db:"id"`

	SSOProviderID uuid.UUID `db:"sso_provider_id"`

	RequestID string  `db:"request_id"`
	ForEmail  *string `db:"for_email"`

	RedirectTo string `db:"redirect_to"`

	CreatedAt   time.Time  `db:"created_at" json:"-"`
	UpdatedAt   time.Time  `db:"updated_at" json:"-"`
	FlowStateID *uuid.UUID `db:"flow_state_id" json:"flow_state_id,omitempty"`
	FlowState   *FlowState `db:"-" json:"flow_state,omitempty" belongs_to:"flow_state"`
}

func (s SAMLRelayState) TableName() string {
	return "saml_relay_states"
}

func FindSAMLProviderByEntityID(tx *storage.Connection, entityId string) (*SSOProvider, error) {
	var samlProvider SAMLProvider
	if err := tx.Q().Where("entity_id = ?", entityId).First(&samlProvider); err != nil {
		if errors.Cause(err) == sql.ErrNoRows {
			return nil, SSOProviderNotFoundError{}
		}

		return nil, errors.Wrap(err, "error finding SAML SSO provider by EntityID")
	}

	var ssoProvider SSOProvider
	if err := tx.Eager().Q().Where("id = ?", samlProvider.SSOProviderID).First(&ssoProvider); err != nil {
		return nil, errors.Wrap(err, "error finding SAML SSO provider by ID (via EntityID)")
	}

	return &ssoProvider, nil
}

func FindSSOProviderByID(tx *storage.Connection, id uuid.UUID) (*SSOProvider, error) {
	var ssoProvider SSOProvider

	if err := tx.Eager().Q().Where("id = ?", id).First(&ssoProvider); err != nil {
		if errors.Cause(err) == sql.ErrNoRows {
			return nil, SSOProviderNotFoundError{}
		}

		return nil, errors.Wrap(err, "error finding SAML SSO provider by ID")
	}
	return &ssoProvider, nil
}

func FindSSOProviderByResourceID(tx *storage.Connection, id string) (*SSOProvider, error) {
	var ssoProvider SSOProvider

	if err := tx.Eager().Q().Where("resource_id = ?", id).First(&ssoProvider); err != nil {
		if errors.Cause(err) == sql.ErrNoRows {
			return nil, SSOProviderNotFoundError{}
		}

		return nil, errors.Wrap(err, "error finding SAML SSO provider by Resource ID")
	}

	return &ssoProvider, nil
}

func FindSSOProviderForEmailAddress(tx *storage.Connection, emailAddress string) (*SSOProvider, error) {
	parts := strings.Split(emailAddress, "@")
	emailDomain := strings.ToLower(parts[1])

	return FindSSOProviderByDomain(tx, emailDomain)
}

func FindSSOProviderByDomain(tx *storage.Connection, domain string) (*SSOProvider, error) {
	var ssoDomain SSODomain

	if err := tx.Q().Where("domain = ?", domain).First(&ssoDomain); err != nil {
		if errors.Cause(err) == sql.ErrNoRows {
			return nil, SSOProviderNotFoundError{}
		}

		return nil, errors.Wrap(err, "error finding SAML SSO domain")
	}

	var ssoProvider SSOProvider
	if err := tx.Eager().Q().Where("id = ?", ssoDomain.SSOProviderID).First(&ssoProvider); err != nil {
		if errors.Cause(err) == sql.ErrNoRows {
			return nil, SSOProviderNotFoundError{}
		}

		return nil, errors.Wrap(err, "error finding SAML SSO provider by ID (via domain)")
	}

	return &ssoProvider, nil
}

func FindAllSSOProviders(tx *storage.Connection) ([]SSOProvider, error) {
	var providers []SSOProvider

	if err := tx.Eager().All(&providers); err != nil {
		if errors.Cause(err) == sql.ErrNoRows {
			return nil, nil
		}

		return nil, errors.Wrap(err, "error loading all SAML SSO providers")
	}

	return providers, nil
}

const (
	resourceIDFilter       = "resource_id"
	resourceIDPrefixFilter = "resource_id_prefix"
)

// FindAllSSOProvidersByFilter finds SSO Providers with the matching filter.
func FindAllSSOProvidersByFilter(
	tx *storage.Connection,
	queryValues url.Values,
) ([]*SSOProvider, error) {
	ssoProviders := []*SSOProvider{}

	q := tx.Eager().Q()
	if v := queryValues.Get(resourceIDFilter); v != "" {
		q = q.Where("resource_id = ?", v)
	} else if v := queryValues.Get(resourceIDPrefixFilter); v != "" {
		q = q.Where("resource_id LIKE ?", v+"%")
	}
	if err := q.All(&ssoProviders); err != nil {
		if errors.Cause(err) == sql.ErrNoRows {
			return nil, nil
		}
		return nil, errors.Wrap(err, "error loading all SAML SSO providers")
	}
	return ssoProviders, nil
}

func FindSAMLRelayStateByID(tx *storage.Connection, id uuid.UUID) (*SAMLRelayState, error) {
	var state SAMLRelayState

	if err := tx.Eager().Q().Where("id = ?", id).First(&state); err != nil {
		if errors.Cause(err) == sql.ErrNoRows {
			return nil, SAMLRelayStateNotFoundError{}
		}

		return nil, errors.Wrap(err, "error loading SAML Relay State")
	}

	return &state, nil
}
