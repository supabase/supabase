package main

import (
	"bufio"
	"errors"
	"fmt"
	"io"
	"strings"
)

type Result struct {
	Msg   string
	Vulns []*Vulnerability
}

type Vulnerability struct {
	ID   string
	Text string
}

var errParse = errors.New("parse error")

type parseState struct {
	lines []string
	pos   int
	res   Result
}

func Parse(r io.Reader) (*Result, error) {
	ps := &parseState{pos: -1}
	sc := bufio.NewScanner(r)
	for sc.Scan() {
		ps.lines = append(ps.lines, sc.Text())
	}
	if err := sc.Err(); err != nil {
		return nil, err
	}
	if err := ps.parse(); err != nil {
		return nil, err
	}
	return &ps.res, nil
}

func (o *parseState) fail(format string, args ...any) error {
	msg := fmt.Sprintf(format, args...)
	return fmt.Errorf("%w; %v [line %v]", errParse, msg, o.pos+1)
}

func (o *parseState) scan() bool {
	o.pos++
	return o.pos < len(o.lines)
}

func (o *parseState) text() string {
	if o.pos < 0 || o.pos >= len(o.lines) {
		// panic("parse control flow error")
		return ""
	}
	return o.lines[o.pos]
}

func (o *parseState) next() (string, bool) {
	next := o.pos + 1
	if next >= len(o.lines) {
		return "", false
	}
	return o.lines[next], true
}

func (o *parseState) parse() error {
	if !o.scan() {
		return o.fail("empty output")
	}
	switch v := o.text(); v {
	case "No vulnerabilities found.":
		if o.scan() {
			return o.fail(
				"success followed by unexpected output: %q", o.text())
		}
		o.res.Msg = v + "\n"
		return nil
	case "=== Symbol Results ===":
		return o.parseSection()
	default:
		return o.fail("unexpected line: %q", o.text())
	}
}

func (o *parseState) parseSection() error {
	if !o.scan() || o.text() != "" {
		return o.fail("section was not followed by blank line")
	}

	var n int
	for o.scan() {
		if err := o.parseVuln(); err != nil {
			return err
		}
		n++
	}
	if n == 0 || len(o.res.Vulns) == 0 {
		return o.fail("section contains no vulns")
	}
	return nil
}

func (o *parseState) parseVuln() error {
	if !startsVuln(o.text()) {
		return o.parseSummary()
	}

	_, id, ok := strings.Cut(o.text(), ": ")
	if !ok || id == "" {
		return o.fail("vuln header invalid: %q", o.text())
	}

	cur := &Vulnerability{ID: id}
	for o.scan() {
		v := o.text()
		switch {
		case v == "" && strings.TrimSpace(cur.Text) == "":
			return o.fail("vuln %q has empty details", cur.ID)
		case v == "":
			next, ok := o.next()
			if !ok || startsVuln(next) || startsSummary(next) {
				o.res.Vulns = append(o.res.Vulns, cur)
				return nil
			}
			cur.Text += "\n"
		case strings.HasPrefix(v, "  "):
			cur.Text += v + "\n"
		default:
			return o.fail("vuln %q has unexpected details: %q", cur.ID, v)
		}
	}
	return o.fail("vuln %q is malformed", cur.ID)
}

func (o *parseState) parseSummary() error {
	for {
		o.res.Msg += o.text() + "\n"
		if !o.scan() {
			return nil
		}
	}
}

func startsVuln(s string) bool {
	return strings.HasPrefix(s, "Vulnerability ")
}

func startsSummary(s string) bool {
	return s != "" && !strings.HasPrefix(s, "  ")
}
