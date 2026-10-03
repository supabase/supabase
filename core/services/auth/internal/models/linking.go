package models

import (
	"strings"

	"github.com/supabase/auth/internal/api/provider"
	"github.com/supabase/auth/internal/conf"
	"github.com/supabase/auth/internal/storage"
)

// GetAccountLinkingDomain returns a string that describes the account linking
// domain. An account linking domain describes a set of Identity entities that
// _should_ generally fall under the same User entity. It's just a runtime
// string, and is not typically persisted in the database. This value can vary
// across time.
//
// The linkingDomains map assigns providers to a shared linking domain:
// providers mapped to the same domain link to one another but stay isolated
// from the "default" email-linked pool and from SSO.
func GetAccountLinkingDomain(provider string, linkingDomains map[string]string) string {
	if strings.HasPrefix(provider, "sso:") {
		// when the provider ID is a SSO provider, then the linking
		// domain is the provider itself i.e. there can only be one
		// user + identity per identity provider
		return provider
	}

	if domain, ok := linkingDomains[provider]; ok {
		// providers mapped to the same domain share a linking domain, so
		// they link to one another but not to default/SSO
		return domain
	}

	// otherwise, the linking domain is the default linking domain that
	// links all accounts
	return "default"
}

type AccountLinkingDecision = int

const (
	AccountExists AccountLinkingDecision = iota
	CreateAccount
	LinkAccount
	MultipleAccounts
)

type AccountLinkingResult struct {
	Decision       AccountLinkingDecision
	User           *User
	Identities     []*Identity
	LinkingDomain  string
	CandidateEmail provider.Email
}

// DetermineAccountLinking uses the provided data and database state to compute a decision on whether:
// - A new User should be created (CreateAccount)
// - A new Identity should be created (LinkAccount) with a UserID pointing to an existing user account
// - Nothing should be done (AccountExists)
// - It's not possible to decide due to data inconsistency (MultipleAccounts) and the caller should decide
//
// Errors signal failure in processing only, like database access errors.
func DetermineAccountLinking(tx *storage.Connection, config *conf.GlobalConfiguration, emails []provider.Email, aud, providerName, sub string) (AccountLinkingResult, error) {
	var verifiedEmails []string
	var candidateEmail provider.Email
	for _, email := range emails {
		if email.Verified || config.Mailer.Autoconfirm {
			verifiedEmails = append(verifiedEmails, strings.ToLower(email.Email))
		}
		if email.Primary {
			candidateEmail = email
			candidateEmail.Email = strings.ToLower(email.Email)
		}
	}

	// this is the linking domain for the new identity
	candidateLinkingDomain := GetAccountLinkingDomain(providerName, config.Experimental.ProviderLinkingDomains)

	if identity, terr := FindIdentityByIdAndProvider(tx, sub, providerName); terr == nil {
		// account exists

		var user *User
		if user, terr = FindUserByID(tx, identity.UserID); terr != nil {
			return AccountLinkingResult{}, terr
		}

		// we overwrite the email with the existing user's email since the user
		// could have an empty email
		candidateEmail.Email = user.GetEmail()
		return AccountLinkingResult{
			Decision:       AccountExists,
			User:           user,
			Identities:     []*Identity{identity},
			LinkingDomain:  candidateLinkingDomain,
			CandidateEmail: candidateEmail,
		}, nil
	} else if !IsNotFoundError(terr) {
		return AccountLinkingResult{}, terr
	}

	// the identity does not exist, so we need to check if we should create a new account
	// or link to an existing one
	if len(verifiedEmails) == 0 {
		// if there are no verified emails, we always decide to create a new account
		user, terr := IsDuplicatedEmail(tx, candidateEmail.Email, aud, nil, config.Experimental.ProviderLinkingDomains)
		if terr != nil {
			return AccountLinkingResult{}, terr
		}
		if user != nil {
			candidateEmail.Email = ""
		}
		return AccountLinkingResult{
			Decision:       CreateAccount,
			LinkingDomain:  candidateLinkingDomain,
			CandidateEmail: candidateEmail,
		}, nil
	}

	var similarIdentities []*Identity
	var similarUsers []*User

	// look for similar identities and users based on email
	if terr := tx.Q().Eager().Where("email = any (?)", verifiedEmails).All(&similarIdentities); terr != nil {
		return AccountLinkingResult{}, terr
	}

	if candidateLinkingDomain == "default" {
		// there can be multiple user accounts with the same email when is_sso_user is true
		// so we just do not consider those similar user accounts
		if terr := tx.Q().Eager().Where("email = any (?) and is_sso_user = false", verifiedEmails).All(&similarUsers); terr != nil {
			return AccountLinkingResult{}, terr
		}
	}

	// Need to check if the new identity should be assigned to an
	// existing user or to create a new user, according to the automatic
	// linking rules
	var linkingIdentities []*Identity

	// now let's see if there are any existing and similar identities in
	// the same linking domain
	for _, identity := range similarIdentities {
		if GetAccountLinkingDomain(identity.Provider, config.Experimental.ProviderLinkingDomains) == candidateLinkingDomain {
			linkingIdentities = append(linkingIdentities, identity)
		}
	}

	if len(linkingIdentities) == 0 {
		if len(similarUsers) == 1 {
			// no similarIdentities but a user with the same email exists
			// so we link this new identity to the user
			// TODO: Backfill the missing identity for the user
			return AccountLinkingResult{
				Decision:       LinkAccount,
				User:           similarUsers[0],
				Identities:     linkingIdentities,
				LinkingDomain:  candidateLinkingDomain,
				CandidateEmail: candidateEmail,
			}, nil
		} else if len(similarUsers) > 1 {
			// this shouldn't happen since there is a partial unique index on (email and is_sso_user = false)
			return AccountLinkingResult{
				Decision:       MultipleAccounts,
				Identities:     linkingIdentities,
				LinkingDomain:  candidateLinkingDomain,
				CandidateEmail: candidateEmail,
			}, nil
		} else {
			// there are no identities in the linking domain, we have to
			// create a new identity and new user
			return AccountLinkingResult{
				Decision:       CreateAccount,
				LinkingDomain:  candidateLinkingDomain,
				CandidateEmail: candidateEmail,
			}, nil
		}
	}

	// there is at least one identity in the linking domain let's do a
	// sanity check to see if all of the identities in the domain share the
	// same user ID
	linkingUserId := linkingIdentities[0].UserID
	for _, identity := range linkingIdentities {
		if identity.UserID != linkingUserId {
			// ok this linking domain has more than one user account
			// caller should decide what to do

			return AccountLinkingResult{
				Decision:       MultipleAccounts,
				Identities:     linkingIdentities,
				LinkingDomain:  candidateLinkingDomain,
				CandidateEmail: candidateEmail,
			}, nil
		}
	}

	// there's only one user ID in this linking domain, we can go on and
	// create a new identity and link it to the existing account

	var user *User
	var terr error

	if user, terr = FindUserByID(tx, linkingUserId); terr != nil {
		return AccountLinkingResult{}, terr
	}

	return AccountLinkingResult{
		Decision:       LinkAccount,
		User:           user,
		Identities:     linkingIdentities,
		LinkingDomain:  candidateLinkingDomain,
		CandidateEmail: candidateEmail,
	}, nil
}
