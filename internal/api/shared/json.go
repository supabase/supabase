package shared

import (
	"encoding/json"
	"net/http"

	"github.com/pkg/errors"
)

type JSONResponse struct {
	w      http.ResponseWriter
	status int
}

func JSON(w http.ResponseWriter) *JSONResponse {
	j := &JSONResponse{w: w}
	return j.ContentType("application/json").Status(http.StatusOK)
}

func (j *JSONResponse) Header(key, value string) *JSONResponse {
	j.w.Header().Set(key, value)
	return j
}

func (j *JSONResponse) ContentType(contentType string) *JSONResponse {
	return j.Header("Content-Type", contentType)
}

func (j *JSONResponse) Status(status int) *JSONResponse {
	j.status = status
	return j
}

func (j *JSONResponse) Write(b []byte) error {
	j.w.WriteHeader(j.status)
	if len(b) == 0 {
		return nil
	}
	_, err := j.w.Write(b)
	return err
}

func (j *JSONResponse) Send(obj any) error {
	var b []byte
	if obj != nil {
		var err error
		b, err = json.Marshal(obj)
		if err != nil {
			return errors.Wrapf(err, "Error encoding json response: %v", obj)
		}
	}
	return j.Write(b)
}
