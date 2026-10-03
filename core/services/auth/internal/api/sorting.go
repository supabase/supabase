package api

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/supabase/auth/internal/models"
)

func sort(r *http.Request, allowedFields map[string]bool, defaultSort []models.SortField) (*models.SortParams, error) {
	sortParams := &models.SortParams{
		Fields: defaultSort,
	}
	urlParams := r.URL.Query()
	if values, exists := urlParams["sort"]; exists && len(values) > 0 {
		sortParams.Fields = []models.SortField{}
		for _, value := range values {
			parts := strings.SplitN(value, " ", 2)
			field := parts[0]
			if _, ok := allowedFields[field]; !ok {
				return nil, fmt.Errorf("bad field for sort '%v'", field)
			}

			dir := models.Descending
			if len(parts) > 1 {
				switch strings.ToUpper(parts[1]) {
				case string(models.Ascending):
					dir = models.Ascending
				case string(models.Descending):
					dir = models.Descending
				default:
					return nil, fmt.Errorf("bad direction for sort '%v', only 'asc' and 'desc' allowed", parts[1])
				}
			}
			sortParams.Fields = append(sortParams.Fields, models.SortField{Name: field, Dir: dir})
		}
	}

	return sortParams, nil
}
