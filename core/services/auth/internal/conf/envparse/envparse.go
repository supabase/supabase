// Package envparse is a fork of the github.com/joho/godotenv parser.
//
// This fork is based on master which has some minor fixes[1] since the v1.5.1
// we previously used.
//
// [1] https://github.com/joho/godotenv/compare/v1.5.1...main
//
// -------
//
// # Copyright (c) 2013 John Barton
//
// # MIT License
//
// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to
// the following conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
package envparse

import (
	"bytes"
	"errors"
	"io"
	"strings"
	"unicode"
)

// Parse reads an env file from io.Reader, returning a map of keys and values.
func Parse(r io.Reader) (map[string]string, error) {
	data, err := io.ReadAll(r)
	if err != nil {
		return nil, err
	}
	return ParseData(data)
}

// ParseData is like Parse but works on a string or []byte slice.
func ParseData[T ~string | ~[]byte](data T) (map[string]string, error) {
	buf := []byte(data)
	if _, ok := any(data).([]byte); ok {
		// since we use data as scratch space
		buf = bytes.Clone(buf)
	}
	return parseData(buf)
}

// parseData will mutate data during parsing, use ParseData to avoid this.
func parseData(data []byte) (map[string]string, error) {
	out := make(map[string]string)
	if err := parseBytes([]byte(data), out); err != nil {
		return nil, err
	}
	return out, nil
}

const (
	charComment       = '#'
	prefixSingleQuote = '\''
	prefixDoubleQuote = '"'

	exportPrefix = "export"
)

func parseBytes(src []byte, out map[string]string) error {
	src = bytes.ReplaceAll(src, []byte("\r\n"), []byte("\n"))
	cutset := src
	for {
		cutset = getStatementStart(cutset)
		if cutset == nil {
			// reached end of file
			break
		}

		key, left, err := locateKeyName(cutset)
		if err != nil {
			return err
		}

		value, left, err := extractVarValue(left)
		if err != nil {
			return err
		}

		out[key] = value
		cutset = left
	}

	return nil
}

// getStatementPosition returns position of statement begin.
//
// It skips any comment line or non-whitespace character.
func getStatementStart(src []byte) []byte {
	pos := indexOfNonSpaceChar(src)
	if pos == -1 {
		return nil
	}

	src = src[pos:]
	if src[0] != charComment {
		return src
	}

	// skip comment section
	pos = bytes.IndexFunc(src, isCharFunc('\n'))
	if pos == -1 {
		return nil
	}

	return getStatementStart(src[pos:])
}

// locateKeyName locates and parses key name and returns rest of slice
func locateKeyName(src []byte) (key string, cutset []byte, err error) {
	// trim "export" and space at beginning
	src = bytes.TrimLeftFunc(src, isSpace)
	if bytes.HasPrefix(src, []byte(exportPrefix)) {
		trimmed := bytes.TrimPrefix(src, []byte(exportPrefix))
		if bytes.IndexFunc(trimmed, isSpace) == 0 {
			src = bytes.TrimLeftFunc(trimmed, isSpace)
		}
	}

	// locate key name end and validate it in single loop
	offset := 0
loop:
	for i, char := range src {
		rchar := rune(char)
		if isSpace(rchar) {
			continue
		}

		switch char {
		case '=', ':':
			// library also supports yaml-style value declaration
			key = string(src[0:i])
			offset = i + 1
			break loop
		case '_':
		default:
			// variable name should match [A-Za-z0-9_.]
			if unicode.IsLetter(rchar) || unicode.IsNumber(rchar) || rchar == '.' {
				continue
			}
			return "", nil, errors.New("unexpected character in variable name")
		}
	}

	if len(src) == 0 {
		return "", nil, errors.New("zero length string")
	}

	// trim whitespace
	key = strings.TrimRightFunc(key, unicode.IsSpace)
	cutset = bytes.TrimLeftFunc(src[offset:], isSpace)
	return key, cutset, nil
}

// expandDollarEscapes preserves godotenvs dollar escaping.
func expandDollarEscapes(src []byte) []byte {
	var n int
	for r := 0; r < len(src); r++ {
		if src[r] != '$' {
			src[n] = src[r]
			n++
			continue
		}

		if n > 0 && src[n-1] == '\\' {
			n--
		}

		src[n] = '$'
		n++
	}
	return src[:n]
}

// extractVarValue extracts variable value and returns rest of slice.
func extractVarValue(src []byte) (value string, rest []byte, err error) {
	quote, hasPrefix := hasQuotePrefix(src)
	if !hasPrefix {
		// unquoted value - read until end of line
		endOfLine := bytes.IndexFunc(src, isLineEnd)

		// Hit EOF without a trailing newline
		if endOfLine == -1 {
			endOfLine = len(src)

			if endOfLine == 0 {
				return "", nil, nil
			}
		}

		// Convert line to rune away to do accurate countback of runes
		line := []rune(string(src[0:endOfLine]))

		// Assume end of line is end of var
		endOfVar := len(line)
		if endOfVar == 0 {
			return "", src[endOfLine:], nil
		}

		// Strip trailing comments only when '#' is preceded by whitespace:
		// FOO=bar # comment => "bar"
		// FOO=bar#baz       => "bar#baz"
		// FOO=#bar          => "#bar"
		for i := 1; i < endOfVar; i++ {
			if line[i] == charComment && isSpace(line[i-1]) {
				endOfVar = i
				break
			}
		}

		trimmed := []byte(strings.TrimFunc(string(line[0:endOfVar]), isSpace))
		return string(expandDollarEscapes(trimmed)), src[endOfLine:], nil
	}

	// lookup quoted string terminator
	for i := 1; i < len(src); i++ {
		if src[i] != quote {
			continue
		}
		if isEscaped(src, i) {
			continue
		}

		valueBytes := src[1:i]
		if quote == prefixDoubleQuote {
			valueBytes = expandEscapes(valueBytes)
			valueBytes = expandDollarEscapes(valueBytes)
		}

		value = string(valueBytes)
		return value, src[i+1:], nil
	}
	return "", nil, errors.New("unterminated quoted value")
}

func isEscaped(src []byte, index int) bool {
	var n int
	for i := index - 1; i >= 0 && src[i] == '\\'; i-- {
		n++
	}
	return n%2 == 1
}

func expandEscapes(src []byte) []byte {
	var n int
	for r := 0; r < len(src); r++ {
		if src[r] != '\\' || r+1 >= len(src) {
			src[n] = src[r]
			n++
			continue
		}

		r++
		switch src[r] {
		case 'n':
			src[n] = '\n'
		case 'r':
			src[n] = '\r'
		case '$':
			// TODO(cstockton): We keep '$' here for stricter compat with todays
			// config. If we want to be more strict (e.g. \$ -> \$) we can emit
			// the additional \\ as well.
			src[n] = '$'
		default:
			// Preserve upstream godotenv behavior for non-dollar escapes:
			// \" => ", \\ => \, \x => x.
			src[n] = src[r]
		}
		n++
	}
	return src[:n]
}

func indexOfNonSpaceChar(src []byte) int {
	return bytes.IndexFunc(src, func(r rune) bool {
		return !unicode.IsSpace(r)
	})
}

// hasQuotePrefix reports whether charset starts with single or double quote and returns quote character
func hasQuotePrefix(src []byte) (prefix byte, isQuoted bool) {
	if len(src) == 0 {
		return 0, false
	}

	switch prefix := src[0]; prefix {
	case prefixDoubleQuote, prefixSingleQuote:
		return prefix, true
	default:
		return 0, false
	}
}

func isCharFunc(char rune) func(rune) bool {
	return func(v rune) bool {
		return v == char
	}
}

// isSpace reports whether the rune is a space character but not line break character
//
// this differs from unicode.IsSpace, which also applies line break as space
func isSpace(r rune) bool {
	switch r {
	case '\t', '\v', '\f', '\r', ' ', 0x85, 0xA0:
		return true
	}
	return false
}

func isLineEnd(r rune) bool {
	if r == '\n' || r == '\r' {
		return true
	}
	return false
}
