package api

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"time"

	"github.com/gofrs/uuid"
	"github.com/supabase/auth/internal/models"
)

const defaultPerPage = 50

// defaultKeysetPerPage is the page size used in cursor mode when the client
// does not pass a `limit`. maxKeysetPerPage caps the page size a client may
// request.
const (
	defaultKeysetPerPage = 50
	maxKeysetPerPage     = 1000
)

func calculateTotalPages(perPage, total uint64) uint64 {
	pages := total / perPage
	if total%perPage > 0 {
		return pages + 1
	}
	return pages
}

func addPaginationHeaders(w http.ResponseWriter, r *http.Request, p *models.Pagination) {
	totalPages := calculateTotalPages(p.PerPage, p.Count)
	url, _ := url.ParseRequestURI(r.URL.String())
	query := url.Query()
	header := ""
	if totalPages > p.Page {
		query.Set("page", fmt.Sprintf("%v", p.Page+1))
		url.RawQuery = query.Encode()
		header += "<" + url.String() + ">; rel=\"next\", "
	}
	query.Set("page", fmt.Sprintf("%v", totalPages))
	url.RawQuery = query.Encode()
	header += "<" + url.String() + ">; rel=\"last\""

	w.Header().Add("Link", header)
	w.Header().Add("X-Total-Count", fmt.Sprintf("%v", p.Count))
}

func paginate(r *http.Request) (*models.Pagination, error) {
	params := r.URL.Query()
	queryPage := params.Get("page")
	queryPerPage := params.Get("per_page")
	var page uint64 = 1
	var perPage uint64 = defaultPerPage
	var err error
	if queryPage != "" {
		page, err = strconv.ParseUint(queryPage, 10, 64)
		if err != nil {
			return nil, err
		}
	}
	if queryPerPage != "" {
		perPage, err = strconv.ParseUint(queryPerPage, 10, 64)
		if err != nil {
			return nil, err
		}
	}

	return &models.Pagination{
		Page:    page,
		PerPage: perPage,
	}, nil
}

// Cursor is the wire form of a keyset position. It is serialized as an opaque
// base64url(json) token; clients must treat it as opaque and pass it back
// verbatim.
type Cursor struct {
	CreatedAt time.Time `json:"created_at"`
	ID        uuid.UUID `json:"id"`
}

// String encodes the cursor as an opaque base64url(json) token.
func (c *Cursor) String() string {
	// json.Marshal of this fixed struct cannot fail.
	b, _ := json.Marshal(c)
	return base64.RawURLEncoding.EncodeToString(b)
}

// decodeCursor parses an opaque cursor token back into a keyset position. A
// malformed token or one with an empty id is rejected so the caller can map it
// to a 400.
func decodeCursor(raw string) (*models.KeysetCursor, error) {
	b, err := base64.RawURLEncoding.DecodeString(raw)
	if err != nil {
		return nil, fmt.Errorf("invalid cursor encoding: %w", err)
	}

	var c models.KeysetCursor
	if err := json.Unmarshal(b, &c); err != nil {
		return nil, fmt.Errorf("invalid cursor: %w", err)
	}

	if c.ID == uuid.Nil {
		return nil, fmt.Errorf("invalid cursor: missing id")
	}

	// A malformed timestamp is caught by Unmarshal, but a missing/zero
	// created_at unmarshals to the zero time and would otherwise be treated as
	// a valid (empty-matching) cursor. We never emit such a cursor, so reject.
	if c.CreatedAt.IsZero() {
		return nil, fmt.Errorf("invalid cursor: missing created_at")
	}

	return &c, nil
}

// parseKeysetParams reads the keyset pagination inputs (`limit`, `cursor`) from
// the request. limit defaults to defaultPerPage, is capped at maxKeysetPerPage,
// and must be greater than 0. An absent cursor means the first page.
func parseKeysetParams(r *http.Request) (*models.KeysetPagination, error) {
	params := r.URL.Query()

	p := &models.KeysetPagination{Limit: defaultKeysetPerPage}

	if queryLimit := params.Get("limit"); queryLimit != "" {
		limit, err := strconv.ParseUint(queryLimit, 10, 64)
		if err != nil {
			return nil, err
		}
		if limit == 0 {
			return nil, fmt.Errorf("limit must be greater than 0")
		}
		p.Limit = limit
	}

	if p.Limit > maxKeysetPerPage {
		p.Limit = maxKeysetPerPage
	}

	if queryCursor := params.Get("cursor"); queryCursor != "" {
		after, err := decodeCursor(queryCursor)
		if err != nil {
			return nil, err
		}
		p.After = after
	}

	return p, nil
}

// addKeysetPaginationHeaders sets the Link: rel="next" header pointing at the
// next cursor page. It is a no-op when next is nil (no further pages). The
// `page` param is dropped so the follow-up request stays in cursor mode.
func addKeysetPaginationHeaders(w http.ResponseWriter, r *http.Request, next *Cursor) {
	if next == nil {
		return
	}

	u, _ := url.ParseRequestURI(r.URL.String())
	query := u.Query()
	query.Del("page")
	query.Set("cursor", next.String())
	u.RawQuery = query.Encode()

	w.Header().Add("Link", "<"+u.String()+">; rel=\"next\"")
}

// CursorPaginationResponse is the pagination block returned in cursor mode.
type CursorPaginationResponse struct {
	NextCursor string `json:"next_cursor,omitempty"`
	HasMore    bool   `json:"has_more"`
}
