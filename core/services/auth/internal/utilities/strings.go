package utilities

// StringValue safely extracts a string from a *string, returning empty string if nil
func StringValue(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

// StringPtr returns a pointer to a string if non-empty, nil otherwise
func StringPtr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}
