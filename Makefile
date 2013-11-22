# HT http://lincolnmullen.com/blog/make-and-pandoc/

# List files to be made by finding all *.md files and changing them to .html
# HT http://stackoverflow.com/q/6767413/351392 for the $(shell) syntax

public := $(addsuffix .html, $(shell cat chapters.txt))

## compile files not specified
## in chapters.txt and that aren't the index
## HT http://stackoverflow.com/a/17863387/351392
private := $(addsuffix .html, $(shell ls *.md | grep -v -f chapters.txt | sed -e 's/\.md//g'))

all : $(public) $(private)

public : $(public)

private : $(private)

# Pattern rule
# make the HTML file without the list of chapters
# in the navigation bar
.%.html : %.md chapter.template
	@echo "[$*] md -> nocl"
	@pandoc --toc \
	--smart \
	--template chapter.template \
	--read markdown \
	--write html5 \
	--mathjax \
	--csl apa.csl \
	--bibliography dev.bib \
	--output "$@" \
	"$<"

## don't delete intermediate html files
## http://www.gnu.org/software/make/manual/html_node/Chained-Rules.html
.PRECIOUS : .%.html chapterlist.html

# add chapter numbers to chapters.txt
.chapters.txt: chapters.txt
	cat -n chapters.txt | sed -e 's/\s\+\([0-9]\+\)\s\+/\1:/g' > .chapters.txt

# make html fragment for chapters
chapterlist.html : .chapters.txt
	python make-chapterlist-html.py > chapterlist.html

# inside .%.html, replace the <!-- _chapterlist_ --> string with the contents of chapterlist.html
# and <!-- _chapternum_ --> with the chapter num, which we compute manually from chapters.txt
# HT http://unix.stackexchange.com/questions/20322/replace-string-with-contents-of-a-file-using-sed#comment54953_20324	
# HT http://stackoverflow.com/a/1909390/351392 for the stuff
%.html : .%.html chapterlist.html
	$(eval CHAPTERNUM = $(shell grep "$*" .chapters.txt | cut -d ":" -f1 | sed -e 's/\([0-9]\)\+/\1./g'))
	@echo "[$*] nocl -> html"
	@ sed -e '/<!-- _chapterlist_ -->/{r chapterlist.html' \
	-e 'd}' \
	-e 's/<!-- _chapternum_ -->/$(CHAPTERNUM)/g' \
	"$<" > "$@"

.index.html: index.md
	@echo "[index] md -> nocl"
	@pandoc --mathjax --template index.template index.md -o .index.html

index.html: .index.html chapterlist.html
	@echo "[index] nocl -> html"
	@ sed -e '/<!-- _chapterlist_ -->/{r chapterlist.html' \
	-e 'd}' \
	.index.html > index.html 

# Remove all html outputs
clean :
	rm -f *.html .*.html

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
