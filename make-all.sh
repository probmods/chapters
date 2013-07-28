#!/bin/bash

python make-index.py

for file in $( ls *.md ); do
    ./make-chapter.sh $file
done
