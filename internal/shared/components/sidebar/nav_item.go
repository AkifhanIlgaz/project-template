package sidebar

import "github.com/a-h/templ"

// IconFunc matches the signature every icon in internal/shared/icons
// compiles down to.
type IconFunc = func() templ.Component

// NavItem is one sidebar link. Attrs is an escape hatch onto the rendered
// <a> — e.g. hx-boost="false" for a link that must leave the boosted
// dashboard shell (see internal/shared/layout.Dashboard).
type NavItem struct {
	Label string
	Href  string
	Icon  IconFunc
	Attrs templ.Attributes
}

// navActive reports whether href is the active route. Exact match only:
// this sidebar's items are sibling pages sharing a common URL prefix (e.g.
// /dashboard and /dashboard/reports), not nested detail pages under a list
// — a prefix match would falsely mark a shorter sibling href (like the
// index page itself) active on every other page beneath the same mount.
func navActive(path, href string) bool {
	return href != "" && path == href
}
