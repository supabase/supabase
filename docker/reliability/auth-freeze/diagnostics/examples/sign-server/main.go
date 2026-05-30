// Reference implementation of a freezekit signer service.
//
// freezekit's SignedURLSink does not hold cloud credentials. Instead
// it calls a tiny HTTP service that signs PUT URLs on its behalf.
// This minimises the IAM blast radius of the auth pod.
//
// This example targets AWS S3 using SigV4 query-string presigning.
// For GCS use the GoogleAccessId/Expires/Signature pattern; for
// Azure use SAS tokens; for R2 the S3 presigner works as-is.
//
// IAM policy for the role this server runs under:
//
//   {
//     "Statement": [{
//       "Effect": "Allow",
//       "Action": ["s3:PutObject"],
//       "Resource": "arn:aws:s3:::supabase-diagnostics/*"
//     }]
//   }
//
// Production hardening you'll want to add:
//   - Authentication on the signer endpoint (mTLS or shared bearer)
//   - Rate limiting per pod
//   - Allowlist of acceptable key prefixes
//   - Audit log of every signed URL
//
// Build:
//   go build -o sign-server .
// Run:
//   AWS_REGION=us-east-1 BUCKET=supabase-diagnostics ./sign-server
package main

import (
	"context"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

func main() {
	bucket := flag.String("bucket", os.Getenv("BUCKET"), "Target bucket name")
	listen := flag.String("listen", envOr("LISTEN", ":8088"), "Listen address")
	ttl := flag.Duration("ttl", 10*time.Minute, "Presigned URL TTL")
	flag.Parse()
	if *bucket == "" {
		fatalf("--bucket (or $BUCKET) is required")
	}

	log := slog.New(slog.NewJSONHandler(os.Stderr, nil))

	cfg, err := config.LoadDefaultConfig(context.Background())
	if err != nil {
		fatalf("load aws config: %v", err)
	}
	client := s3.NewFromConfig(cfg)
	psClient := s3.NewPresignClient(client)

	mux := http.NewServeMux()
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		key := strings.TrimSpace(r.URL.Query().Get("key"))
		ct := r.URL.Query().Get("content_type")
		if key == "" || strings.Contains(key, "..") {
			http.Error(w, "missing or invalid key", http.StatusBadRequest)
			return
		}
		req, err := psClient.PresignPutObject(r.Context(), &s3.PutObjectInput{
			Bucket:      bucket,
			Key:         &key,
			ContentType: &ct,
		}, s3.WithPresignExpires(*ttl))
		if err != nil {
			log.Error("presign failed", slog.Any("err", err), slog.String("key", key))
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]any{
			"url":     req.URL,
			"headers": req.SignedHeader,
		})
	})

	srv := &http.Server{Addr: *listen, Handler: mux, ReadHeaderTimeout: 5 * time.Second}
	log.Info("sign-server listening", slog.String("addr", *listen), slog.String("bucket", *bucket))
	if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		fatalf("listen: %v", err)
	}
}

func envOr(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}

func fatalf(format string, args ...any) {
	fmt.Fprintf(os.Stderr, format+"\n", args...)
	os.Exit(1)
}
