package storage

import (
	"database/sql"
	"math"
	"time"
)

type Advisory struct {
	LongWaitDurationSamples int
	Over2WaitingSamples     int
}

type Advisor struct {
	StatsFunc  func() sql.DBStats
	AdviseFunc func(Advisory)
	Interval   time.Duration

	Stats         sql.DBStats
	LastAdvisedAt time.Time

	Iterations int

	WaitDurationSamples []time.Duration
	WaitCountSamples    []int64
}

func (a *Advisor) Start(observeDuration time.Duration) {
	a.setup(observeDuration)

	go func() {
		// after server start the db stats are going to be worse, so ignore that period
		time.Sleep(observeDuration)

		a.Stats = a.StatsFunc()

		for {
			time.Sleep(a.Interval)
			a.loop()
		}
	}()
}

func (a *Advisor) setup(observeDuration time.Duration) {
	nSamples := int(math.Round(observeDuration.Seconds() / a.Interval.Seconds()))

	a.WaitDurationSamples = make([]time.Duration, nSamples)
	a.WaitCountSamples = make([]int64, nSamples)
}

func (a *Advisor) loop() {
	a.Iterations += 1
	if a.Iterations < 0 {
		a.Iterations = 0
	}

	previousStats := a.Stats
	a.Stats = a.StatsFunc()

	a.WaitDurationSamples[a.Iterations%len(a.WaitDurationSamples)] = a.Stats.WaitDuration - previousStats.WaitDuration
	a.WaitCountSamples[a.Iterations%len(a.WaitCountSamples)] = a.Stats.WaitCount - previousStats.WaitCount

	advise := false

	longWaitDurationSamples := 0
	if a.Iterations >= len(a.WaitDurationSamples) {
		for _, sample := range a.WaitDurationSamples {
			if sample >= a.Interval {
				longWaitDurationSamples += 1
			}
		}

		// 1/3 of the observation time was spent waiting for over one sampling interval
		advise = longWaitDurationSamples >= (len(a.WaitDurationSamples) / 3)
	}

	over2WaitingSamples := 0
	if !advise && a.Iterations >= len(a.WaitCountSamples) {
		for _, sample := range a.WaitCountSamples {
			if sample > 2 {
				over2WaitingSamples += 1
			}
		}

		// 1/3 of the observation time we saw more than 2 goroutines waiting for a connection
		advise = over2WaitingSamples >= (len(a.WaitCountSamples) / 3)
	}

	if advise && time.Since(a.LastAdvisedAt) >= time.Hour {
		a.LastAdvisedAt = time.Now()

		a.AdviseFunc(Advisory{
			LongWaitDurationSamples: longWaitDurationSamples,
			Over2WaitingSamples:     over2WaitingSamples,
		})

	}
}
