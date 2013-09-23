#!/bin/bash

# compile webchurch
echo "making webchurch"
cd webchurch
git submodule init
git submodule update
./compile.sh
cd ..

echo "making index"
python make-index.py
i=1

## compile files not specified
## in chapters.txt and that aren't the index
## HT http://www.catonmat.net/blog/set-operations-in-unix-shell/
## this is utter sorcery.
for stem in $( comm -23 <(ls *.md | sed -e 's/\.md//g' | sort) <( (echo index; cat chapters.txt) | sort ) ); do
    ./make-chapter.sh $stem
done

for file in $( cat chapters.txt ); do
    ./make-chapter.sh $file $i.
    i=`expr $i + 1`
done

rm chapter.template
