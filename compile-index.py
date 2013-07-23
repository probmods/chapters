from string import Template

def tag(t, content, props = {}):
    substitutes = {"content": content, "tag": t}
    ## a little brittle, since we don't escape stuff in y
    substitutes["props"] = " ".join( map(lambda (x, y): x + "='" + str(y) + "'", props.items()) )
    if len(substitutes["props"]) > 0:
        substitutes["props"] = " " + substitutes["props"]
    return "<%(tag)s%(props)s>%(content)s</%(tag)s>" % substitutes 

chapters = []

for line in open("chapters.txt"):
    url = line.lstrip().rstrip()

    with open(url + '.md', 'r') as f:
       chapter_title  = f.readline().lstrip().rstrip().replace("% ", "")

    chapters.append( (url, chapter_title) )

## make index.html
lis = []

for url, chapter in chapters:
    link = tag("a", chapter, {"href": url})
    li = tag("li", link)
    lis.append(li)

lis = "\n" + "\n".join(lis) + "\n"

ol = tag("ol", lis)

with open("index.template", "r") as f:
    index_template = f.read()

with open("index.html", "w") as f:
    f.write( index_template % {"chapters": ol} )

## make chapters.js
js_chapters = [];
    
for url, chapter in chapters:
    js_chapters.append('["%(url)s", "%(chapter)s"]' % {"url": url, "chapter": chapter})

js_chapters = "var __navChapters = [\n" + ",\n".join(js_chapters) + "\n];"
    
print js_chapters
