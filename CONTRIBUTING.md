# Katkı Rehberi

Bu dosya, bu repo'yu template olarak kullanan projelerde tutarlılığı korumak
için izlenen konvansiyonları anlatır. Amaç, bir feature'a bakan herkesin
(insan ya da AI) diğer feature'lardan tanıdığı bir iskeletle karşılaşması.

Go koduna özgü genel kurallar (hata yönetimi, isimlendirme, testler vb.)
`samber/cc-skills-golang` skill setinden gelir — bkz. `CLAUDE.md`. Burada
sadece bu repo'ya özgü sapmalar ve örüntüler var.

## Dizin yapısı

```
internal/
  config/            Tek bir Config struct'ı, Viper ile yüklenir
  features/<name>/   İş mantığı — bir feature bir dizin
  platform/          Altyapı: mongo, redis/session, csrf, logging
  shared/            Feature'lar arası paylaşılan HTTP/UI katmanı
```

- **`internal/features/<name>`** bir kullanıcı-görünür özelliktir (auth,
  dashboard, home, user). Kendi `Handler`'ını, route'larını ve varsa
  `views/`'ini barındırır. Feature'lar birbirini import edebilir (ör. `auth`
  `user`'ı import eder) ama `platform`/`shared` asla bir feature'ı import
  etmez — bağımlılık tek yönlü akar: `features → platform`/`shared`.
- **`internal/platform`** dış sistemlere bağlanan altyapı kodu — Mongo
  client'ı, Redis tabanlı session store, CSRF, logging. Hiçbir iş mantığı
  içermez, hiçbir feature'a referans vermez.
- **`internal/shared`** feature'lar arasında paylaşılan HTTP/UI yardımcıları
  — layout, middleware (auth guard'ları), htmx helper'ları, vendored HeroUI
  component'leri, ikonlar, `utils.Cn`. Bir şey iki feature'da aynı şekilde
  tekrar ediyorsa buraya taşınır.

## Yeni bir feature eklemek

`internal/features/dashboard` en güncel ve en dolu örnek — yeni bir feature
eklerken şablon olarak ona bakın. Asgari iskelet:

```
internal/features/<name>/
  <name>_handler.go       # Handler struct'ı + RegisterRoutes + route metodları
  views/
    <page>.templ          # Sayfa/parça şablonları
    <page>_templ.go        # templ generate çıktısı (elle düzenlenmez)
```

Handler kalıbı her feature'da aynı şekle sahip (bkz.
`internal/features/home/home_handler.go`,
`internal/features/dashboard/dashboard_handler.go`):

```go
type Handler struct{ /* bağımlılıklar: repository, vs. */ }

func NewHandler(/* deps */) *Handler {
	return &Handler{ /* ... */ }
}

func (h *Handler) RegisterRoutes(app *fiber.App) {
	app.Get("/foo", h.Foo)
}

func (h *Handler) Foo(c fiber.Ctx) error {
	// ...
	return render(c, views.Foo(...))
}

func render(c fiber.Ctx, component templ.Component) error {
	c.Set(fiber.HeaderContentType, fiber.MIMETextHTMLCharsetUTF8)
	return component.Render(c.Context(), c.Response().BodyWriter())
}
```

Sonra `cmd/server/main.go`'da handler'ı kurup `RegisterRoutes(app)`'i
çağırın — diğer feature'ların yanına, alfabetik sırayı bozmadan ekleyin.

Korumalı (login gerektiren) route grupları için
`internal/shared/middleware.AuthenticatedLayout(roles...)` kullanılır;
login/register gibi sadece anonim kullanıcıya açık sayfalar için
`middleware.UnauthenticatedLayout()`. Yeni bir guard türü gerekiyorsa aynı
pakete, aynı isimlendirme kalıbıyla (`<Durum>Layout`) eklenir.

Feature domain mantığı (repository, domain tipleri, sentinel error'lar) HTTP
katmanından ayrı dosyalara bölünür — bkz. `internal/features/user`:
`user_domain.go` (tip), `user_repository.go` (Mongo repository arayüzü +
implementasyonu), `user_errors.go` (sentinel error'lar).

## Dosya isimlendirme

- **Feature dosyaları her zaman feature adıyla prefix'lenir**:
  `user_repository.go`, `user_domain.go`, `user_errors.go`,
  `dashboard_handler.go`. Bu, aynı isimli dosyaların (`repository.go`,
  `errors.go`) farklı feature'larda IDE sekmelerinde ayırt edilemez hale
  gelmesini önler.
- **`.templ` dosyaları snake_case**, paket adı ise dizin adıyla birebir aynı
  ve tek kelime/lowercase (`closebutton`, `alertdialog`, `statusicon`) —
  Go'nun paket isimlendirme kuralına uyar, dosya adı ise okunabilirlik için
  snake_case kalır: `close_button.templ` → paket `closebutton`.
- **`_templ.go` dosyaları elle düzenlenmez** — `templ generate` çıktısıdır,
  her `.templ` değişikliğinden sonra yeniden üretilir (bkz. aşağıdaki
  "templ generate" bölümü).
- **İkonlar** `internal/shared/icons/icon_<isim>.templ` olarak eklenir, tek
  bir `templ <PascalCase>()` fonksiyonu içerir ve mümkün olduğunca
  [lucide.dev](https://lucide.dev)'den birebir kopyalanır (bkz.
  `icon_menu.templ`'in yorumu) — tutarlı bir ikon seti için.

## Component kullanımı (vendored HeroUI)

`internal/shared/components/` altındaki her component, HeroUI v3'ün React
API'sinin templ karşılığı — [heroui-go kaynağından](https://github.com)
vendorlanmış (bkz. proje hafızasındaki `reference_heroui_go_source`).
Kalıp:

```go
type Props struct {
	Variant Variant         // varsa, default değer yorum satırında belirtilir
	Size    Size            // varsa
	Attrs   templ.Attributes // htmx/aria/data-* gibi ek attribute'lar için
}
```

Kullanım örneği (tek parçalı component, `button`):

```templ
@button.Button(button.Props{
	Variant: button.VariantDanger,
	Size:    button.SizeSm,
	Attrs:   templ.Attributes{"hx-post": "/dashboard/settings", "hx-swap": "none"},
}) {
	Kaydet
}
```

Compound (çok parçalı) component'lerde (`card`, `alertdialog`) her parça
kendi `templ` fonksiyonu olarak dışa açılır ve iç içe kullanılır — anatomi
her component dosyasının başındaki yorumda belgelenir:

```templ
@card.Card(card.Props{}) {
	@card.Header() {
		@card.Title() { Başlık }
		@card.Description() { Açıklama }
	}
	@card.Footer() { ... }
}
```

Ek Tailwind sınıfı eklemek gerektiğinde çoğu `Props`'suz fonksiyon (`Footer`,
`Card`) değişken sayıda `tw ...string` parametresi alır:
`card.Footer("flex-wrap gap-2")`.

**Yeni bir component vendorlarken:**

1. heroui-go'daki kaynağı bul, aynı dosya/paket isimlendirme kalıbını uygula
   (dizin adı = paket adı = component'in tek kelimelik hali,
   `.templ` dosyası snake_case).
2. `Props` struct'ında variant/size gibi seçenekleri Go tipli sabitler
   olarak tanımla (`type Variant string` + `const (...)`), React'teki
   string literal union'ların karşılığı.
3. Component dosyasının başına kısa bir kullanım örneği ve varsa React'ten
   sapan noktaları (desteklenmeyen prop, farklı davranış) yorum olarak ekle
   — `button.templ`, `closebutton.templ` örnekleri gibi.
4. `@heroui/styles`'ın ilgili CSS'ini `input.css`'e import et (bkz.
   `@import "@heroui/styles/components/<name>.css"`).

Yeni bir ikon gerekiyorsa component'in içine gömmeyin — `internal/shared/icons`'a
ayrı bir dosya olarak ekleyip oradan import edin.

## Config'e yeni bir alan eklemek

`internal/config/config.go`'daki `Config` struct'ı tek kaynak — yeni bir
alan eklerken `internal/platform/logging`'in `Log` config'i eklenirken
izlediği kalıbı tekrarlayın:

1. `Config` struct'ına (veya ilgili alt struct'a) `mapstructure` tag'li yeni
   alanı ekle.
2. Prod-güvenli bir varsayılan varsa `Load()` içinde `v.SetDefault(...)` ile
   ver (ör. `log.level` → `"info"`). Secret'lar gibi varsayılansız zorunlu
   alanlar için `Load()` sonunda açık bir `if cfg.X == "" { return ... }`
   kontrolü ekle (bkz. `session.secret`, `google.client_id`).
3. `mustBindEnv(v, "<key>", "<ENV_VAR>")` ile prod'da config.yaml olmadan da
   set edilebilmesini sağla.
4. `config.example.yaml`'ı hem değeri hem de dosya başındaki
   `key -> ENV_VAR` eşleme tablosunu güncelleyerek senkron tut.

## templ generate ve build doğrulama

Bir `.templ` dosyasını değiştirdikten sonra:

```sh
templ generate ./path/to/changed/dir   # veya tüm proje için: templ generate
go build ./...
go vet ./...
```

`_templ.go` dosyalarını commit'lemeden önce `templ generate`'in gerçekten
çalıştığını (diff'te güncellendiğini) doğrulayın — üretilmiş dosya elle
senkron tutulamaz.

## Go stili — bu repo'ya özgü sapmalar

Genel Go stili için `samber/cc-skills-golang` skill setine bakın. Bu
repo'da ayrıca:

- **Dış paket struct literal'leri her zaman keyed** yazılır (ör.
  `bson.E{Key: "email", Value: 1}`, pozisyonel değil) — alan sırası
  değiştiğinde sessizce kırılmasın diye.
- **Tek elden hata yönetimi (single handling rule)** — bir hata ya
  `fmt.Errorf("...: %w", err)` ile üst katmana sarılıp döner, ya da en üstte
  `slog` ile loglanır; asla ikisi birden yapılmaz (aynı hata iki kez log'a
  düşmesin diye). `cmd/server/main.go`'daki `slog.Error(...); os.Exit(1)`
  kalıbı sadece `main`'de, hatanın döneceği bir üst katman olmadığı için
  kullanılır.
- **HTTP yan etkileri `internal/shared/htmx` üzerinden** yapılır — düz
  `c.Redirect()`/header yazımı yerine `htmx.Redirect(c, location)` ve
  `htmx.Toast(c, htmx.ToastOptions{...})` gibi helper'lar htmx'in
  boosted/plain request ayrımını ve `HX-Trigger` gibi header çakışmalarını
  merkezi olarak çözer — yeni bir HX-* header ihtiyacı çıkarsa buraya
  eklenir, handler'lara header yazımı serpiştirilmez.
