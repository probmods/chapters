import os

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

    with open('md/' + url + '.md', 'r') as f:
       chapter_title  = f.readline().lstrip().rstrip().replace("% ", "")

    chapters.append( (url, chapter_title) )

chapters.append( ("webchurch/online/ref", "Church Reference") )

lis = []

counter = 0

for url, chapter in chapters:
    li = tag("li", chapter, {"class": "nonum"} if counter==0 else {})
    link = tag("a", li, {"href": url + ".html"})
    counter += 1
    lis.append(link)


lis = "\n" + "\n".join(lis) + "\n"

print tag("ol", lis, {"start": 0})
