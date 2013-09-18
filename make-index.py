import os
from string import Template

def tag(t, content, props = {}):
    substitutes = {"content": content, "tag": t}
    ## a little brittle, since we don't escape stuff in y
    substitutes["props"] = " ".join( map(lambda (x, y): x + "=\"" + str(y) + "\"", props.items()) )
    if len(substitutes["props"]) > 0:
        substitutes["props"] = " " + substitutes["props"]
    return "<%(tag)s%(props)s>%(content)s</%(tag)s>" % substitutes 

chapters = [ ("index","Index") ]

for line in open("chapters.txt"):
    url = line.lstrip().rstrip()

    with open(url + '.md', 'r') as f:
       chapter_title  = f.readline().lstrip().rstrip().replace("% ", "")

    chapters.append( (url, chapter_title) )

## make index.html
lis = []

for url, chapter in chapters:
    link = tag("a", chapter, {"href": url + ".html"})
    li = tag("li", link)
    lis.append(li)

lis = "\n" + "\n".join(lis) + "\n"

## Compile index.md to index.pyhtml
os.system("pandoc -S --mathjax --template index.template index.md -o index.pyhtml")

## Substitute in for %(chapters)s in index.pyhtml
with open("index.pyhtml", "r") as fr, open("index.html", "w") as fw:
    ol = tag("ol", lis, {"start": 0})
    template = fr.read() 
    fw.write( template % {"chapters": ol} )

## chapter.pytemplate -> chapter.template
with open("chapter.pytemplate", "r") as fr, open("chapter.template", "w") as fw:
    olNav = tag("ol", lis, {"start": 0})
    template = fr.read() 
    fw.write( template % {"chapters": olNav } )
