package api

import (
	"context"
	"encoding/json"
	"net/http"
	"slices"

	"github.com/supabase/auth/internal/api/apierrors"
	"github.com/supabase/auth/internal/api/shared"
	"github.com/supabase/auth/internal/conf"
	"github.com/supabase/auth/internal/models"

	"github.com/supabase/auth/internal/utilities"
)

func sendJSON(w http.ResponseWriter, status int, obj interface{}) error {
	return shared.SendJSON(w, status, obj)
}

func isAdmin(u *models.User, config *conf.GlobalConfiguration) bool {
	return config.JWT.Aud == u.Aud && u.HasRole(config.JWT.AdminGroupName)
}

func (a *API) requestAud(ctx context.Context, r *http.Request) string {
	config := a.config
	// First check for an audience in the header
	if aud := r.Header.Get(audHeaderName); aud != "" {
		return aud
	}

	// Then check the token
	claims := getClaims(ctx)

	// ignore the JWT's aud claim if the role is admin
	// this is because anon, service_role never had an aud claim to begin with
	if claims != nil && !slices.Contains(config.JWT.AdminRoles, claims.Role) {
		aud, _ := claims.GetAudience()
		if len(aud) != 0 && aud[0] != "" {
			return aud[0]
		}
	}

	// Finally, return the default if none of the above methods are successful
	return config.JWT.Aud
}

type RequestParams interface {
	AdminUserParams |
		AdminCustomOAuthProviderParams |
		CreateSSOProviderParams |
		EnrollFactorParams |
		GenerateLinkParams |
		IdTokenGrantParams |
		InviteParams |
		OtpParams |
		PKCEGrantParams |
		PasswordGrantParams |
		RecoverParams |
		RecoveryCodesGenerateParams |
		RecoveryCodesVerifyParams |
		RefreshTokenGrantParams |
		ResendConfirmationParams |
		SignupParams |
		SingleSignOnParams |
		SmsParams |
		Web3GrantParams |
		UserUpdateParams |
		VerifyFactorParams |
		VerifyParams |
		adminUserUpdateFactorParams |
		adminUserDeleteParams |
		captchaRequest |
		ChallengeFactorParams |

		struct {
			Email string `json:"email"`
			Phone string `json:"phone"`
		} |
		struct {
			Email string `json:"email"`
		}
}

// retrieveRequestParams is a generic method that unmarshals the request body into the params struct provided
func retrieveRequestParams[A RequestParams](r *http.Request, params *A) error {
	body, err := utilities.GetBodyBytes(r)
	if err != nil {
		if err, ok := err.(*http.MaxBytesError); ok {
			return apierrors.NewHTTPError(http.StatusRequestEntityTooLarge, apierrors.ErrorCodeRequestEntityTooLarge, "Request body too large (max %d bytes)", err.Limit)
		}
		return apierrors.NewInternalServerError("Could not read body into byte slice").WithInternalError(err)
	}
	if err := json.Unmarshal(body, params); err != nil {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeBadJSON, "Could not parse request body as JSON: %v", err)
	}
	return nil
}
