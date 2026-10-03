package api

import (
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gofrs/uuid"
	"github.com/stretchr/testify/require"
)

func TestCursorRoundTrip(t *testing.T) {
	id := uuid.Must(uuid.NewV4())
	// include sub-second precision to ensure the nanosecond component survives
	created := time.Date(2024, 3, 4, 5, 6, 7, 123456789, time.UTC)

	c := &Cursor{CreatedAt: created, ID: id}
	decoded, err := decodeCursor(c.String())
	require.NoError(t, err)
	require.True(t, created.Equal(decoded.CreatedAt), "created_at must round-trip: got %v want %v", decoded.CreatedAt, created)
	require.Equal(t, id, decoded.ID)
}

func TestDecodeCursorErrors(t *testing.T) {
	// invalid base64
	{
		_, err := decodeCursor("not*base64*")
		require.Error(t, err)
	}

	// valid base64 but not json
	{
		_, err := decodeCursor("bm90LWpzb24") // base64url("not-json")
		require.Error(t, err)
	}

	// json with nil uuid must be rejected
	{
		c := &Cursor{CreatedAt: time.Now(), ID: uuid.Nil}
		_, err := decodeCursor(c.String())
		require.Error(t, err)
	}

	// json with a missing/zero created_at must be rejected
	{
		c := &Cursor{ID: uuid.Must(uuid.NewV4())} // CreatedAt left as zero value
		_, err := decodeCursor(c.String())
		require.Error(t, err)
	}
}

func TestParseKeysetParams(t *testing.T) {
	// default limit when absent
	{
		r := httptest.NewRequest("GET", "/admin/users", nil)
		p, err := parseKeysetParams(r)
		require.NoError(t, err)
		require.Equal(t, uint64(defaultKeysetPerPage), p.Limit)
		require.Nil(t, p.After)
	}

	// explicit limit honored
	{
		r := httptest.NewRequest("GET", "/admin/users?limit=25", nil)
		p, err := parseKeysetParams(r)
		require.NoError(t, err)
		require.Equal(t, uint64(25), p.Limit)
	}

	// limit capped at max
	{
		r := httptest.NewRequest("GET", "/admin/users?limit=5000", nil)
		p, err := parseKeysetParams(r)
		require.NoError(t, err)
		require.Equal(t, uint64(maxKeysetPerPage), p.Limit)
	}

	// limit=0 is invalid
	{
		r := httptest.NewRequest("GET", "/admin/users?limit=0", nil)
		_, err := parseKeysetParams(r)
		require.Error(t, err)
	}

	// non-numeric limit is invalid
	{
		r := httptest.NewRequest("GET", "/admin/users?limit=abc", nil)
		_, err := parseKeysetParams(r)
		require.Error(t, err)
	}

	// cursor decoded into After
	{
		id := uuid.Must(uuid.NewV4())
		c := &Cursor{CreatedAt: time.Now(), ID: id}
		r := httptest.NewRequest("GET", "/admin/users?cursor="+c.String(), nil)
		p, err := parseKeysetParams(r)
		require.NoError(t, err)
		require.NotNil(t, p.After)
		require.Equal(t, id, p.After.ID)
	}

	// bad cursor errors
	{
		r := httptest.NewRequest("GET", "/admin/users?cursor=not*base64*", nil)
		_, err := parseKeysetParams(r)
		require.Error(t, err)
	}
}

func TestAddKeysetPaginationHeaders(t *testing.T) {
	// nil cursor: no Link header
	{
		w := httptest.NewRecorder()
		r := httptest.NewRequest("GET", "/admin/users?page=2&limit=10", nil)
		addKeysetPaginationHeaders(w, r, nil)
		require.Empty(t, w.Header().Get("Link"))
	}

	// non-nil cursor: Link rel=next set, page dropped, cursor present
	{
		w := httptest.NewRecorder()
		r := httptest.NewRequest("GET", "/admin/users?page=2&limit=10", nil)
		next := &Cursor{CreatedAt: time.Now(), ID: uuid.Must(uuid.NewV4())}
		addKeysetPaginationHeaders(w, r, next)
		link := w.Header().Get("Link")
		require.Contains(t, link, `rel="next"`)
		require.Contains(t, link, "cursor=")
		require.NotContains(t, link, "page=")
	}
}
