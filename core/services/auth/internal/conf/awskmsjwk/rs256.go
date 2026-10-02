package awskmsjwk

import (
	"context"
	"crypto/sha256"
	"errors"

	"github.com/aws/aws-sdk-go-v2/service/kms"
	kmstypes "github.com/aws/aws-sdk-go-v2/service/kms/types"
	"github.com/golang-jwt/jwt/v5"
	"github.com/sirupsen/logrus"
)

var ErrNotRS256Key = errors.New("awskmsjwk: key needs to be *RS256Key")

type RS256Key struct {
	Ctx context.Context
	KMS KMSAPI

	KeyID string
	Raw   any
}

type signingMethodKMSRS256 struct{}

var SigningMethodRS256KMS jwt.SigningMethod = &signingMethodKMSRS256{}

func (m *signingMethodKMSRS256) Alg() string {
	return jwt.SigningMethodRS256.Alg() // "RS256"
}

func (m *signingMethodKMSRS256) Sign(signingString string, key any) ([]byte, error) {
	k, ok := key.(*RS256Key)
	if !ok {
		return nil, ErrNotRS256Key
	}

	// JWT RS256 signs SHA256(base64url(header) + "." + base64url(payload)).
	// Use DIGEST so large JWTs do not hit KMS RAW message size limits.
	digest := sha256.Sum256([]byte(signingString))

	out, err := k.KMS.Sign(k.Ctx, &kms.SignInput{
		KeyId:            &k.KeyID,
		Message:          digest[:],
		MessageType:      kmstypes.MessageTypeDigest,
		SigningAlgorithm: kmstypes.SigningAlgorithmSpecRsassaPkcs1V15Sha256,
	})
	if err != nil {
		logrus.WithError(err).Errorf("Unable to sign RS256 JWT with AWS KMS key %q", k.KeyID)

		return nil, err
	}

	return out.Signature, nil
}

func (m *signingMethodKMSRS256) Verify(signingString string, sig []byte, key any) error {
	k, ok := key.(*RS256Key)
	if !ok {
		return ErrNotRS256Key
	}

	return jwt.SigningMethodRS256.Verify(signingString, sig, k.Raw)
}
