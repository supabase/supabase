module mailme-example

go 1.21

require github.com/supabase/mailme v0.0.0-00010101000000-000000000000

replace github.com/supabase/mailme => ../../

require (
	github.com/sirupsen/logrus v1.9.3 // indirect
	github.com/wneessen/go-mail v0.4.4 // indirect
	golang.org/x/sys v0.0.0-20220715151400-c0bba94af5f8 // indirect
)