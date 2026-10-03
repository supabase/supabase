package api

import (
	"context"
	"net/http"
	"regexp"

	"github.com/supabase/auth/internal/api/apierrors"
	"github.com/supabase/auth/internal/crypto"
	"github.com/supabase/auth/internal/tokens"
)

// RefreshTokenGrantParams are the parameters the RefreshTokenGrant method accepts
type RefreshTokenGrantParams struct {
	RefreshToken string `json:"refresh_token"`
}

var legacyRefreshTokenPattern = regexp.MustCompile("^[a-z0-9]{12}$")

func (p *RefreshTokenGrantParams) Validate() error {
	if len(p.RefreshToken) < 12 {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "Refresh token is not valid")
	}

	if len(p.RefreshToken) == 12 {
		if !legacyRefreshTokenPattern.MatchString(p.RefreshToken) {
			return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "Refresh token is not valid")
		}

		return nil
	}

	_, err := crypto.ParseRefreshToken(p.RefreshToken)
	if err != nil {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "Refresh token is not valid").WithInternalError(err)
	}

	return nil
}

// RefreshTokenGrant implements the refresh_token grant type flow
func (a *API) RefreshTokenGrant(ctx context.Context, w http.ResponseWriter, r *http.Request) error {
	params := &RefreshTokenGrantParams{}
	if err := retrieveRequestParams(r, params); err != nil {
		return err
	}

	if err := params.Validate(); err != nil {
		return err
	}

	db := a.db.WithContext(ctx)
	tokenResponse, err := a.tokenService.RefreshTokenGrant(ctx, db, r, w.Header(), tokens.RefreshTokenGrantParams{
		RefreshToken: params.RefreshToken,
	})
	if err != nil {
		return err
	}

	return sendJSON(w, http.StatusOK, tokenResponse)
}
