package spec

// TestWriter is an in-memory writer for testing
type TestWriter struct {
	files           map[string]FileSpec
	packages        map[string]PackageSpec
	services        map[string]ServiceSpec
	users           map[string]UserSpec
	groups          map[string]GroupSpec
	kernelParams    map[string]KernelParamSpec
	mounts          map[string]MountSpec
	ports           map[string]PortSpec
	processes       map[string]ProcessSpec
	commands        map[string]CommandSpec
	currentResource string
}

// NewTestWriter creates a new in-memory writer for testing
func NewTestWriter() *TestWriter {
	return &TestWriter{
		files:        make(map[string]FileSpec),
		packages:     make(map[string]PackageSpec),
		services:     make(map[string]ServiceSpec),
		users:        make(map[string]UserSpec),
		groups:       make(map[string]GroupSpec),
		kernelParams: make(map[string]KernelParamSpec),
		mounts:       make(map[string]MountSpec),
		ports:        make(map[string]PortSpec),
		processes:    make(map[string]ProcessSpec),
		commands:     make(map[string]CommandSpec),
	}
}

// WriteHeader is a no-op for test writer
func (w *TestWriter) WriteHeader(comment string) error {
	return nil
}

// StartResource sets the current resource type
func (w *TestWriter) StartResource(resourceType string) error {
	w.currentResource = resourceType
	return nil
}

// Add stores a spec in the appropriate map
func (w *TestWriter) Add(spec interface{}) error {
	switch s := spec.(type) {
	case FileSpec:
		w.files[s.Path] = s
	case PackageSpec:
		w.packages[s.Name] = s
	case ServiceSpec:
		w.services[s.Name] = s
	case UserSpec:
		w.users[s.Username] = s
	case GroupSpec:
		w.groups[s.Name] = s
	case KernelParamSpec:
		w.kernelParams[s.Key] = s
	case MountSpec:
		w.mounts[s.Path] = s
	case PortSpec:
		w.ports[s.Port] = s
	case ProcessSpec:
		w.processes[s.Comm] = s
	case CommandSpec:
		w.commands[s.Command] = s
	}
	return nil
}

// Flush is a no-op for test writer
func (w *TestWriter) Flush() error {
	return nil
}

// Close is a no-op for test writer
func (w *TestWriter) Close() error {
	return nil
}

// GetFileResults returns all file specs
func (w *TestWriter) GetFileResults() map[string]FileSpec {
	return w.files
}

// GetPackageResults returns all package specs
func (w *TestWriter) GetPackageResults() map[string]PackageSpec {
	return w.packages
}

// GetServiceResults returns all service specs
func (w *TestWriter) GetServiceResults() map[string]ServiceSpec {
	return w.services
}

// GetUserResults returns all user specs
func (w *TestWriter) GetUserResults() map[string]UserSpec {
	return w.users
}

// GetGroupResults returns all group specs
func (w *TestWriter) GetGroupResults() map[string]GroupSpec {
	return w.groups
}

// GetKernelParamResults returns all kernel param specs
func (w *TestWriter) GetKernelParamResults() map[string]KernelParamSpec {
	return w.kernelParams
}

// GetMountResults returns all mount specs
func (w *TestWriter) GetMountResults() map[string]MountSpec {
	return w.mounts
}

// GetPortResults returns all port specs
func (w *TestWriter) GetPortResults() map[string]PortSpec {
	return w.ports
}

// GetProcessResults returns all process specs
func (w *TestWriter) GetProcessResults() map[string]ProcessSpec {
	return w.processes
}

// GetCommandResults returns all command specs
func (w *TestWriter) GetCommandResults() map[string]CommandSpec {
	return w.commands
}

// GetResourceCount returns the total number of resources written
func (w *TestWriter) GetResourceCount() int {
	return len(w.files) + len(w.packages) + len(w.services) +
		len(w.users) + len(w.groups) + len(w.kernelParams) +
		len(w.mounts) + len(w.ports) + len(w.processes) +
		len(w.commands)
}
