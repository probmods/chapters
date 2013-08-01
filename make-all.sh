#!/bin/bash

python make-index.py
i=1

for file in $( cat chapters.txt ); do
    ./make-chapter.sh $file $i.
    i=`expr $i + 1`
done

## TODO: compile files not specified
## in chapters.txt
