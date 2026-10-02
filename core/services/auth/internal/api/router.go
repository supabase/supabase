package api

import (
	"context"
	"net/http"

	"github.com/go-chi/chi/v5"
)

func newRouter() *router {
	return &router{chi.NewRouter()}
}

type router struct {
	chi chi.Router
}

func (r *router) Route(pattern string, fn func(*router)) {
	r.chi.Route(pattern, func(c chi.Router) {
		fn(&router{c})
	})
}

func (r *router) Get(pattern string, fn apiHandler) {
	r.chi.Get(pattern, handler(fn))
}
func (r *router) Post(pattern string, fn apiHandler) {
	r.chi.Post(pattern, handler(fn))
}
func (r *router) Put(pattern string, fn apiHandler) {
	r.chi.Put(pattern, handler(fn))
}
func (r *router) Patch(pattern string, fn apiHandler) {
	r.chi.Patch(pattern, handler(fn))
}
func (r *router) Delete(pattern string, fn apiHandler) {
	r.chi.Delete(pattern, handler(fn))
}

func (r *router) With(fn middlewareHandler) *router {
	c := r.chi.With(middleware(fn))
	return &router{c}
}

func (r *router) WithBypass(fn func(next http.Handler) http.Handler) *router {
	c := r.chi.With(fn)
	return &router{c}
}

func (r *router) Use(fn middlewareHandler) {
	r.chi.Use(middleware(fn))
}
func (r *router) UseBypass(fn func(next http.Handler) http.Handler) {
	r.chi.Use(fn)
}

func (r *router) NotFound(fn apiHandler) {
	r.chi.NotFound(handler(fn))
}

func (r *router) ServeHTTP(w http.ResponseWriter, req *http.Request) {
	r.chi.ServeHTTP(w, req)
}

type apiHandler func(w http.ResponseWriter, r *http.Request) error

func handler(fn apiHandler) http.HandlerFunc {
	return fn.serve
}

func (h apiHandler) serve(w http.ResponseWriter, r *http.Request) {
	if err := h(w, r); err != nil {
		HandleResponseError(err, w, r)
	}
}

type middlewareHandler func(w http.ResponseWriter, r *http.Request) (context.Context, error)

func (m middlewareHandler) handler(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		m.serve(next, w, r)
	})
}

func (m middlewareHandler) serve(next http.Handler, w http.ResponseWriter, r *http.Request) {
	ctx, err := m(w, r)
	if err != nil {
		HandleResponseError(err, w, r)
		return
	}
	if ctx != nil {
		r = r.WithContext(ctx)
	}
	next.ServeHTTP(w, r)
}

func middleware(fn middlewareHandler) func(http.Handler) http.Handler {
	return fn.handler
}
