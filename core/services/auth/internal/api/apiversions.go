package api

import (
	"time"
)

const APIVersionHeaderName = "X-Supabase-Api-Version"

type APIVersion = time.Time

var (
	APIVersionInitial  = time.Time{}
	APIVersion20240101 = time.Date(2024, time.January, 1, 0, 0, 0, 0, time.UTC)
)

func DetermineClosestAPIVersion(date string) (APIVersion, error) {
	if date == "" {
		return APIVersionInitial, nil
	}

	parsed, err := time.ParseInLocation("2006-01-02", date, time.UTC)
	if err != nil {
		return APIVersionInitial, err
	}

	if parsed.Compare(APIVersion20240101) >= 0 {
		return APIVersion20240101, nil
	}

	return APIVersionInitial, nil
}

func FormatAPIVersion(apiVersion APIVersion) string {
	return apiVersion.Format("2006-01-02")
}
