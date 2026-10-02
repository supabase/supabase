package main

import (
	"context"
	"embed"
	"os/signal"
	"sync"
	"syscall"
	"time"

	"github.com/sirupsen/logrus"
	"github.com/supabase/auth/cmd"
	"github.com/supabase/auth/internal/observability"
)

//go:embed migrations/*
var embeddedMigrations embed.FS

func init() {
	logrus.SetFormatter(&logrus.JSONFormatter{})
}

func main() {
	cmd.EmbeddedMigrations = embeddedMigrations

	execCtx, execCancel := signal.NotifyContext(context.Background(), syscall.SIGTERM, syscall.SIGHUP, syscall.SIGINT)
	defer execCancel()

	go func() {
		<-execCtx.Done()
		logrus.Info("received graceful shutdown signal")
	}()

	// command is expected to obey the cancellation signal on execCtx and
	// block while it is running
	if err := cmd.RootCommand().ExecuteContext(execCtx); err != nil {
		logrus.WithError(err).Fatal(err)
	}

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), time.Minute)
	defer shutdownCancel()

	var wg sync.WaitGroup

	wg.Add(1)
	go func() {
		defer wg.Done()

		// wait for profiler, metrics and trace exporters to shut down gracefully
		observability.WaitForCleanup(shutdownCtx)
	}()

	cleanupDone := make(chan struct{})
	go func() {
		defer close(cleanupDone)
		wg.Wait()
	}()

	select {
	case <-shutdownCtx.Done():
		// cleanup timed out
		return

	case <-cleanupDone:
		// cleanup finished before timing out
		return
	}
}
