package views

import (
	"github.com/AkifhanIlgaz/project-template/internal/shared/components/sidebar"
	"github.com/AkifhanIlgaz/project-template/internal/shared/icons"
	"github.com/AkifhanIlgaz/project-template/internal/shared/layout"
	"github.com/a-h/templ"
)

const appName = "Project Template"

// navItems is the sidebar's demo link list — flat, plain links only. These
// routes exist only to exercise the sidebar/navbar shell end to end — swap
// them for the app's real pages.
var navItems = []sidebar.NavItem{
	{Label: "Panel", Href: "/dashboard", Icon: icons.LayoutDashboard},
	{Label: "Raporlar", Href: "/dashboard/reports", Icon: icons.ChartColumn},
	{Label: "Siparişler", Href: "/dashboard/orders", Icon: icons.ShoppingCart},
	{Label: "Bekleyen Siparişler", Href: "/dashboard/orders/pending", Icon: icons.Clock},
	{Label: "Müşteriler", Href: "/dashboard/customers", Icon: icons.Users},
}

// footerItems renders below navItems, above the always-present Çıkış yap
// button (see layout.Dashboard) — account-level pages rather than app
// navigation. Profilim opts out of the boosted partial-content navigation
// (hx-boost="false") since /me is a different page shell (layout.Base),
// not another page inside this dashboard shell.
var footerItems = []sidebar.NavItem{
	{Label: "Profilim", Href: "/me", Icon: icons.User, Attrs: templ.Attributes{"hx-boost": "false"}},
	{Label: "Ayarlar", Href: "/dashboard/settings", Icon: icons.Settings},
}

func dashboardCrumbs() []layout.Crumb {
	return []layout.Crumb{{Label: "Panel"}}
}
