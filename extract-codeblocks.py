#!/usr/bin/python

import sys, pprint, json
pp = pprint.PrettyPrinter(indent=4)

from pandocfilters import walk

code_blocks = []

def extract(key, value, fmt, meta):
    if (key == 'CodeBlock'):
        [[ident,classes,keyvals], code] = value
        value = [[ident,classes,[['test_id',str(len(code_blocks))]]],code]
        
        code_blocks.append({'c': value, 't': 'CodeBlock'})

if __name__ == "__main__":
    doc = json.loads(sys.stdin.read())
    if len(sys.argv) > 1:
        format = sys.argv[1]
    else:
        format = ""
    walk(doc, extract, format, doc[0]['unMeta'])

    altered = [{'unMeta': {}}, code_blocks]
    json.dump(altered, sys.stdout)


# for CHP in `cat chapters.txt`; do pandoc --filter ./extract-codeblocks.py --to markdown $CHP.md -o code/$CHP.md; done
