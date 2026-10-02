// nix/packages/pg-startup-profiler/internal/docker/client.go
package docker

import (
	"bufio"
	"context"
	"fmt"
	"io"
	"time"

	cerrdefs "github.com/containerd/errdefs"
	"github.com/moby/moby/api/pkg/stdcopy"
	"github.com/moby/moby/api/types/container"
	"github.com/moby/moby/client"
)

type Client struct {
	cli *client.Client
}

type ContainerInfo struct {
	ID        string
	CgroupID  uint64
	StartTime time.Time
}

func NewClient() (*Client, error) {
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return nil, fmt.Errorf("failed to create docker client: %w", err)
	}
	return &Client{cli: cli}, nil
}

func (c *Client) Close() error {
	return c.cli.Close()
}

func (c *Client) ImageExists(ctx context.Context, imageName string) (bool, error) {
	_, err := c.cli.ImageInspect(ctx, imageName)
	if err != nil {
		if cerrdefs.IsNotFound(err) {
			return false, nil
		}
		return false, err
	}
	return true, nil
}

func (c *Client) BuildImage(ctx context.Context, dockerfile, contextPath, tag string) error {
	// Implementation for building from Dockerfile
	// Uses docker build API
	return fmt.Errorf("not implemented - use docker build externally")
}

func (c *Client) CreateContainer(ctx context.Context, imageName string, env []string) (*ContainerInfo, error) {
	resp, err := c.cli.ContainerCreate(ctx, client.ContainerCreateOptions{
		Config: &container.Config{
			Image: imageName,
			Env:   env,
		},
		HostConfig: &container.HostConfig{},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create container: %w", err)
	}

	return &ContainerInfo{
		ID: resp.ID,
	}, nil
}

func (c *Client) StartContainer(ctx context.Context, containerID string) (time.Time, error) {
	startTime := time.Now()
	if _, err := c.cli.ContainerStart(ctx, containerID, client.ContainerStartOptions{}); err != nil {
		return time.Time{}, fmt.Errorf("failed to start container: %w", err)
	}
	return startTime, nil
}

func (c *Client) StopContainer(ctx context.Context, containerID string) error {
	timeout := 10
	_, err := c.cli.ContainerStop(ctx, containerID, client.ContainerStopOptions{Timeout: &timeout})
	return err
}

func (c *Client) RemoveContainer(ctx context.Context, containerID string) error {
	_, err := c.cli.ContainerRemove(ctx, containerID, client.ContainerRemoveOptions{Force: true})
	return err
}

func (c *Client) GetContainerCgroupID(ctx context.Context, containerID string) (uint64, error) {
	inspect, err := c.cli.ContainerInspect(ctx, containerID, client.ContainerInspectOptions{})
	if err != nil {
		return 0, err
	}
	// The cgroup path contains the container ID
	// We need to get the cgroup inode for eBPF filtering
	// This is platform-specific and may need adjustment
	_ = inspect
	return 0, fmt.Errorf("cgroup ID extraction not implemented")
}

func (c *Client) StreamLogs(ctx context.Context, containerID string, callback func(line string, timestamp time.Time)) error {
	options := client.ContainerLogsOptions{
		ShowStdout: true,
		ShowStderr: true,
		Follow:     true,
		Timestamps: true,
	}

	reader, err := c.cli.ContainerLogs(ctx, containerID, options)
	if err != nil {
		return err
	}
	defer reader.Close()

	// Docker multiplexes stdout/stderr, need to demux
	pr, pw := io.Pipe()
	go func() {
		stdcopy.StdCopy(pw, pw, reader)
		pw.Close()
	}()

	scanner := bufio.NewScanner(pr)
	for scanner.Scan() {
		line := scanner.Text()
		// Docker prepends timestamp when Timestamps: true
		callback(line, time.Now())
	}

	return scanner.Err()
}

func (c *Client) PullImage(ctx context.Context, imageName string) error {
	reader, err := c.cli.ImagePull(ctx, imageName, client.ImagePullOptions{})
	if err != nil {
		return err
	}
	defer reader.Close()
	io.Copy(io.Discard, reader)
	return nil
}
