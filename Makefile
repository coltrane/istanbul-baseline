
all: deps

deps: node_modules

node_modules: node package.json
	$(npm) install
	touch node_modules

clean:
	rm -rf node_modules

clean-all: clean

.PHONY: clean-all clean node deps all
