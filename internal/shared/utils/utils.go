package utils

import "strings"

// Cn, JS'teki cn/clsx gibi class listelerini birleştirir.
// string ve []string argümanlarını kabul eder, boş string'leri atar.
//
//	utils.Cn("accordion__item", tw)            // tw []string
//	utils.Cn("button", utils.If(active, "button--primary", "button--ghost"))
func Cn(args ...any) string {
	var sb strings.Builder

	for _, a := range args {
		switch v := a.(type) {
		case string:
			if v != "" {
				sb.WriteString(v)
				sb.WriteByte(' ')
			}
		case []string:
			for _, s := range v {
				if s != "" {
					sb.WriteString(s)
					sb.WriteByte(' ')
				}
			}
		}
	}

	return sb.String()
}

// If, JS'teki ternary operatörün karşılığı: cond ? then : els
func If[T any](cond bool, then, els T) T {
	if cond {
		return then
	}
	return els
}

func BoolStr(b bool) string {
	if b {
		return "true"
	}
	return "false"
}
