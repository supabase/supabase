package main

import (
	"crypto/rand"
	"encoding/json"
	"io"
	"time"
)

func mustJSON(v any) ([]byte, error) {
	return json.MarshalIndent(v, "", "  ")
}

func jsonDecode(r io.Reader, v any) error {
	return json.NewDecoder(r).Decode(v)
}

func mintULID() string {
	const enc = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"
	ms := uint64(time.Now().UnixMilli())
	var rnd [10]byte
	_, _ = rand.Read(rnd[:])
	out := make([]byte, 26)
	for i := 9; i >= 0; i-- {
		out[i] = enc[ms&0x1f]
		ms >>= 5
	}
	bit := 0
	for i := 0; i < 16; i++ {
		bidx := bit / 8
		boff := bit % 8
		var v uint16
		if bidx < len(rnd) {
			v = uint16(rnd[bidx]) << 8
		}
		if bidx+1 < len(rnd) {
			v |= uint16(rnd[bidx+1])
		}
		v <<= boff
		idx := (v >> 11) & 0x1f
		out[10+i] = enc[idx]
		bit += 5
	}
	return string(out)
}
