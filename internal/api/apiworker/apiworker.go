package apiworker

import (
	"context"
	"errors"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
	"github.com/supabase/auth/internal/conf"
	"github.com/supabase/auth/internal/indexworker"
	"github.com/supabase/auth/internal/mailer/templatemailer"
	"github.com/supabase/auth/internal/storage"
	"golang.org/x/sync/errgroup"
)

// Worker is a simple background worker for async tasks.
type Worker struct {
	le *logrus.Entry
	tc *templatemailer.Cache
	db *storage.Connection

	// Notifies worker the cfg has been updated.
	cfgCh chan struct{}

	// workMu must be held for calls to Work
	workMu sync.Mutex

	// mu must be held for field access below here
	mu  sync.Mutex
	cfg *conf.GlobalConfiguration
}

// New will return a new *Worker instance.
func New(
	cfg *conf.GlobalConfiguration,
	tc *templatemailer.Cache,
	db *storage.Connection,
	le *logrus.Entry,
) *Worker {
	return &Worker{
		le:    le,
		cfg:   cfg,
		tc:    tc,
		db:    db,
		cfgCh: make(chan struct{}, 1),
	}
}

func (o *Worker) putConfig(cfg *conf.GlobalConfiguration) {
	o.mu.Lock()
	defer o.mu.Unlock()
	o.cfg = cfg
}

func (o *Worker) getConfig() *conf.GlobalConfiguration {
	o.mu.Lock()
	defer o.mu.Unlock()
	return o.cfg
}

// ReloadConfig notifies the worker a new configuration is available.
func (o *Worker) ReloadConfig(cfg *conf.GlobalConfiguration) {
	o.putConfig(cfg)

	select {
	case o.cfgCh <- struct{}{}:
	default:
	}
}

// Work will run background workers.
func (o *Worker) Work(ctx context.Context) error {
	if ok := o.workMu.TryLock(); !ok {
		return errors.New("apiworker: concurrent calls to Work are invalid")
	}
	defer o.workMu.Unlock()

	var (
		eg        errgroup.Group
		notifyTpl = make(chan struct{}, 1)
		notifyDb  = make(chan struct{}, 1)
		notifyIdx = make(chan struct{}, 1)
	)
	eg.Go(func() error {
		return o.configNotifier(ctx, notifyTpl, notifyDb, notifyIdx)
	})
	eg.Go(func() error {
		return o.templateWorker(ctx, notifyTpl)
	})
	eg.Go(func() error {
		return o.dbWorker(ctx, notifyDb)
	})
	eg.Go(func() error {
		return o.indexWorker(ctx, notifyIdx)
	})
	return eg.Wait()
}

func (o *Worker) configNotifier(
	ctx context.Context,
	notifyCh ...chan<- struct{},
) error {
	le := o.le.WithFields(logrus.Fields{
		"worker_type": "apiworker_config_notifier",
	})
	le.Info("apiworker: config notifier started")
	defer le.Info("apiworker: config notifier exited")

	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-o.cfgCh:

			// When we get a config update, notify each worker to wake up
			for _, ch := range notifyCh {
				select {
				case ch <- struct{}{}:
				default:
				}
			}
		}
	}
}

func (o *Worker) dbWorker(ctx context.Context, cfgCh <-chan struct{}) error {
	le := o.le.WithFields(logrus.Fields{
		"worker_type": "apiworker_db_worker",
	})
	le.Info("apiworker: db worker started")
	defer le.Info("apiworker: db worker exited")

	if err := o.db.ApplyConfig(ctx, o.getConfig(), le); err != nil {
		le.WithError(err).Error(
			"failure applying config connection limits to db")
	}

	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-cfgCh:
			if err := o.db.ApplyConfig(ctx, o.getConfig(), le); err != nil {
				le.WithError(err).Error(
					"failure applying config connection limits to db")
			}
		}
	}
}

// templateWorker will periodically reload the templates in the background as
// long as the system remains active.
func (o *Worker) templateWorker(ctx context.Context, cfgCh <-chan struct{}) error {
	le := o.le.WithFields(logrus.Fields{
		"worker_type": "apiworker_template_cache",
	})
	le.Info("apiworker: template cache worker started")
	defer le.Info("apiworker: template cache worker exited")

	// Reload templates right away on Work.
	o.maybeReloadTemplates(ctx, o.getConfig())

	ival := func() time.Duration {
		return max(time.Second, o.getConfig().Mailer.TemplateRetryInterval/4)
	}

	tr := time.NewTicker(ival())
	defer tr.Stop()

	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-cfgCh:
			tr.Reset(ival())
		case <-tr.C:
		}

		// Either ticker fired or we got a config update.
		o.maybeReloadTemplates(ctx, o.getConfig())
	}
}

func (o *Worker) maybeReloadTemplates(
	ctx context.Context,
	cfg *conf.GlobalConfiguration,
) {
	if cfg.Mailer.TemplateReloadingEnabled {
		o.tc.Reload(ctx, cfg)
	}
}

func (o *Worker) indexWorker(ctx context.Context, cfgCh <-chan struct{}) error {
	le := o.le.WithFields(logrus.Fields{
		"worker_type": "apiworker_index_worker",
	})
	le.Info("apiworker: index worker started")
	defer le.Info("apiworker: index worker exited")

	o.maybeCreateIndexes(ctx, o.getConfig(), le)

	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-cfgCh:
			o.maybeCreateIndexes(ctx, o.getConfig(), le)
		}
	}
}

func (o *Worker) maybeCreateIndexes(
	ctx context.Context,
	cfg *conf.GlobalConfiguration,
	le *logrus.Entry,
) {
	if cfg.IndexWorker.EnsureUserSearchIndexesExist || cfg.IndexWorker.MaxUsersThreshold > 0 {
		err := indexworker.CreateIndexes(ctx, cfg, le)
		if err != nil && !errors.Is(err, indexworker.ErrAdvisoryLockAlreadyAcquired) && !errors.Is(err, indexworker.ErrOrioleDBUnsupported) {
			le.WithError(err).Error("Failed to create indexes")
		}
	}
}
