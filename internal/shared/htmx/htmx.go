// Package htmx holds small server-side helpers for reacting to htmx
// requests — redirecting correctly whether a request came from htmx or a
// plain browser, and triggering the toast region (see
// internal/shared/layout) via HX-Trigger. Add more headers/helpers here as
// the app actually needs them (HX-Retarget, HX-Reswap, ...).
package htmx

import (
	"encoding/json"
	"fmt"
	"strings"
	"unicode/utf16"
	"unicode/utf8"

	"github.com/gofiber/fiber/v3"
)

const (
	// HeaderRequest is set by htmx on every request it makes.
	HeaderRequest = "HX-Request"
	// HeaderRedirect tells htmx to navigate the browser to a new URL,
	// instead of swapping the response into the current page.
	HeaderRedirect = "HX-Redirect"
	// HeaderTrigger tells htmx to fire a client-side event (by name, one
	// per JSON key) after this response is swapped in.
	HeaderTrigger = "HX-Trigger"
)

// IsRequest reports whether the current request was made by htmx.
func IsRequest(c fiber.Ctx) bool {
	return c.Get(HeaderRequest) == "true"
}

// Redirect sends the client to location. For an htmx request this sets
// HX-Redirect so the browser does a real navigation — htmx otherwise follows
// a plain 3xx via XHR and swaps the target page's HTML into the current one,
// which renders wrong for a full page like a login screen.
func Redirect(c fiber.Ctx, location string) error {
	if IsRequest(c) {
		c.Set(HeaderRedirect, location)
		return nil
	}

	return c.Redirect().To(location)
}

// ToastVariant picks the toast's color/icon — matches @heroui/styles'
// toast.css modifier classes (.toast--accent/--success/--warning/--danger;
// ToastDefault renders with no modifier, its base/neutral look).
type ToastVariant string

const (
	ToastDefault ToastVariant = "default"
	ToastAccent  ToastVariant = "accent"
	ToastSuccess ToastVariant = "success"
	ToastWarning ToastVariant = "warning"
	ToastDanger  ToastVariant = "danger"
)

// ToastOptions is Toast's payload — Title is required, Description is
// optional (see @heroui/styles' .toast__title/.toast__description).
type ToastOptions struct {
	Title       string
	Description string
	Variant     ToastVariant
}

type toastDetail struct {
	Title       string       `json:"title"`
	Description string       `json:"description,omitempty"`
	Variant     ToastVariant `json:"variant"`
}

// Toast sets HX-Trigger so static/js/toast.js's listener shows opts once
// this response is swapped into the page — works for a plain hx-post/get as
// well as one boosted via internal/shared/layout.Dashboard. Call this
// instead of writing to HX-Trigger directly so a later handler that also
// needs HX-Trigger (e.g. for something else) doesn't silently clobber it —
// there is only one HX-Trigger header per response.
func Toast(c fiber.Ctx, opts ToastOptions) error {
	payload, err := json.Marshal(map[string]toastDetail{
		"toast": {Title: opts.Title, Description: opts.Description, Variant: opts.Variant},
	})
	if err != nil {
		return fmt.Errorf("htmx: marshal toast: %w", err)
	}

	c.Set(HeaderTrigger, escapeNonASCII(payload))

	return nil
}

// escapeNonASCII rewrites every non-ASCII rune in JSON-encoded data as a
// \uXXXX escape — still valid JSON (the browser's JSON.parse decodes it
// back to the original text), but now safe to put in an HTTP header value,
// which the Fetch/XHR spec (and thus htmx reading HX-Trigger) treats as
// Latin-1 bytes. Without this, UTF-8 characters like "ü" or "ş" arrive as
// mojibake ("Ã¼") because their raw UTF-8 bytes get reinterpreted one byte
// at a time as Latin-1 code points.
func escapeNonASCII(data []byte) string {
	var sb strings.Builder
	for _, r := range string(data) {
		if r < utf8.RuneSelf {
			sb.WriteRune(r)
			continue
		}
		if r > 0xFFFF {
			hi, lo := utf16.EncodeRune(r)
			fmt.Fprintf(&sb, `\u%04x\u%04x`, hi, lo)
			continue
		}
		fmt.Fprintf(&sb, `\u%04x`, r)
	}

	return sb.String()
}
