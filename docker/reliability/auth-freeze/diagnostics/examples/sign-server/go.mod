module github.com/supabase/diagnostics/examples/sign-server

go 1.22

// This example imports aws-sdk-go-v2. It is NOT used by the
// freezekit core package — only by this standalone reference
// signer service.
require (
	github.com/aws/aws-sdk-go-v2/config v1.27.0
	github.com/aws/aws-sdk-go-v2/service/s3 v1.50.0
)
