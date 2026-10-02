package godotenv

import (
	"bytes"
	"fmt"
	"os"
	"reflect"
	"strings"
	"testing"
)

var noopPresets = make(map[string]string)

func parseAndCompare(t *testing.T, rawEnvLine string, expectedKey string, expectedValue string) {
	result, err := Unmarshal(rawEnvLine)

	if err != nil {
		t.Errorf("Expected %q to parse as %q: %q, errored %q", rawEnvLine, expectedKey, expectedValue, err)
		return
	}
	if result[expectedKey] != expectedValue {
		t.Errorf("Expected '%v' to parse as '%v' => '%v', got %q instead", rawEnvLine, expectedKey, expectedValue, result)
	}
}

func loadEnvAndCompareValues(t *testing.T, loader func(files ...string) error, envFileName string, expectedValues map[string]string, presets map[string]string) {
	// first up, clear the env
	os.Clearenv()

	for k, v := range presets {
		os.Setenv(k, v)
	}

	err := loader(envFileName)
	if err != nil {
		t.Fatalf("Error loading %v", envFileName)
	}

	for k := range expectedValues {
		envValue := os.Getenv(k)
		v := expectedValues[k]
		if envValue != v {
			t.Errorf("Mismatch for key '%v': expected '%#v' got '%#v'", k, v, envValue)
		}
	}
}

func TestLoadWithNoArgsLoadsDotEnv(t *testing.T) {
	err := Load()
	pathError := err.(*os.PathError)
	if pathError == nil || pathError.Op != "open" || pathError.Path != ".env" {
		t.Errorf("Didn't try and open .env by default")
	}
}

func TestOverloadWithNoArgsOverloadsDotEnv(t *testing.T) {
	err := Overload()
	pathError := err.(*os.PathError)
	if pathError == nil || pathError.Op != "open" || pathError.Path != ".env" {
		t.Errorf("Didn't try and open .env by default")
	}
}

func TestLoadFileNotFound(t *testing.T) {
	err := Load("somefilethatwillneverexistever.env")
	if err == nil {
		t.Error("File wasn't found but Load didn't return an error")
	}
}

func TestOverloadFileNotFound(t *testing.T) {
	err := Overload("somefilethatwillneverexistever.env")
	if err == nil {
		t.Error("File wasn't found but Overload didn't return an error")
	}
}

func TestReadPlainEnv(t *testing.T) {
	envFileName := "fixtures/plain.env"
	expectedValues := map[string]string{
		"OPTION_A": "1",
		"OPTION_B": "2",
		"OPTION_C": "3",
		"OPTION_D": "4",
		"OPTION_E": "5",
		"OPTION_F": "",
		"OPTION_G": "",
		"OPTION_H": "1 2",
	}

	envMap, err := Read(envFileName)
	if err != nil {
		t.Error("Error reading file")
	}

	if len(envMap) != len(expectedValues) {
		t.Error("Didn't get the right size map back")
	}

	for key, value := range expectedValues {
		if envMap[key] != value {
			t.Error("Read got one of the keys wrong")
		}
	}
}

func TestParse(t *testing.T) {
	envMap, err := Parse(bytes.NewReader([]byte("ONE=1\nTWO='2'\nTHREE = \"3\"")))
	expectedValues := map[string]string{
		"ONE":   "1",
		"TWO":   "2",
		"THREE": "3",
	}
	if err != nil {
		t.Fatalf("error parsing env: %v", err)
	}
	for key, value := range expectedValues {
		if envMap[key] != value {
			t.Errorf("expected %s to be %s, got %s", key, value, envMap[key])
		}
	}
}

func TestLoadDoesNotOverride(t *testing.T) {
	envFileName := "fixtures/plain.env"

	// ensure NO overload
	presets := map[string]string{
		"OPTION_A": "do_not_override",
		"OPTION_B": "",
	}

	expectedValues := map[string]string{
		"OPTION_A": "do_not_override",
		"OPTION_B": "",
	}
	loadEnvAndCompareValues(t, Load, envFileName, expectedValues, presets)
}

func TestOverloadDoesOverride(t *testing.T) {
	envFileName := "fixtures/plain.env"

	// ensure NO overload
	presets := map[string]string{
		"OPTION_A": "do_not_override",
	}

	expectedValues := map[string]string{
		"OPTION_A": "1",
	}
	loadEnvAndCompareValues(t, Overload, envFileName, expectedValues, presets)
}

func TestLoadPlainEnv(t *testing.T) {
	envFileName := "fixtures/plain.env"
	expectedValues := map[string]string{
		"OPTION_A": "1",
		"OPTION_B": "2",
		"OPTION_C": "3",
		"OPTION_D": "4",
		"OPTION_E": "5",
		"OPTION_H": "1 2",
	}

	loadEnvAndCompareValues(t, Load, envFileName, expectedValues, noopPresets)
}

func TestLoadExportedEnv(t *testing.T) {
	envFileName := "fixtures/exported.env"
	expectedValues := map[string]string{
		"OPTION_A": "2",
		"OPTION_B": "\\n",
	}

	loadEnvAndCompareValues(t, Load, envFileName, expectedValues, noopPresets)
}

func TestLoadEqualsEnv(t *testing.T) {
	envFileName := "fixtures/equals.env"
	expectedValues := map[string]string{
		"OPTION_A": "postgres://localhost:5432/database?sslmode=disable",
	}

	loadEnvAndCompareValues(t, Load, envFileName, expectedValues, noopPresets)
}

func TestLoadQuotedEnv(t *testing.T) {
	envFileName := "fixtures/quoted.env"
	expectedValues := map[string]string{
		"OPTION_A": "1",
		"OPTION_B": "2",
		"OPTION_C": "",
		"OPTION_D": "\\n",
		"OPTION_E": "1",
		"OPTION_F": "2",
		"OPTION_G": "",
		"OPTION_H": "\n",
		"OPTION_I": "echo 'asd'",
		"OPTION_J": "line 1\nline 2",
		"OPTION_K": "line one\nthis is \\'quoted\\'\none more line",
		"OPTION_L": "line 1\nline 2",
		"OPTION_M": "line one\nthis is \"quoted\"\none more line",
	}

	loadEnvAndCompareValues(t, Load, envFileName, expectedValues, noopPresets)
}

func TestSubstitutions(t *testing.T) {
	envFileName := "fixtures/substitutions.env"
	expectedValues := map[string]string{
		"OPTION_A": "1",
		"OPTION_B": "${OPTION_A}",
		"OPTION_C": "$OPTION_B",
		"OPTION_D": "${OPTION_A}${OPTION_B}",
		"OPTION_E": "${OPTION_NOT_DEFINED}",
	}

	loadEnvAndCompareValues(t, Load, envFileName, expectedValues, noopPresets)
}

func TestExpanding(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected map[string]string
	}{
		{
			"expands variables found in values",
			"FOO=test\nBAR=$FOO",
			map[string]string{"FOO": "test", "BAR": "$FOO"},
		},
		{
			"parses variables wrapped in brackets",
			"FOO=test\nBAR=${FOO}bar",
			map[string]string{"FOO": "test", "BAR": "${FOO}bar"},
		},
		{
			"expands undefined variables to an empty string",
			"BAR=$FOO",
			map[string]string{"BAR": "$FOO"},
		},
		{
			"expands variables in double quoted strings",
			"FOO=test\nBAR=\"quote $FOO\"",
			map[string]string{"FOO": "test", "BAR": "quote $FOO"},
		},
		{
			"does not expand variables in single quoted strings",
			"BAR='quote $FOO'",
			map[string]string{"BAR": "quote $FOO"},
		},
		{
			"does not expand escaped variables",
			`FOO="foo\$BAR"`,
			map[string]string{"FOO": "foo$BAR"},
		},
		{
			"does not expand escaped variables",
			`FOO="foo\${BAR}"`,
			map[string]string{"FOO": "foo${BAR}"},
		},
		{
			"does not expand escaped variables",
			"FOO=test\nBAR=\"foo\\${FOO} ${FOO}\"",
			map[string]string{"FOO": "test", "BAR": "foo${FOO} ${FOO}"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			env, err := Parse(strings.NewReader(tt.input))
			if err != nil {
				t.Errorf("Error: %s", err.Error())
			}
			for k, v := range tt.expected {
				if strings.Compare(env[k], v) != 0 {
					t.Errorf("Expected: %s, Actual: %s", v, env[k])
				}
			}
		})
	}
}

func TestVariableStringValueSeparator(t *testing.T) {
	input := "TEST_URLS=\"stratum+tcp://stratum.antpool.com:3333\nstratum+tcp://stratum.antpool.com:443\""
	want := map[string]string{
		"TEST_URLS": "stratum+tcp://stratum.antpool.com:3333\nstratum+tcp://stratum.antpool.com:443",
	}
	got, err := Parse(strings.NewReader(input))
	if err != nil {
		t.Error(err)
	}

	if len(got) != len(want) {
		t.Fatalf(
			"unexpected value:\nwant:\n\t%#v\n\ngot:\n\t%#v", want, got)
	}

	for k, wantVal := range want {
		gotVal, ok := got[k]
		if !ok {
			t.Fatalf("key %q doesn't present in result", k)
		}
		if wantVal != gotVal {
			t.Fatalf(
				"mismatch in %q value:\nwant:\n\t%s\n\ngot:\n\t%s", k,
				wantVal, gotVal)
		}
	}
}

func TestActualEnvVarsAreLeftAlone(t *testing.T) {
	os.Clearenv()
	os.Setenv("OPTION_A", "actualenv")
	_ = Load("fixtures/plain.env")

	if os.Getenv("OPTION_A") != "actualenv" {
		t.Error("An ENV var set earlier was overwritten")
	}
}

func TestParsing(t *testing.T) {
	// unquoted values
	parseAndCompare(t, "FOO=bar", "FOO", "bar")

	// parses values with spaces around equal sign
	parseAndCompare(t, "FOO =bar", "FOO", "bar")
	parseAndCompare(t, "FOO= bar", "FOO", "bar")

	// parses double quoted values
	parseAndCompare(t, `FOO="bar"`, "FOO", "bar")

	// parses single quoted values
	parseAndCompare(t, "FOO='bar'", "FOO", "bar")

	// parses escaped double quotes
	parseAndCompare(t, `FOO="escaped\"bar"`, "FOO", `escaped"bar`)

	// parses single quotes inside double quotes
	parseAndCompare(t, `FOO="'d'"`, "FOO", `'d'`)

	// parses yaml style options
	parseAndCompare(t, "OPTION_A: 1", "OPTION_A", "1")

	//parses yaml values with equal signs
	parseAndCompare(t, "OPTION_A: Foo=bar", "OPTION_A", "Foo=bar")

	// parses non-yaml options with colons
	parseAndCompare(t, "OPTION_A=1:B", "OPTION_A", "1:B")

	// parses export keyword
	parseAndCompare(t, "export OPTION_A=2", "OPTION_A", "2")
	parseAndCompare(t, `export OPTION_B='\n'`, "OPTION_B", "\\n")
	parseAndCompare(t, "export exportFoo=2", "exportFoo", "2")
	parseAndCompare(t, "exportFOO=2", "exportFOO", "2")
	parseAndCompare(t, "export_FOO =2", "export_FOO", "2")
	parseAndCompare(t, "export.FOO= 2", "export.FOO", "2")
	parseAndCompare(t, "export\tOPTION_A=2", "OPTION_A", "2")
	parseAndCompare(t, "  export OPTION_A=2", "OPTION_A", "2")
	parseAndCompare(t, "\texport OPTION_A=2", "OPTION_A", "2")

	// it 'expands newlines in quoted strings' do
	// expect(env('FOO="bar\nbaz"')).to eql('FOO' => "bar\nbaz")
	parseAndCompare(t, `FOO="bar\nbaz"`, "FOO", "bar\nbaz")

	// it 'parses variables with "." in the name' do
	// expect(env('FOO.BAR=foobar')).to eql('FOO.BAR' => 'foobar')
	parseAndCompare(t, "FOO.BAR=foobar", "FOO.BAR", "foobar")

	// it 'parses variables with several "=" in the value' do
	// expect(env('FOO=foobar=')).to eql('FOO' => 'foobar=')
	parseAndCompare(t, "FOO=foobar=", "FOO", "foobar=")

	// it 'strips unquoted values' do
	// expect(env('foo=bar ')).to eql('foo' => 'bar') # not 'bar '
	parseAndCompare(t, "FOO=bar ", "FOO", "bar")

	// unquoted internal whitespace is preserved
	parseAndCompare(t, `KEY=value value`, "KEY", "value value")

	// it 'ignores inline comments' do
	// expect(env("foo=bar # this is foo")).to eql('foo' => 'bar')
	parseAndCompare(t, "FOO=bar # this is foo", "FOO", "bar")

	// it 'allows # in quoted value' do
	// expect(env('foo="bar#baz" # comment')).to eql('foo' => 'bar#baz')
	parseAndCompare(t, `FOO="bar#baz" # comment`, "FOO", "bar#baz")
	parseAndCompare(t, "FOO='bar#baz' # comment", "FOO", "bar#baz")
	parseAndCompare(t, `FOO="bar#baz#bang" # comment`, "FOO", "bar#baz#bang")

	// it 'parses # in quoted values' do
	// expect(env('foo="ba#r"')).to eql('foo' => 'ba#r')
	// expect(env("foo='ba#r'")).to eql('foo' => 'ba#r')
	parseAndCompare(t, `FOO="ba#r"`, "FOO", "ba#r")
	parseAndCompare(t, "FOO='ba#r'", "FOO", "ba#r")

	//newlines and backslashes should be escaped
	parseAndCompare(t, `FOO="bar\n\ b\az"`, "FOO", "bar\n baz")
	parseAndCompare(t, `FOO="bar\\\n\ b\az"`, "FOO", "bar\\\n baz")
	parseAndCompare(t, `FOO="bar\\r\ b\az"`, "FOO", "bar\\r baz")

	parseAndCompare(t, `="value"`, "", "value")

	// unquoted whitespace around keys should be ignored
	parseAndCompare(t, " KEY =value", "KEY", "value")
	parseAndCompare(t, "   KEY=value", "KEY", "value")
	parseAndCompare(t, "\tKEY=value", "KEY", "value")

	// it 'throws an error if line format is incorrect' do
	// expect{env('lol$wut')}.to raise_error(Dotenv::FormatError)
	badlyFormattedLine := "lol$wut"
	_, err := Unmarshal(badlyFormattedLine)
	if err == nil {
		t.Errorf("Expected \"%v\" to return error, but it didn't", badlyFormattedLine)
	}
}

func TestLinesToIgnore(t *testing.T) {
	cases := map[string]struct {
		input string
		want  string
	}{
		"Line with nothing but line break": {
			input: "\n",
		},
		"Line with nothing but windows-style line break": {
			input: "\r\n",
		},
		"Line full of whitespace": {
			input: "\t\t ",
		},
		"Comment": {
			input: "# Comment",
		},
		"Indented comment": {
			input: "\t # comment",
		},
		"non-ignored value": {
			input: `export OPTION_B='\n'`,
			want:  `export OPTION_B='\n'`,
		},
	}

	for n, c := range cases {
		t.Run(n, func(t *testing.T) {
			got := string(getStatementStart([]byte(c.input)))
			if got != c.want {
				t.Errorf("Expected:\t %q\nGot:\t %q", c.want, got)
			}
		})
	}
}

func TestErrorReadDirectory(t *testing.T) {
	envFileName := "fixtures/"
	envMap, err := Read(envFileName)

	if err == nil {
		t.Errorf("Expected error, got %v", envMap)
	}
}

func TestErrorParsing(t *testing.T) {
	envFileName := "fixtures/invalid1.env"
	envMap, err := Read(envFileName)
	if err == nil {
		t.Errorf("Expected error, got %v", envMap)
	}
}

func TestComments(t *testing.T) {
	envFileName := "fixtures/comments.env"
	expectedValues := map[string]string{
		"foo": "bar",
		"bar": "foo#baz",
		"baz": "foo",
	}

	loadEnvAndCompareValues(t, Load, envFileName, expectedValues, noopPresets)
}

func TestWrite(t *testing.T) {
	writeAndCompare := func(env string, expected string) {
		envMap, _ := Unmarshal(env)
		actual, _ := Marshal(envMap)
		if expected != actual {
			t.Errorf("Expected '%v' (%v) to write as '%v', got '%v' instead.", env, envMap, expected, actual)
		}
	}
	//just test some single lines to show the general idea
	//TestRoundtrip makes most of the good assertions

	//values are always double-quoted
	writeAndCompare(`key=value`, `key="value"`)
	//double-quotes are escaped
	writeAndCompare(`key=va"lu"e`, `key="va\"lu\"e"`)
	//but single quotes are left alone
	writeAndCompare(`key=va'lu'e`, `key="va'lu'e"`)
	// newlines, backslashes, and some other special chars are escaped
	writeAndCompare(`foo="\n\r\\r!"`, `foo="\n\r\\r\!"`)
	// lines should be sorted
	writeAndCompare("foo=bar\nbaz=buzz", "baz=\"buzz\"\nfoo=\"bar\"")
	// integers should not be quoted
	writeAndCompare(`key="10"`, `key=10`)

}

func TestRoundtrip(t *testing.T) {
	fixtures := []string{"equals.env", "exported.env", "plain.env", "quoted.env"}
	for _, fixture := range fixtures {
		fixtureFilename := fmt.Sprintf("fixtures/%s", fixture)
		env, err := readFile(fixtureFilename)
		if err != nil {
			t.Errorf("Expected '%s' to read without error (%v)", fixtureFilename, err)
		}
		rep, err := Marshal(env)
		if err != nil {
			t.Errorf("Expected '%s' to Marshal (%v)", fixtureFilename, err)
		}
		roundtripped, err := Unmarshal(rep)
		if err != nil {
			t.Errorf("Expected '%s' to Mashal and Unmarshal (%v)", fixtureFilename, err)
		}
		if !reflect.DeepEqual(env, roundtripped) {
			t.Errorf("Expected '%s' to roundtrip as '%v', got '%v' instead", fixtureFilename, env, roundtripped)
		}

	}
}

func TestTrailingNewlines(t *testing.T) {
	cases := map[string]struct {
		input string
		key   string
		value string
	}{
		"Simple value without trailing newline": {
			input: "KEY=value",
			key:   "KEY",
			value: "value",
		},
		"Value with internal whitespace without trailing newline": {
			input: "KEY=value value",
			key:   "KEY",
			value: "value value",
		},
		"Value with internal whitespace with trailing newline": {
			input: "KEY=value value\n",
			key:   "KEY",
			value: "value value",
		},
		"YAML style - value with internal whitespace without trailing newline": {
			input: "KEY: value value",
			key:   "KEY",
			value: "value value",
		},
		"YAML style - value with internal whitespace with trailing newline": {
			input: "KEY: value value\n",
			key:   "KEY",
			value: "value value",
		},
	}

	for n, c := range cases {
		t.Run(n, func(t *testing.T) {
			result, err := Unmarshal(c.input)
			if err != nil {
				t.Errorf("Input: %q Unexpected error:\t%q", c.input, err)
			}
			if result[c.key] != c.value {
				t.Errorf("Input %q Expected:\t %q/%q\nGot:\t %q", c.input, c.key, c.value, result)
			}
		})
	}
}
