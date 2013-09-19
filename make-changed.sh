#!/bin/bash

python make-index.py
i=1

## compile files not specified
## in chapters.txt and that aren't the index
## HT http://www.catonmat.net/blog/set-operations-in-unix-shell/
## this is utter sorcery.
for stem in $( comm -23 <(ls *.md | sed -e 's/\.md//g' | sort) <( (echo index; cat chapters.txt) | sort ) ); do
  if git status --porcelain | grep $stem
    then ./make-chapter.sh $stem
  fi
done


for file in $( cat chapters.txt ); do
  if git status --porcelain | grep $file
    then ./make-chapter.sh $file $i.; i=`expr $i + 1`
  fi
done


rm chapter.template
