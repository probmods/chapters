#!/bin/bash

pandoc --toc \
--template template.html \
--read markdown \
--write html5 \
--mathjax \
--bibliography dev.bib \
--output generative-models \
generative-models.md

# TODO:
# [ ] mathjax (vendor?)
# [.] bibtex (still need csl style)
# [.] template
# [.] citations




## potentially useful information
## modifying header identifiers: http://johnmacfarlane.net/pandoc/README.html#header-identifiers-in-html-latex-and-context

## http://johnmacfarlane.net/pandoc/README.html

# NOTES:
# --mathjax gets overridden by --template

## HTML STUFF

# http://www.premiumpixels.com/freebies/apple-ios-linen-texture/
# (grey wash wall) http://subtlepatterns.com/page/2/ 
