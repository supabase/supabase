package awskmsjwk

import (
	"context"

	"github.com/aws/aws-sdk-go-v2/service/kms"
)

type KMSAPI interface {
	Sign(ctx context.Context, in *kms.SignInput, optFns ...func(*kms.Options)) (*kms.SignOutput, error)
}
