package utilities

import (
	"io"

	"github.com/sirupsen/logrus"
)

func SafeClose(closer io.Closer) {
	if err := closer.Close(); err != nil {
		logrus.WithError(err).Warn("Close operation failed")
	}
}
