package main

import (
	"regexp"
	"strings"
)

var nameRegex = regexp.MustCompile(`^[a-zA-Z0-9 _-]{2,16}$`)

func validateName(raw string) (string, string) {
	name := strings.TrimSpace(raw)
	name = regexp.MustCompile(`\s+`).ReplaceAllString(name, " ")

	if !nameRegex.MatchString(name) {
		return "", "Name must be 2–16 characters (letters, numbers, spaces, hyphens, underscores)"
	}
	return name, ""
}
