package utilities

import (
	"context"
	"sync"

	"github.com/bits-and-blooms/bloom/v3"
)

const (
	// hibpHashLength is the length of a hex-encoded SHA1 hash.
	hibpHashLength = 40
	// hibpHashPrefixLength is the length of the hashed password prefix.
	hibpHashPrefixLength = 5
)

type HIBPBloomCache struct {
	sync.RWMutex

	n      uint
	items  uint
	filter *bloom.BloomFilter
}

func NewHIBPBloomCache(n uint, fp float64) *HIBPBloomCache {
	cache := &HIBPBloomCache{
		n:      n,
		filter: bloom.NewWithEstimates(n, fp),
	}

	return cache
}

func (c *HIBPBloomCache) Cap() uint {
	return c.filter.Cap()
}

func (c *HIBPBloomCache) Add(ctx context.Context, prefix []byte, suffixes [][]byte) error {
	c.Lock()
	defer c.Unlock()

	c.items += uint(len(suffixes))

	if c.items > (4*c.n)/5 {
		// clear the filter if 80% full to keep the actual false
		// positive rate low
		c.filter.ClearAll()

		// reduce memory footprint when this happens
		c.filter.BitSet().Compact()

		c.items = uint(len(suffixes))
	}

	var combined [hibpHashLength]byte
	copy(combined[:], prefix)

	for _, suffix := range suffixes {
		copy(combined[hibpHashPrefixLength:], suffix)

		c.filter.Add(combined[:])
	}

	return nil
}

func (c *HIBPBloomCache) Contains(ctx context.Context, prefix, suffix []byte) (bool, error) {
	var combined [hibpHashLength]byte
	copy(combined[:], prefix)
	copy(combined[hibpHashPrefixLength:], suffix)

	c.RLock()
	defer c.RUnlock()

	return c.filter.Test(combined[:]), nil
}
