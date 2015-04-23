## HT http://lincolnmullen.com/blog/make-and-pandoc/

# FIXME
# if a directory is specified (e.g., make dir=book1 all)
# then prefix all filenames with that directory name
# this is work in progress:
# 1. i can't figure out how to address $(prefix)chapters.txt
# 2.  it's not clear where assets like chapter templates,
# javascript, and css should be stored
prefix := $(if $(dir), $(addsuffix /,$(dir)),)

chapterlist = $(addprefix $(prefix), chapters.txt)

REQUIRES_CITEPROC_HS := $(shell pandoc --version | head -1 | grep "1.1[2-9]" | tr -d " ")

# List files to be made by finding all *.md files and changing them to .html
# HT http://stackoverflow.com/q/6767413/351392 for the $(shell) syntax
public := $(addprefix $(prefix), $(addsuffix .html, $(shell cat $(chapterlist))))

# compile files not specified
# in chapters.txt and that aren't the index
# HT http://stackoverflow.com/a/17863387/351392
private := $(addprefix $(prefix), $(addsuffix .html, $(shell ls *.md | grep -v -f $(chapterlist) | sed -e 's/\.md//g')))

all : wc $(public) $(private)

# in an ideal world, we would recompile this whenever any of the
# webchurch files changed, but this would require manually curating
# a list of dependencies for building webchurch.js
# maybe we can use grunt-watchify to do this automatically
wc : webchurch/online/webchurch.min.js

webchurch/online/webchurch.min.js :
	@echo 'making webchurch'
	@cd webchurch; ./compile.sh

public : $(public)

private : $(private)

# Pattern rule
# make the nocl file, i.e., the HTML file without the list of chapters
# in the navigation bar
.%.html : %.md chapter.template dev.bib
	@if [ "$(REQUIRES_CITEPROC_HS)" = "" ] ; then \
	  pandoc --toc \
		--smart \
		--template chapter.template \
		--read markdown+tex_math_dollars \
		--mathjax \
		--write html5 \
		--csl apa.csl \
		--bibliography dev.bib \
		--output "$@" \
		"$<"; \
	else \
		pandoc --toc \
		--smart \
		--template chapter.template \
		--read markdown+tex_math_dollars \
    --mathjax \
		--write html5 \
		--output "$@" \
		"$<"; \
	fi

## don't delete intermediate html files
## http://www.gnu.org/software/make/manual/html_node/Chained-Rules.html
.PRECIOUS : .%.html chapterlist.html

# add chapter numbers to chapters.txt
.chapters.txt: chapters.txt
	@cat -n chapters.txt | sed -e 's/\s\+\([0-9]\+\)\s\+/\1:/g' > .chapters.txt

# make html fragment for chapters
chapterlist.html : .chapters.txt
	@python make-chapterlist-html.py > chapterlist.html

# inside .%.html, replace the <!-- _chapterlist_ --> string with the contents of chapterlist.html
# and <!-- _chapternum_ --> with the chapter num, which we compute manually from chapters.txt
# HT http://unix.stackexchange.com/questions/20322/replace-string-with-contents-of-a-file-using-sed#comment54953_20324
# HT http://stackoverflow.com/a/1909390/351392 for the stuff
%.html : .%.html chapterlist.html
	$(eval CHAPTERNUM = $(shell grep "$*" .chapters.txt | cut -d ":" -f1 | sed -e 's/\([0-9]*\)/\1./g' ))
	@echo "- $(CHAPTERNUM) $*"
	@ sed -e "/<!-- _chapterlist_ -->/{r chapterlist.html" \
	-e "d}" \
	-e "s/<!-- _chapternum_ -->/$(CHAPTERNUM)/g" \
	"$<" > "$@"

## strangely doesn't work with pandoc 1.13 we use --output flag rather than "> .index.html"
.index.html: index.md index.template
	@pandoc --smart --mathjax --template index.template index.md > .index.html

$(prefix)index.html: $(prefix).index.html $(prefix)chapterlist.html
	@echo "* index.html"
	@ sed -e '/<!-- _chapterlist_ -->/{r chapterlist.html' \
	-e 'd}' \
	.index.html > index.html

# Remove all html outputs
clean :
	rm -f $(prefix)*.html $(prefix).*.html

rebuild : clean all

# resources
# http://www.gnu.org/software/make/manual/make.html#Target_002dspecific
# http://www.gnu.org/software/make/manual/make.html#Phony-Targets
# http://www.gnu.org/software/make/manual/make.html#Using-Implicit
# http://www.gnu.org/software/make/manual/make.html#Variables-in-Recipes
# http://www.chemie.fu-berlin.de/chemnet/use/info/make/make_4.html
# http://stackoverflow.com/q/4320416/351392
# http://sunsite.ualberta.ca/Documentation/Gnu/make-3.79/html_chapter/make_6.html
# http://stackoverflow.com/questions/2711963/change-makefile-variable-value
