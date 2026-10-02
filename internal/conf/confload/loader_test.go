package confload

import (
	"encoding/json"
	"fmt"
	"io/fs"
	"maps"
	"slices"
	"strings"
	"testing"
	"testing/fstest"

	"github.com/joho/godotenv"
	"github.com/stretchr/testify/require"
	"github.com/supabase/auth/internal/e2e/e2ecfg"
)

type M = map[string]string

func TestLoaderCompat(t *testing.T) {
	cfg1, err := LoadGlobal(e2ecfg.GetConfigPath())
	require.NoError(t, err)
	require.NotNil(t, cfg1)

	lr := NewLoader()
	cfg2, err := lr.Startup(e2ecfg.GetConfigPath(), "")
	require.NoError(t, err)
	require.NotNil(t, cfg2)

	// SigningKey is a func
	cfg1.JWT.SigningKey = nil
	cfg2.JWT.SigningKey = nil

	// Old and new loader should have identical output
	require.Equal(t, cfg1, cfg2)
}

func TestLoaderStartup(t *testing.T) {
	type test struct {
		name string
		sys  *testSystem
		file string
		dir  string

		exp    M
		errStr string
	}

	tests := []test{

		{
			name: "no config file specified only base environ",
			sys: newTestSystem(fstest.MapFS{}).withEnv(M{
				"KEY_1": "VAL_1_environ",
				"KEY_2": "VAL_2_environ",
				"KEY_3": "VAL_3_environ",
				"KEY_4": "VAL_4_environ",
			}),

			file: "",
			exp: M{
				"KEY_1": "VAL_1_environ",
				"KEY_2": "VAL_2_environ",
				"KEY_3": "VAL_3_environ",
				"KEY_4": "VAL_4_environ",
			},
		},

		{
			name: "no config file specified + base and cwd .env do not override existing env vals",
			sys: newTestSystem(fstest.MapFS{
				".env": fsFileDotenv(t, M{
					"KEY_1": "VAL_1_env_.env",
					"KEY_2": "VAL_2_env_.env",
					"KEY_3": "VAL_3_env_.env",
				}),
			}).withEnv(M{
				"KEY_1": "VAL_1_environ",
				"KEY_2": "VAL_2_environ",
			}),

			file: "",
			exp: M{
				"KEY_1": "VAL_1_environ",
				"KEY_2": "VAL_2_environ",
				"KEY_3": "VAL_3_env_.env",
			},
		},

		{
			name: "single config file .env",
			sys: newTestSystem(fstest.MapFS{
				"etc": fsDir(),
				"etc/gotrue.env": fsFileDotenv(t, M{
					"KEY_1": "VAL_1_env",
					"KEY_2": "VAL_2_env",
					"KEY_3": "VAL_3_env",
				}),
			}),

			file: "etc/gotrue.env",
			exp: M{
				"KEY_1": "VAL_1_env",
				"KEY_2": "VAL_2_env",
				"KEY_3": "VAL_3_env",
			},
		},

		{
			name: "single config file .env with base environ",
			sys: newTestSystem(fstest.MapFS{
				"etc": fsDir(),
				"etc/gotrue.env": fsFileDotenv(t, M{
					"KEY_1": "VAL_1_env",
					"KEY_2": "VAL_2_env",
					"KEY_3": "VAL_3_env",
				}),
			}).withEnv(M{
				"KEY_1": "VAL_1_environ",
				"KEY_2": "VAL_2_environ",
				"KEY_3": "VAL_3_environ",
				"KEY_4": "VAL_4_environ",
			}),

			file: "etc/gotrue.env",
			exp: M{
				"KEY_1": "VAL_1_env",
				"KEY_2": "VAL_2_env",
				"KEY_3": "VAL_3_env",
				"KEY_4": "VAL_4_environ",
			},
		},

		{
			name: "single config file .env + base and cwd .env is ignored",
			sys: newTestSystem(fstest.MapFS{
				".env": fsFileDotenv(t, M{
					"KEY_1": "VAL_1_env_.env",
					"KEY_2": "VAL_2_env_.env",
					"KEY_3": "VAL_3_env_.env",
					"KEY_9": "VAL_9_env_.env",
				}),
				"etc": fsDir(),
				"etc/gotrue.env": fsFileDotenv(t, M{
					"KEY_3": "VAL_3_env_etc/gotrue.env",
				}),
			}).withEnv(M{
				"KEY_1": "VAL_1_environ",
				"KEY_2": "VAL_2_environ",
			}),

			file: "etc/gotrue.env",
			exp: M{
				"KEY_1": "VAL_1_environ",
				"KEY_2": "VAL_2_environ",
				"KEY_3": "VAL_3_env_etc/gotrue.env",
			},
		},

		{
			name: "single config file .json with base environ",
			sys: newTestSystem(fstest.MapFS{
				"etc": fsDir(),
				"etc/gotrue.json": fsFileJSON(t, M{
					"KEY_1": "VAL_1_json",
					"KEY_2": "VAL_2_json",
					"KEY_3": "VAL_3_json",
				}),
			}).withEnv(M{
				"KEY_1": "VAL_1_environ",
				"KEY_2": "VAL_2_environ",
				"KEY_3": "VAL_3_environ",
				"KEY_4": "VAL_4_environ",
			}),

			file: "etc/gotrue.json",
			exp: M{
				"KEY_1": "VAL_1_json",
				"KEY_2": "VAL_2_json",
				"KEY_3": "VAL_3_json",
				"KEY_4": "VAL_4_environ",
			},
		},

		{
			name: "single config file .env specified with an adjacent .json loads the .env",
			sys: newTestSystem(fstest.MapFS{
				"etc": fsDir(),
				"etc/gotrue.env": fsFileDotenv(t, M{
					"KEY_1": "VAL_1_env",
					"KEY_2": "VAL_2_env",
					"KEY_3": "VAL_3_env",
				}),
				"etc/gotrue.json": fsFileJSON(t, M{
					"KEY_1": "VAL_1_json",
					"KEY_2": "VAL_2_json",
					"KEY_3": "VAL_3_json",
				}),
			}),

			file: "etc/gotrue.env",
			exp: M{
				"KEY_1": "VAL_1_env",
				"KEY_2": "VAL_2_env",
				"KEY_3": "VAL_3_env",
			},
		},

		{
			name: "single config file .json specified with an adjacent .env loads the .json",
			sys: newTestSystem(fstest.MapFS{
				"etc": fsDir(),
				"etc/gotrue.env": fsFileDotenv(t, M{
					"KEY_1": "VAL_1_env",
					"KEY_2": "VAL_2_env",
					"KEY_3": "VAL_3_env",
				}),
				"etc/gotrue.json": fsFileJSON(t, M{
					"KEY_1": "VAL_1_json",
					"KEY_2": "VAL_2_json",
					"KEY_3": "VAL_3_json",
				}),
			}),

			file: "etc/gotrue.json",
			exp: M{
				"KEY_1": "VAL_1_json",
				"KEY_2": "VAL_2_json",
				"KEY_3": "VAL_3_json",
			},
		},

		{
			name: "config file .env + dir copy of same .env",
			sys: newTestSystem(fstest.MapFS{
				"etc": fsDir(),
				"etc/gotrue.env": fsFileDotenv(t, M{
					"KEY_1": "VAL_1_env",
					"KEY_2": "VAL_2_env",
					"KEY_3": "VAL_3_env",
				}),
				"etc/auth.d": fsDir(),
				"etc/auth.d/50_auth.env": fsFileDotenv(t, M{
					"KEY_1": "VAL_1_env",
					"KEY_2": "VAL_2_env",
					"KEY_3": "VAL_3_env",
				}),
			}),

			file: "etc/gotrue.env",
			dir:  "etc/auth.d",
			exp: M{
				"KEY_1": "VAL_1_env",
				"KEY_2": "VAL_2_env",
				"KEY_3": "VAL_3_env",
			},
		},

		{
			name: "config file .env + dir copy ignores dir if no flag present",
			sys: newTestSystem(fstest.MapFS{
				"etc": fsDir(),
				"etc/gotrue.env": fsFileDotenv(t, M{
					"KEY_1": "VAL_1_env",
					"KEY_2": "VAL_2_env",
					"KEY_3": "VAL_3_env",
				}),
				"etc/auth.d": fsDir(),
				"etc/auth.d/50_auth.env": fsFileDotenv(t, M{
					"KEY_1": "VAL_1_env_50_auth.env",
					"KEY_2": "VAL_2_env_50_auth.env",
					"KEY_3": "VAL_3_env_50_auth.env",
				}),
			}),

			file: "etc/gotrue.env",
			exp: M{
				"KEY_1": "VAL_1_env",
				"KEY_2": "VAL_2_env",
				"KEY_3": "VAL_3_env",
			},
		},

		{
			name: "config file .env + dir copy of same .env with base environ",
			sys: newTestSystem(fstest.MapFS{
				"etc": fsDir(),
				"etc/gotrue.env": fsFileDotenv(t, M{
					"KEY_1": "VAL_1_env",
					"KEY_2": "VAL_2_env",
					"KEY_3": "VAL_3_env",
				}),
				"etc/auth.d": fsDir(),
				"etc/auth.d/50_auth.env": fsFileDotenv(t, M{
					"KEY_1": "VAL_1_env",
					"KEY_2": "VAL_2_env",
					"KEY_3": "VAL_3_env",
				}),
			}).withEnv(M{
				"KEY_1": "VAL_1_environ",
				"KEY_2": "VAL_2_environ",
				"KEY_3": "VAL_3_environ",
				"KEY_4": "VAL_4_environ",
			}),

			file: "etc/gotrue.env",
			dir:  "etc/auth.d",
			exp: M{
				"KEY_1": "VAL_1_env",
				"KEY_2": "VAL_2_env",
				"KEY_3": "VAL_3_env",
				"KEY_4": "VAL_4_environ",
			},
		},

		{
			name: "config file .env + dir + base merge behavior",
			sys: newTestSystem(fstest.MapFS{
				"etc": fsDir(),
				"etc/gotrue.env": fsFileDotenv(t, M{
					"KEY_1": "VAL_1_env_etc/gotrue.env",
					"KEY_2": "VAL_2_env_etc/gotrue.env",
				}),
				"etc/auth.d": fsDir(),
				"etc/auth.d/50_auth.env": fsFileDotenv(t, M{
					"KEY_2": "VAL_2_env_etc/auth.d/50_auth.env",
					"KEY_3": "VAL_3_env_etc/auth.d/50_auth.env",
				}),
			}).withEnv(M{
				"KEY_1": "VAL_1_environ",
				"KEY_2": "VAL_2_environ",
				"KEY_3": "VAL_3_environ",
				"KEY_4": "VAL_4_environ",
			}),

			file: "etc/gotrue.env",
			dir:  "etc/auth.d",
			exp: M{
				"KEY_1": "VAL_1_env_etc/gotrue.env",
				"KEY_2": "VAL_2_env_etc/auth.d/50_auth.env",
				"KEY_3": "VAL_3_env_etc/auth.d/50_auth.env",
				"KEY_4": "VAL_4_environ",
			},
		},

		{
			name: "config base + file + dir merge behavior json env mix",
			sys: newTestSystem(fstest.MapFS{
				"etc": fsDir(),
				"etc/gotrue.json": fsFileJSON(t, M{
					"KEY_1": "VAL_1_json_etc/gotrue.json",
					"KEY_2": "VAL_2_json_etc/gotrue.json",
				}),
				"etc/auth.d": fsDir(),
				"etc/auth.d/50_auth.env": fsFileDotenv(t, M{
					"KEY_2": "VAL_2_env_etc/auth.d/50_auth.env",
					"KEY_3": "VAL_3_env_etc/auth.d/50_auth.env",
				}),
			}).withEnv(M{
				"KEY_1": "VAL_1_environ",
				"KEY_2": "VAL_2_environ",
				"KEY_3": "VAL_3_environ",
				"KEY_4": "VAL_4_environ",
			}),

			file: "etc/gotrue.json",
			dir:  "etc/auth.d",
			exp: M{
				"KEY_1": "VAL_1_json_etc/gotrue.json",
				"KEY_2": "VAL_2_env_etc/auth.d/50_auth.env",
				"KEY_3": "VAL_3_env_etc/auth.d/50_auth.env",
				"KEY_4": "VAL_4_environ",
			},
		},

		{
			name: "config base + file + dir merge behavior json env mix",
			sys: newTestSystem(fstest.MapFS{
				"etc": fsDir(),
				"etc/gotrue.env": fsFileDotenv(t, M{
					"KEY_1": "VAL_1_env_etc/gotrue.env",
					"KEY_2": "VAL_2_env_etc/gotrue.env",
				}),
				"etc/auth.d": fsDir(),
				"etc/auth.d/50_auth.json": fsFileJSON(t, M{
					"KEY_2": "VAL_2_json_etc/auth.d/50_auth.json",
					"KEY_3": "VAL_3_json_etc/auth.d/50_auth.json",
				}),
			}).withEnv(M{
				"KEY_1": "VAL_1_environ",
				"KEY_2": "VAL_2_environ",
				"KEY_3": "VAL_3_environ",
				"KEY_4": "VAL_4_environ",
			}),

			file: "etc/gotrue.env",
			dir:  "etc/auth.d",
			exp: M{
				"KEY_1": "VAL_1_env_etc/gotrue.env",
				"KEY_2": "VAL_2_json_etc/auth.d/50_auth.json",
				"KEY_3": "VAL_3_json_etc/auth.d/50_auth.json",
				"KEY_4": "VAL_4_environ",
			},
		},

		{
			name: "config base + dir without file",
			sys: newTestSystem(fstest.MapFS{
				"etc":        fsDir(),
				"etc/auth.d": fsDir(),
				"etc/auth.d/50_auth.json": fsFileJSON(t, M{
					"KEY_1": "VAL_1_json_etc/auth.d/50_auth.json",
					"KEY_2": "VAL_2_json_etc/auth.d/50_auth.json",
					"KEY_3": "VAL_3_json_etc/auth.d/50_auth.json",
				}),
			}).withEnv(M{
				"KEY_1": "VAL_1_environ",
				"KEY_2": "VAL_2_environ",
				"KEY_3": "VAL_3_environ",
				"KEY_4": "VAL_4_environ",
			}),

			dir: "etc/auth.d",
			exp: M{
				"KEY_1": "VAL_1_json_etc/auth.d/50_auth.json",
				"KEY_2": "VAL_2_json_etc/auth.d/50_auth.json",
				"KEY_3": "VAL_3_json_etc/auth.d/50_auth.json",
				"KEY_4": "VAL_4_environ",
			},
		},

		{
			name: "config base + dir with .env and .json files of same name",
			sys: newTestSystem(fstest.MapFS{
				"etc":        fsDir(),
				"etc/auth.d": fsDir(),
				"etc/auth.d/50_auth.env": fsFileDotenv(t, M{
					"KEY_1":                  "VAL_1_env_etc/auth.d/50_auth.env",
					"KEY_SHOULD_NOT_EXIST_1": "VAL_SHOULD_NOT_EXIST_1",
				}),
				"etc/auth.d/50_auth.json": fsFileJSON(t, M{
					"KEY_1": "VAL_1_json_etc/auth.d/50_auth.json",
					"KEY_2": "VAL_2_json_etc/auth.d/50_auth.json",
					"KEY_3": "VAL_3_json_etc/auth.d/50_auth.json",
					"KEY_5": "VAL_5_json_etc/auth.d/50_auth.json",
				}),
			}).withEnv(M{
				"KEY_1": "VAL_1_environ",
				"KEY_2": "VAL_2_environ",
				"KEY_3": "VAL_3_environ",
				"KEY_4": "VAL_4_environ",
			}),

			dir: "etc/auth.d",
			exp: M{
				"KEY_1": "VAL_1_json_etc/auth.d/50_auth.json",
				"KEY_2": "VAL_2_json_etc/auth.d/50_auth.json",
				"KEY_3": "VAL_3_json_etc/auth.d/50_auth.json",
				"KEY_4": "VAL_4_environ",
				"KEY_5": "VAL_5_json_etc/auth.d/50_auth.json",
			},
		},

		{
			name: "config base + dir with multi .env and .json files of same name",
			sys: newTestSystem(fstest.MapFS{
				"etc":        fsDir(),
				"etc/auth.d": fsDir(),
				"etc/auth.d/10_base.env": fsFileDotenv(t, M{
					"KEY_SHOULD_NOT_EXIST_1": "VAL_SHOULD_NOT_EXIST_1",
				}),
				"etc/auth.d/10_base.json": fsFileJSON(t, M{
					"KEY_1": "VAL_1_json_etc/auth.d/10_base.json",
					"KEY_2": "VAL_2_json_etc/auth.d/10_base.json",
					"KEY_4": "VAL_4_json_etc/auth.d/10_base.json",
					"KEY_5": "VAL_5_json_etc/auth.d/10_base.json",
				}),
				"etc/auth.d/50_auth.env": fsFileDotenv(t, M{
					"KEY_SHOULD_NOT_EXIST_2": "VAL_SHOULD_NOT_EXIST_2",
				}),
				"etc/auth.d/50_auth.json": fsFileJSON(t, M{
					"KEY_2": "VAL_2_json_etc/auth.d/50_auth.json",
					"KEY_4": "VAL_4_json_etc/auth.d/50_auth.json",
				}),
				"etc/auth.d/80_override.json": fsFileJSON(t, M{
					"KEY_2": "VAL_2_json_etc/auth.d/80_override.json",
				}),
			}).withEnv(M{
				"KEY_1": "VAL_1_environ",
				"KEY_2": "VAL_2_environ",
				"KEY_3": "VAL_3_environ",
				"KEY_4": "VAL_4_environ",
			}),

			dir: "etc/auth.d",
			exp: M{
				"KEY_1": "VAL_1_json_etc/auth.d/10_base.json",
				"KEY_2": "VAL_2_json_etc/auth.d/80_override.json",
				"KEY_3": "VAL_3_environ",
				"KEY_4": "VAL_4_json_etc/auth.d/50_auth.json",
				"KEY_5": "VAL_5_json_etc/auth.d/10_base.json",
			},
		},

		{
			name: "config base + dir with multi .env and .json files with mixed names",
			sys: newTestSystem(fstest.MapFS{
				"etc":        fsDir(),
				"etc/auth.d": fsDir(),
				"etc/auth.d/10_base.env": fsFileDotenv(t, M{
					"KEY_SHOULD_NOT_EXIST_1": "VAL_SHOULD_NOT_EXIST_1",
				}),
				"etc/auth.d/10_base.json": fsFileJSON(t, M{
					"KEY_1": "VAL_1_json_etc/auth.d/10_base.json",
					"KEY_2": "VAL_2_json_etc/auth.d/10_base.json",
					"KEY_4": "VAL_4_json_etc/auth.d/10_base.json",
					"KEY_5": "VAL_5_json_etc/auth.d/10_base.json",
				}),
				"etc/auth.d/20_extra.env": fsFileDotenv(t, M{
					"KEY_6": "etc/auth.d/20_extra.env",
				}),
				"etc/auth.d/50_auth.env": fsFileDotenv(t, M{
					"KEY_SHOULD_NOT_EXIST_2": "VAL_SHOULD_NOT_EXIST_2",
				}),
				"etc/auth.d/50_auth.json": fsFileJSON(t, M{
					"KEY_2": "VAL_2_json_etc/auth.d/50_auth.json",
					"KEY_4": "VAL_4_json_etc/auth.d/50_auth.json",
				}),
				"etc/auth.d/60_extra.json": fsFileJSON(t, M{
					"KEY_7": "etc/auth.d/60_extra.env",
				}),
				"etc/auth.d/80_override.json": fsFileJSON(t, M{
					"KEY_2": "VAL_2_json_etc/auth.d/80_override.json",
				}),
			}).withEnv(M{
				"KEY_1": "VAL_1_environ",
				"KEY_2": "VAL_2_environ",
				"KEY_3": "VAL_3_environ",
				"KEY_4": "VAL_4_environ",
			}),

			dir: "etc/auth.d",
			exp: M{
				"KEY_1": "VAL_1_json_etc/auth.d/10_base.json",
				"KEY_2": "VAL_2_json_etc/auth.d/80_override.json",
				"KEY_3": "VAL_3_environ",
				"KEY_4": "VAL_4_json_etc/auth.d/50_auth.json",
				"KEY_5": "VAL_5_json_etc/auth.d/10_base.json",
				"KEY_6": "etc/auth.d/20_extra.env",
				"KEY_7": "etc/auth.d/60_extra.env",
			},
		},

		{
			name: "config base + dir with multi .env and .json files and unknown files",
			sys: newTestSystem(fstest.MapFS{
				"etc":        fsDir(),
				"etc/auth.d": fsDir(),
				"etc/auth.d/10_base.env": fsFileDotenv(t, M{
					"KEY_SHOULD_NOT_EXIST_1": "VAL_SHOULD_NOT_EXIST_1",
				}),
				"etc/auth.d/10_base.json": fsFileJSON(t, M{
					"KEY_1": "VAL_1_json_etc/auth.d/10_base.json",
					"KEY_2": "VAL_2_json_etc/auth.d/10_base.json",
					"KEY_4": "VAL_4_json_etc/auth.d/10_base.json",
					"KEY_5": "VAL_5_json_etc/auth.d/10_base.json",
				}),
				"etc/auth.d/20_extra.env": fsFileDotenv(t, M{
					"KEY_6": "etc/auth.d/20_extra.env",
				}),
				"etc/auth.d/50_auth.env": fsFileDotenv(t, M{
					"KEY_SHOULD_NOT_EXIST_2": "VAL_SHOULD_NOT_EXIST_2",
				}),
				"etc/auth.d/50_auth.env.bak": fsFileDotenv(t, M{
					"KEY_SHOULD_NOT_EXIST_3": "VAL_SHOULD_NOT_EXIST_3",
				}),
				"etc/auth.d/50_auth.json": fsFileJSON(t, M{
					"KEY_2": "VAL_2_json_etc/auth.d/50_auth.json",
					"KEY_4": "VAL_4_json_etc/auth.d/50_auth.json",
				}),
				"etc/auth.d/50_auth.json.123": fsFileJSON(t, M{
					"KEY_SHOULD_NOT_EXIST_4": "VAL_SHOULD_NOT_EXIST_4",
				}),
				"etc/auth.d/60_extra.json": fsFileJSON(t, M{
					"KEY_7": "etc/auth.d/60_extra.env",
				}),
				"etc/auth.d/80_override.json": fsFileJSON(t, M{
					"KEY_2": "VAL_2_json_etc/auth.d/80_override.json",
				}),
			}).withEnv(M{
				"KEY_1": "VAL_1_environ",
				"KEY_2": "VAL_2_environ",
				"KEY_3": "VAL_3_environ",
				"KEY_4": "VAL_4_environ",
			}),

			dir: "etc/auth.d",
			exp: M{
				"KEY_1": "VAL_1_json_etc/auth.d/10_base.json",
				"KEY_2": "VAL_2_json_etc/auth.d/80_override.json",
				"KEY_3": "VAL_3_environ",
				"KEY_4": "VAL_4_json_etc/auth.d/50_auth.json",
				"KEY_5": "VAL_5_json_etc/auth.d/10_base.json",
				"KEY_6": "etc/auth.d/20_extra.env",
				"KEY_7": "etc/auth.d/60_extra.env",
			},
		},

		{
			name: "config dir is valid but empty",
			sys: newTestSystem(fstest.MapFS{
				"etc":        fsDir(),
				"etc/auth.d": fsDir(),
			}),

			dir: "etc/auth.d",
			exp: M{},
		},

		{
			name: "config dir is valid but empty still loads env",
			sys: newTestSystem(fstest.MapFS{
				"etc":        fsDir(),
				"etc/auth.d": fsDir(),
			}).withEnv(M{
				"KEY_1": "VAL_1_environ",
				"KEY_2": "VAL_2_environ",
				"KEY_3": "VAL_3_environ",
				"KEY_4": "VAL_4_environ",
			}),

			dir: "etc/auth.d",
			exp: M{
				"KEY_1": "VAL_1_environ",
				"KEY_2": "VAL_2_environ",
				"KEY_3": "VAL_3_environ",
				"KEY_4": "VAL_4_environ",
			},
		},

		{
			name: "config dir is invalid still loads env",
			sys: newTestSystem(fstest.MapFS{
				"etc": fsDir(),
			}).withEnv(M{
				"KEY_1": "VAL_1_environ",
				"KEY_2": "VAL_2_environ",
				"KEY_3": "VAL_3_environ",
				"KEY_4": "VAL_4_environ",
			}),

			dir: "etc/auth.d",
			exp: M{
				"KEY_1": "VAL_1_environ",
				"KEY_2": "VAL_2_environ",
				"KEY_3": "VAL_3_environ",
				"KEY_4": "VAL_4_environ",
			},
		},

		{
			name: "err config file not found",
			sys: newTestSystem(fstest.MapFS{
				"etc": fsDir(),
			}),

			file:   "etc/gotrue.env",
			errStr: "file does not exist",
		},

		// 		{
		// 			name: "does not expand variables",
		// 			sys: newTestSystem(fstest.MapFS{
		// 				"etc": fsDir(),
		// 				"etc/gotrue.env": fsFileDotenv(t, M{
		// 					"KEY_1": "VAL_1_env",
		// 					"KEY_2": "$KEY_2",
		// 					"KEY_3": "VAL_3_env",
		// 				}),
		// 			}),
		//
		// 			file: "etc/gotrue.env",
		// 			exp: M{
		// 				"KEY_1": "VAL_1_env",
		// 				"KEY_2": "$KEY_2",
		// 				"KEY_3": "VAL_3_env",
		// 			},
		// 		},
	}

	for idx, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if testing.Verbose() {
				t.Logf("test #%02d - file(%v) dir(%v) err(%v)",
					idx+1, tt.file, tt.dir, tt.errStr)

				var sb strings.Builder
				sb.WriteString("  exp:\n")
				for _, key := range slices.Sorted(maps.Keys(tt.exp)) {
					str := fmt.Sprintf("    %v=%q\n", key, tt.exp[key])
					sb.WriteString(str)
				}
				t.Logf("%v%v\n", tt.sys.String(), sb.String())
			}

			lr := NewLoader(withSystem(tt.sys))

			cfgMap := make(map[string]string)
			err := lr.startup(cfgMap, tt.file, tt.dir)
			if tt.errStr != "" {
				require.Error(t, err)
				require.Contains(t, err.Error(), tt.errStr)
				return
			}
			require.NoError(t, err)

			require.Equal(t, tt.exp, cfgMap)
			require.Equal(t, tt.exp, tt.sys.env)

			// run reload test if /etc/auth.d is present and tt.dir is set, the
			// result should be identical in any case as long as the fs is
			// not changed as the tt.sys.env is persistent.
			if tt.sys.fs["etc/auth.d"] != nil && tt.dir != "" {
				t.Run("Reload", func(t *testing.T) {
					cfgMap := make(map[string]string)
					err := lr.reload(cfgMap, tt.dir)
					require.NoError(t, err)

					require.Equal(t, tt.exp, tt.sys.env)
				})
			}
		})
	}
}

func TestLoaderReload(t *testing.T) {
	type change struct {
		desc   string
		apply  func(*testSystem)
		exp    M
		errStr string
	}
	type test struct {
		name    string
		sys     *testSystem
		dir     string
		changes []*change
	}

	tests := []test{
		{
			name: "basic scenario covering empty auth.d dir",
			sys: newTestSystem(fstest.MapFS{
				"etc":        fsDir(),
				"etc/auth.d": fsDir(),
			}).withEnv(M{
				"KEY_1": "VAL_1_environ",
				"KEY_2": "VAL_2_environ",
				"KEY_3": "VAL_3_environ",
			}),

			dir: "etc/auth.d",
			changes: []*change{
				{
					desc: "touch only",
					exp: M{
						"KEY_1": "VAL_1_environ",
						"KEY_2": "VAL_2_environ",
						"KEY_3": "VAL_3_environ",
					},
				},
			},
		},

		{
			name: "basic scenario with same .json file",
			sys: newTestSystem(fstest.MapFS{
				"etc":        fsDir(),
				"etc/auth.d": fsDir(),
				"etc/auth.d/50_auth.json": fsFileJSON(t, M{
					"KEY_1": "VAL_1_etc/auth.d/50_auth.json",
					"KEY_2": "VAL_2_etc/auth.d/50_auth.json",
				}),
			}).withEnv(M{
				"KEY_1": "VAL_1_environ",
				"KEY_2": "VAL_2_environ",
				"KEY_3": "VAL_3_environ",
			}),

			dir: "etc/auth.d",
			changes: []*change{
				{
					desc: "touch only",
					exp: M{
						"KEY_1": "VAL_1_etc/auth.d/50_auth.json",
						"KEY_2": "VAL_2_etc/auth.d/50_auth.json",
						"KEY_3": "VAL_3_environ",
					},
				},
			},
		},

		{
			name: "basic scenario which updates a value",
			sys: newTestSystem(fstest.MapFS{
				"etc":        fsDir(),
				"etc/auth.d": fsDir(),
				"etc/auth.d/50_auth.json": fsFileJSON(t, M{
					"KEY_1": "VAL_1_etc/auth.d/50_auth.json",
					"KEY_2": "VAL_2_etc/auth.d/50_auth.json",
				}),
			}).withEnv(M{
				"KEY_1": "VAL_1_environ",
				"KEY_2": "VAL_2_environ",
				"KEY_3": "VAL_3_environ",
			}),

			dir: "etc/auth.d",
			changes: []*change{
				{
					desc: "touch only",
					exp: M{
						"KEY_1": "VAL_1_etc/auth.d/50_auth.json",
						"KEY_2": "VAL_2_etc/auth.d/50_auth.json",
						"KEY_3": "VAL_3_environ",
					},
				},

				{
					desc: "update key 1",
					apply: func(ts *testSystem) {
						ts.fs["etc/auth.d/50_auth.json"] = fsFileJSON(t, M{
							"KEY_1": "VAL_1_etc/auth.d/50_auth.json",
							"KEY_2": "VAL_2_etc/auth.d/50_auth.json_updated",
						})
					},
					exp: M{
						"KEY_1": "VAL_1_etc/auth.d/50_auth.json",
						"KEY_2": "VAL_2_etc/auth.d/50_auth.json_updated",
						"KEY_3": "VAL_3_environ",
					},
				},
			},
		},

		{
			name: "ignored backup and temp files added during reload",
			sys: newTestSystem(fstest.MapFS{
				"etc":        fsDir(),
				"etc/auth.d": fsDir(),
				"etc/auth.d/50_auth.json": fsFileJSON(t, M{
					"KEY_1": "VAL_1_etc/auth.d/50_auth.json",
				}),
			}).withEnv(M{
				"KEY_2": "VAL_2_environ",
			}),

			dir: "etc/auth.d",
			changes: []*change{
				{
					desc: "initial state",
					exp: M{
						"KEY_1": "VAL_1_etc/auth.d/50_auth.json",
						"KEY_2": "VAL_2_environ",
					},
				},
				{
					desc: "add ignored .bak .tmp .toml .yaml files",
					apply: func(ts *testSystem) {
						ts.fs["etc/auth.d/50_auth.env.bak"] = fsFileDotenv(t, M{
							"KEY_SHOULD_NOT_EXIST_1": "VAL_SHOULD_NOT_EXIST_1",
						})
						ts.fs["etc/auth.d/50_auth.json.bak"] = fsFileJSON(t, M{
							"KEY_SHOULD_NOT_EXIST_2": "VAL_SHOULD_NOT_EXIST_2",
						})
						ts.fs["etc/auth.d/60_extra.json.tmp"] = fsFileJSON(t, M{
							"KEY_SHOULD_NOT_EXIST_3": "VAL_SHOULD_NOT_EXIST_3",
						})
						ts.fs["etc/auth.d/70_config.toml"] = fsFile([]byte("key = \"value\"\n"))
						ts.fs["etc/auth.d/71_config.yaml"] = fsFile([]byte("key: value\n"))
					},
					exp: M{
						"KEY_1": "VAL_1_etc/auth.d/50_auth.json",
						"KEY_2": "VAL_2_environ",
					},
				},
			},
		},

		{
			name: "new valid config file added during reload",
			sys: newTestSystem(fstest.MapFS{
				"etc":        fsDir(),
				"etc/auth.d": fsDir(),
			}).withEnv(M{
				"KEY_1": "VAL_1_environ",
			}),

			dir: "etc/auth.d",
			changes: []*change{
				{
					desc: "empty auth.d",
					exp: M{
						"KEY_1": "VAL_1_environ",
					},
				},
				{
					desc: "add new config file",
					apply: func(ts *testSystem) {
						ts.fs["etc/auth.d/50_auth.json"] = fsFileJSON(t, M{
							"KEY_2": "VAL_2_etc/auth.d/50_auth.json",
							"KEY_3": "VAL_3_etc/auth.d/50_auth.json",
						})
					},
					exp: M{
						"KEY_1": "VAL_1_environ",
						"KEY_2": "VAL_2_etc/auth.d/50_auth.json",
						"KEY_3": "VAL_3_etc/auth.d/50_auth.json",
					},
				},
			},
		},

		{
			name: "same-basename .json added beside existing .env",
			sys: newTestSystem(fstest.MapFS{
				"etc":        fsDir(),
				"etc/auth.d": fsDir(),
				"etc/auth.d/50_auth.env": fsFileDotenv(t, M{
					"KEY_1":                  "VAL_1_etc/auth.d/50_auth.env",
					"KEY_2":                  "VAL_2_etc/auth.d/50_auth.env",
					"KEY_ONLY_IN_ENV":        "VAL_ONLY_IN_ENV",
					"KEY_DIFFERENT_IN_FILES": "from_env",
				}),
			}).withEnv(M{
				"KEY_3": "VAL_3_environ",
			}),

			dir: "etc/auth.d",
			changes: []*change{
				{
					desc: "initial .env loaded",
					exp: M{
						"KEY_1":                  "VAL_1_etc/auth.d/50_auth.env",
						"KEY_2":                  "VAL_2_etc/auth.d/50_auth.env",
						"KEY_3":                  "VAL_3_environ",
						"KEY_ONLY_IN_ENV":        "VAL_ONLY_IN_ENV",
						"KEY_DIFFERENT_IN_FILES": "from_env",
					},
				},
				{
					desc: "add same-basename .json which takes precedence",
					apply: func(ts *testSystem) {
						ts.fs["etc/auth.d/50_auth.json"] = fsFileJSON(t, M{
							"KEY_1":                  "VAL_1_etc/auth.d/50_auth.json",
							"KEY_2":                  "VAL_2_etc/auth.d/50_auth.json",
							"KEY_DIFFERENT_IN_FILES": "from_json",
						})
					},
					exp: M{
						"KEY_1":                  "VAL_1_etc/auth.d/50_auth.json",
						"KEY_2":                  "VAL_2_etc/auth.d/50_auth.json",
						"KEY_3":                  "VAL_3_environ",
						"KEY_ONLY_IN_ENV":        "VAL_ONLY_IN_ENV",
						"KEY_DIFFERENT_IN_FILES": "from_json",
					},
				},
			},
		},

		{
			name: "similar but non-identical basenames are not paired",
			sys: newTestSystem(fstest.MapFS{
				"etc":        fsDir(),
				"etc/auth.d": fsDir(),
				"etc/auth.d/50_auth.env": fsFileDotenv(t, M{
					"KEY_1": "VAL_1_etc/auth.d/50_auth.env",
				}),
				"etc/auth.d/50_auth_extra.json": fsFileJSON(t, M{
					"KEY_2": "VAL_2_etc/auth.d/50_auth_extra.json",
				}),
			}),

			dir: "etc/auth.d",
			changes: []*change{
				{
					desc: "both files loaded lexicographically",
					exp: M{
						"KEY_1": "VAL_1_etc/auth.d/50_auth.env",
						"KEY_2": "VAL_2_etc/auth.d/50_auth_extra.json",
					},
				},
			},
		},

		{
			name: "removal does not unset existing environment values",
			sys: newTestSystem(fstest.MapFS{
				"etc":        fsDir(),
				"etc/auth.d": fsDir(),
				"etc/auth.d/50_auth.json": fsFileJSON(t, M{
					"KEY_1": "VAL_1_etc/auth.d/50_auth.json",
					"KEY_2": "VAL_2_etc/auth.d/50_auth.json",
				}),
			}).withEnv(M{
				"KEY_3": "VAL_3_environ",
			}),

			dir: "etc/auth.d",
			changes: []*change{
				{
					desc: "initial state with file",
					exp: M{
						"KEY_1": "VAL_1_etc/auth.d/50_auth.json",
						"KEY_2": "VAL_2_etc/auth.d/50_auth.json",
						"KEY_3": "VAL_3_environ",
					},
				},
				{
					desc: "remove file, keys remain in env",
					apply: func(ts *testSystem) {
						delete(ts.fs, "etc/auth.d/50_auth.json")
					},
					exp: M{
						"KEY_1": "VAL_1_etc/auth.d/50_auth.json",
						"KEY_2": "VAL_2_etc/auth.d/50_auth.json",
						"KEY_3": "VAL_3_environ",
					},
				},
			},
		},

		{
			name: "later files override earlier files",
			sys: newTestSystem(fstest.MapFS{
				"etc":        fsDir(),
				"etc/auth.d": fsDir(),
				"etc/auth.d/10_base.json": fsFileJSON(t, M{
					"KEY_1": "VAL_1_etc/auth.d/10_base.json",
					"KEY_2": "VAL_2_etc/auth.d/10_base.json",
				}),
				"etc/auth.d/50_auth.env": fsFileDotenv(t, M{
					"KEY_2": "VAL_2_etc/auth.d/50_auth.env",
					"KEY_3": "VAL_3_etc/auth.d/50_auth.env",
				}),
				"etc/auth.d/80_override.json": fsFileJSON(t, M{
					"KEY_3": "VAL_3_etc/auth.d/80_override.json",
					"KEY_4": "VAL_4_etc/auth.d/80_override.json",
				}),
			}),

			dir: "etc/auth.d",
			changes: []*change{
				{
					desc: "initial state shows later files win",
					exp: M{
						"KEY_1": "VAL_1_etc/auth.d/10_base.json",
						"KEY_2": "VAL_2_etc/auth.d/50_auth.env",
						"KEY_3": "VAL_3_etc/auth.d/80_override.json",
						"KEY_4": "VAL_4_etc/auth.d/80_override.json",
					},
				},
				{
					desc: "update 80_override, still wins",
					apply: func(ts *testSystem) {
						ts.fs["etc/auth.d/80_override.json"] = fsFileJSON(t, M{
							"KEY_3": "VAL_3_etc/auth.d/80_override.json_updated",
							"KEY_4": "VAL_4_etc/auth.d/80_override.json",
						})
					},
					exp: M{
						"KEY_1": "VAL_1_etc/auth.d/10_base.json",
						"KEY_2": "VAL_2_etc/auth.d/50_auth.env",
						"KEY_3": "VAL_3_etc/auth.d/80_override.json_updated",
						"KEY_4": "VAL_4_etc/auth.d/80_override.json",
					},
				},
			},
		},

		{
			name: "directories inside config dir are ignored",
			sys: newTestSystem(fstest.MapFS{
				"etc":                  fsDir(),
				"etc/auth.d":           fsDir(),
				"etc/auth.d/40_nested": fsDir(),
				"etc/auth.d/40_nested/config.json": fsFileJSON(t, M{
					"KEY_SHOULD_NOT_EXIST": "VAL_SHOULD_NOT_EXIST",
				}),
				"etc/auth.d/50_auth.json": fsFileJSON(t, M{
					"KEY_1": "VAL_1_etc/auth.d/50_auth.json",
				}),
			}),

			dir: "etc/auth.d",
			changes: []*change{
				{
					desc: "nested directory ignored",
					exp: M{
						"KEY_1": "VAL_1_etc/auth.d/50_auth.json",
					},
				},
			},
		},

		{
			name: "invalid JSON followed by valid JSON recovers",
			sys: newTestSystem(fstest.MapFS{
				"etc":        fsDir(),
				"etc/auth.d": fsDir(),
				"etc/auth.d/50_auth.json": fsFileJSON(t, M{
					"KEY_1": "VAL_1_etc/auth.d/50_auth.json",
				}),
			}),

			dir: "etc/auth.d",
			changes: []*change{
				{
					desc: "initial valid state",
					exp: M{
						"KEY_1": "VAL_1_etc/auth.d/50_auth.json",
					},
				},
				{
					desc: "update to invalid JSON",
					apply: func(ts *testSystem) {
						ts.fs["etc/auth.d/50_auth.json"] = fsFile([]byte("{invalid json"))
					},
					errStr: "ReadJSON",
				},
				{
					desc: "fix JSON, reload succeeds",
					apply: func(ts *testSystem) {
						ts.fs["etc/auth.d/50_auth.json"] = fsFileJSON(t, M{
							"KEY_1": "VAL_1_etc/auth.d/50_auth.json_recovered",
							"KEY_2": "VAL_2_etc/auth.d/50_auth.json_recovered",
						})
					},
					exp: M{
						"KEY_1": "VAL_1_etc/auth.d/50_auth.json_recovered",
						"KEY_2": "VAL_2_etc/auth.d/50_auth.json_recovered",
					},
				},
			},
		},

		{
			name: "invalid dotenv followed by valid dotenv recovers",
			sys: newTestSystem(fstest.MapFS{
				"etc":        fsDir(),
				"etc/auth.d": fsDir(),
				"etc/auth.d/50_auth.env": fsFileDotenv(t, M{
					"KEY_1": "VAL_1_etc/auth.d/50_auth.env",
				}),
			}),

			dir: "etc/auth.d",
			changes: []*change{
				{
					desc: "initial valid state",
					exp: M{
						"KEY_1": "VAL_1_etc/auth.d/50_auth.env",
					},
				},
				{
					desc: "update to invalid dotenv",
					apply: func(ts *testSystem) {
						ts.fs["etc/auth.d/50_auth.env"] = fsFile([]byte("KEY=\"unclosed quote\n"))
					},
					errStr: "ReadDotenv",
				},
				{
					desc: "fix dotenv, reload succeeds",
					apply: func(ts *testSystem) {
						ts.fs["etc/auth.d/50_auth.env"] = fsFileDotenv(t, M{
							"KEY_1": "VAL_1_etc/auth.d/50_auth.env_recovered",
							"KEY_2": "VAL_2_etc/auth.d/50_auth.env_recovered",
						})
					},
					exp: M{
						"KEY_1": "VAL_1_etc/auth.d/50_auth.env_recovered",
						"KEY_2": "VAL_2_etc/auth.d/50_auth.env_recovered",
					},
				},
			},
		},

		{
			name: "invalid same-basename .json beside valid .env, then fixed",
			sys: newTestSystem(fstest.MapFS{
				"etc":        fsDir(),
				"etc/auth.d": fsDir(),
				"etc/auth.d/50_auth.env": fsFileDotenv(t, M{
					"KEY_1":           "VAL_1_etc/auth.d/50_auth.env",
					"KEY_ONLY_IN_ENV": "VAL_ONLY_IN_ENV",
				}),
			}),

			dir: "etc/auth.d",
			changes: []*change{
				{
					desc: "initial .env loaded",
					exp: M{
						"KEY_1":           "VAL_1_etc/auth.d/50_auth.env",
						"KEY_ONLY_IN_ENV": "VAL_ONLY_IN_ENV",
					},
				},
				{
					desc: "add invalid same-basename .json",
					apply: func(ts *testSystem) {
						ts.fs["etc/auth.d/50_auth.json"] = fsFile([]byte("{invalid json"))
					},
					errStr: "ReadJSON",
				},
				{
					desc: "fix .json, reload succeeds with .json values",
					apply: func(ts *testSystem) {
						ts.fs["etc/auth.d/50_auth.json"] = fsFileJSON(t, M{
							"KEY_1": "VAL_1_etc/auth.d/50_auth.json",
							"KEY_2": "VAL_2_etc/auth.d/50_auth.json",
						})
					},
					exp: M{
						"KEY_1":           "VAL_1_etc/auth.d/50_auth.json",
						"KEY_2":           "VAL_2_etc/auth.d/50_auth.json",
						"KEY_ONLY_IN_ENV": "VAL_ONLY_IN_ENV",
					},
				},
			},
		},
	}

	for idx, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if testing.Verbose() {
				t.Logf("test #%02d - dir(%v) changes(%v)", idx+1, tt.dir, len(tt.changes))
			}

			lr := NewLoader(withSystem(tt.sys))

			// Run startup, no errors allowed or changes required
			{
				cfgMap := make(map[string]string)
				err := lr.startup(cfgMap, "", tt.dir)
				require.NoError(t, err)
			}

			// apply each change
			for changeIdx, change := range tt.changes {
				for iter := range 3 {
					if testing.Verbose() {
						t.Logf("change #%02d iter #%02d - %v",
							changeIdx+1, iter+1, change.desc)
					}
					if fn := change.apply; fn != nil {
						fn(tt.sys)
					}

					cfgMap := make(map[string]string)
					err := lr.reload(cfgMap, tt.dir)
					if change.errStr != "" {
						require.Error(t, err)
						require.Contains(t, err.Error(), change.errStr)
						continue
					}
					require.NoError(t, err)

					require.Equal(t, change.exp, tt.sys.env)
				}
			}
		})
	}
}

func fsDir() *fstest.MapFile {
	return &fstest.MapFile{
		Mode: 0700 | fs.ModeDir,
	}
}

func fsFile(data []byte) *fstest.MapFile {
	return &fstest.MapFile{
		Mode: 0600,
		Data: data,
	}
}

func fsFileDotenv[T ~map[string]string](t testing.TB, m T) *fstest.MapFile {
	t.Helper()

	str, err := godotenv.Marshal(map[string]string(m))
	require.NoError(t, err)
	return fsFile([]byte(str))
}

func fsFileJSON[T ~map[string]string](t testing.TB, m T) *fstest.MapFile {
	t.Helper()

	data, err := json.MarshalIndent(m, "", "  ")
	require.NoError(t, err)
	return fsFile(data)
}

type testSystem struct {
	fs  fstest.MapFS
	env map[string]string
	err error
}

func newTestSystem(fs fstest.MapFS) *testSystem {
	return &testSystem{
		fs:  fs,
		env: make(map[string]string),
	}
}

func (o *testSystem) withEnv(m M) *testSystem {
	maps.Copy(o.env, m)
	return o
}

func (o *testSystem) String() string {
	var sb strings.Builder

	header := fmt.Sprintf("testSystem:\n  err: %v\n", o.err)
	sb.WriteString(header)

	sb.WriteString("  env:\n")
	for _, key := range slices.Sorted(maps.Keys(o.env)) {
		str := fmt.Sprintf("    %v=%q\n", key, o.env[key])
		sb.WriteString(str)
	}

	sb.WriteString("  fs:\n")
	for _, key := range slices.Sorted(maps.Keys(o.fs)) {
		file := o.fs[key]
		str := fmt.Sprintf("    %v %v (%v bytes)\n",
			file.Mode, key, len(file.Data))
		sb.WriteString(str)
	}
	return sb.String()
}

func (o *testSystem) Open(name string) (fs.File, error) {
	if o.err != nil {
		return nil, o.err
	}
	return o.fs.Open(name)
}

func (o *testSystem) ReadDir(name string) ([]fs.DirEntry, error) {
	if o.err != nil {
		return nil, o.err
	}
	return o.fs.ReadDir(name)
}

func (o *testSystem) ReadFile(name string) ([]byte, error) {
	if o.err != nil {
		return nil, o.err
	}
	return o.fs.ReadFile(name)
}

func (o *testSystem) Environ() []string {
	a := make([]string, 0, len(o.env))
	for k, v := range o.env {
		if k != "" {
			a = append(a, fmt.Sprintf("%v=%v", k, v))
		}
	}
	return a
}

func (o *testSystem) Setenv(key, value string) error {
	if o.err != nil {
		return o.err
	}

	o.env[key] = value
	return nil
}
