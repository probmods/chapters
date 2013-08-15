#!/bin/bash


# NB: second argument to this file is 
# a chapter number plus a period, e.g.,
# 3.

STEM=`echo $1 | sed -e "s/\.md//g"`

baseheaderlevel="2"
numberoffset=`echo $2 | sed -e "s/\./,0/g"`

if [ -z "$2" ]
then
    baseheaderlevel="1"
    numberoffset="0"
fi

echo "compiling $1 number-offset=$numberoffset baseheaderlevel=$baseheaderlevel"

pandoc --toc \
--template chapter.template \
--read markdown \
--write html5 \
--mathjax \
--bibliography dev.bib \
--output $STEM.html \
--variable num:$2 \
--number-sections \
--base-header-level $baseheaderlevel \
--number-offset $numberoffset \
$STEM.md


# TODO:
# [ ] mathjax (vendor?)
# [.] bibtex (still need csl style)
# [.] template
# [.] citations
# [ ] editor injector




## potentially useful information
## modifying header identifiers: http://johnmacfarlane.net/pandoc/README.html#header-identifiers-in-html-latex-and-context

## the docs are slightly inaccurate about how you can read out the title block meta data
## you need to do
## pandoc -s -t native test.txt
## (the -s standalone flag is needed)
## HT https://groups.google.com/d/msg/pandoc-discuss/poShPwMga9I/HOfn5fK1n9cJ

## http://johnmacfarlane.net/pandoc/README.html

# NOTES:
# --mathjax gets overridden by --template

## HTML STUFF

# http://www.premiumpixels.com/freebies/apple-ios-linen-texture/
# (grey wash wall) http://subtlepatterns.com/page/2/ 


## IDEAS FOR HOW THE COMPILER WORKS
# chapters.txt contains a list of markdown files
# we read chapters.txt to build the chapter nav tool
# template.html gets filled
