package spec

// FileSpec represents a GOSS file resource
type FileSpec struct {
	Path     string   `yaml:"-" json:"-"`
	Exists   bool     `yaml:"exists" json:"exists"`
	Mode     string   `yaml:"mode,omitempty" json:"mode,omitempty"`
	Owner    string   `yaml:"owner,omitempty" json:"owner,omitempty"`
	Group    string   `yaml:"group,omitempty" json:"group,omitempty"`
	Filetype string   `yaml:"filetype,omitempty" json:"filetype,omitempty"`
	Contains []string `yaml:"contains,omitempty" json:"contains,omitempty"`
}

// PackageSpec represents a GOSS package resource
type PackageSpec struct {
	Name      string   `yaml:"-" json:"-"`
	Installed bool     `yaml:"installed" json:"installed"`
	Versions  []string `yaml:"versions,omitempty" json:"versions,omitempty"`
}

// ServiceSpec represents a GOSS service resource
type ServiceSpec struct {
	Name    string `yaml:"-" json:"-"`
	Enabled bool   `yaml:"enabled" json:"enabled"`
	Running bool   `yaml:"running" json:"running"`
}

// UserSpec represents a GOSS user resource
type UserSpec struct {
	Username string   `yaml:"-" json:"-"`
	Exists   bool     `yaml:"exists" json:"exists"`
	UID      int      `yaml:"uid" json:"uid"`
	GID      int      `yaml:"gid" json:"gid"`
	Groups   []string `yaml:"groups,omitempty" json:"groups,omitempty"`
	Home     string   `yaml:"home,omitempty" json:"home,omitempty"`
	Shell    string   `yaml:"shell,omitempty" json:"shell,omitempty"`
}

// GroupSpec represents a GOSS group resource
type GroupSpec struct {
	Name   string `yaml:"-" json:"-"`
	Exists bool   `yaml:"exists" json:"exists"`
	GID    int    `yaml:"gid" json:"gid"`
}

// KernelParamSpec represents a GOSS kernel-param resource
type KernelParamSpec struct {
	Key   string `yaml:"-" json:"-"`
	Value string `yaml:"value" json:"value"`
}

// MountSpec represents a GOSS mount resource
type MountSpec struct {
	Path       string   `yaml:"-" json:"-"`
	Exists     bool     `yaml:"exists" json:"exists"`
	Filesystem string   `yaml:"filesystem,omitempty" json:"filesystem,omitempty"`
	Opts       []string `yaml:"opts,omitempty" json:"opts,omitempty"`
	Source     string   `yaml:"source,omitempty" json:"source,omitempty"`
	Usage      int      `yaml:"usage,omitempty" json:"usage,omitempty"`
}

// PortSpec represents a GOSS port resource
type PortSpec struct {
	Port      string   `yaml:"-" json:"-"`
	Listening bool     `yaml:"listening" json:"listening"`
	IP        []string `yaml:"ip,omitempty" json:"ip,omitempty"`
}

// ProcessSpec represents a GOSS process resource
type ProcessSpec struct {
	Comm    string `yaml:"-" json:"-"`
	Running bool   `yaml:"running" json:"running"`
}

// CommandSpec represents a GOSS command resource
type CommandSpec struct {
	Command  string `yaml:"-" json:"-"`
	ExitCode int    `yaml:"exit-status" json:"exit-status"`
	Stdout   string `yaml:"stdout,omitempty" json:"stdout,omitempty"`
	Stderr   string `yaml:"stderr,omitempty" json:"stderr,omitempty"`
}
