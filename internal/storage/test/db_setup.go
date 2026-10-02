package test

import (
	"github.com/supabase/auth/internal/conf"
	"github.com/supabase/auth/internal/storage"
)

func SetupDBConnection(globalConfig *conf.GlobalConfiguration) (*storage.Connection, error) {
	return storage.Dial(globalConfig)
}
