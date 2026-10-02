package e2e_test

import (
	"fmt"
	"reflect"

	"github.com/supabase/auth/internal/conf/confload"
	"github.com/supabase/auth/internal/e2e"
)

func Example_config() {
	testCfgPath := "../../hack/test.env"
	testCfg := e2e.Must(confload.LoadGlobal(testCfgPath))
	globalCfg := e2e.Must(e2e.Config())

	testCfg.JWT.SigningKey = nil
	globalCfg.JWT.SigningKey = nil

	if reflect.DeepEqual(testCfg, globalCfg) {
		fmt.Println("e2e.Config is equal to the config in hack/test.env")
	} else {
		fmt.Println("e2e.Config loaded an unknown config file")
	}

	// Output:
	// e2e.Config is equal to the config in hack/test.env
}

func Example_conn() {
	globalCfg := e2e.Must(e2e.Config())
	conn := e2e.Must(e2e.Conn(globalCfg))
	if conn != nil {
		fmt.Println("e2e.Conn connection returned using hack/test.env")
	}

	// Output:
	// e2e.Conn connection returned using hack/test.env
}
