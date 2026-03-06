package main

import "testing"

func TestValidateNameAccepts(t *testing.T) {
	cases := []struct {
		input string
		want  string
	}{
		{"Alice", "Alice"},
		{"ab", "ab"},
		{"Hello World", "Hello World"},
		{"player-1", "player-1"},
		{"under_score", "under_score"},
		{"  padded  ", "padded"},
		{"multi   space", "multi space"},
	}
	for _, tc := range cases {
		name, errMsg := validateName(tc.input)
		if errMsg != "" {
			t.Errorf("validateName(%q) rejected: %s", tc.input, errMsg)
			continue
		}
		if name != tc.want {
			t.Errorf("validateName(%q) = %q, want %q", tc.input, name, tc.want)
		}
	}
}

func TestValidateNameRejects(t *testing.T) {
	cases := []string{
		"",
		"a",
		"12345678901234567",  // 17 chars
		"no!special",
		"<script>",
	}
	for _, input := range cases {
		_, errMsg := validateName(input)
		if errMsg == "" {
			t.Errorf("validateName(%q) should have been rejected", input)
		}
	}
}
