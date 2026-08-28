MODULE := github.com/AkifhanIlgaz/project-template

.PHONY: init

# init renames this template's Go module path from $(MODULE) to
# github.com/AkifhanIlgaz/$(NAME) across every .go file and go.mod, then
# resets git history so the new project starts with a single clean commit
# instead of inheriting project-template's own history.
#
# Usage: make init NAME=my-new-project
init:
ifndef NAME
	$(error NAME is required — usage: make init NAME=my-new-project)
endif
	@echo "$(NAME)" | grep -Eq '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$$' || \
		{ echo "NAME must be lowercase alphanumeric with hyphens (got: $(NAME))"; exit 1; }
	@echo "Renaming module $(MODULE) -> github.com/AkifhanIlgaz/$(NAME)"
	@find . -path './node_modules' -prune -o -path './.git' -prune -o \
		-type f \( -name '*.go' -o -name '*.templ' -o -name 'go.mod' \) -print \
		| xargs sed -i.bak 's#$(MODULE)#github.com/AkifhanIlgaz/$(NAME)#g'
	@find . -path './node_modules' -prune -o -name '*.bak' -delete
	@go build ./...
	@echo "Module renamed and builds clean. Resetting git history..."
	@rm -rf .git
	@git init -q
	@git add -A
	@git commit -q -m "Initial commit from project-template"
	@echo "Done — module is github.com/AkifhanIlgaz/$(NAME), git history reset to a single commit."
