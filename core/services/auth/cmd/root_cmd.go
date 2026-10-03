package cmd

import (
	"context"

	"github.com/sirupsen/logrus"
	"github.com/spf13/cobra"
	"github.com/supabase/auth/internal/conf"
	"github.com/supabase/auth/internal/conf/confload"
	"github.com/supabase/auth/internal/observability"
)

var (
	configFile = ""
	watchDir   = ""
)

var rootCmd = cobra.Command{
	Use: "gotrue",
	Run: func(cmd *cobra.Command, args []string) {
		migrate(cmd, args)
		serve(cmd.Context())
	},
}

// RootCommand will setup and return the root command
func RootCommand() *cobra.Command {
	rootCmd.AddCommand(&serveCmd, &migrateCmd, &versionCmd, adminCmd())
	rootCmd.PersistentFlags().StringVarP(&configFile, "config", "c", "", "base configuration file to load")
	rootCmd.PersistentFlags().StringVarP(&watchDir, "config-dir", "d", "", "directory containing a sorted list of config files to watch for changes")
	migrateCmd.Flags().BoolVarP(&migrateVerbose, "verbose", "v", false, "print the name of each migration as it is applied")
	return &rootCmd
}

func loadGlobalConfig(ctx context.Context) *conf.GlobalConfiguration {
	if ctx == nil {
		panic("context must not be nil")
	}

	configLoader := confload.NewLoader()

	config, err := configLoader.Startup(configFile, watchDir)
	if err != nil {
		logrus.Fatalf("Failed to load configuration: %+v", err)
	}

	if err := observability.ConfigureLogging(&config.Logging); err != nil {
		logrus.WithError(err).Error("unable to configure logging")
	}

	if err := observability.ConfigureTracing(ctx, &config.Tracing); err != nil {
		logrus.WithError(err).Error("unable to configure tracing")
	}

	if err := observability.ConfigureMetrics(ctx, &config.Metrics); err != nil {
		logrus.WithError(err).Error("unable to configure metrics")
	}

	if err := observability.ConfigureProfiler(ctx, &config.Profiler); err != nil {
		logrus.WithError(err).Error("unable to configure profiler")
	}
	return config
}

func execWithConfigAndArgs(cmd *cobra.Command, fn func(config *conf.GlobalConfiguration, args []string), args []string) {
	fn(loadGlobalConfig(cmd.Context()), args)
}
