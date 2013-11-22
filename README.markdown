# About

Source code for the online book, **Probabilistic Models of Cognition**.

# Source files

Chapters are written in [Pandoc-extended Markdown](http://johnmacfarlane.net/pandoc/README.html#pandocs-markdown) and should have a `.md` extension. There are three kinds of chapter files:

- *Index*. An introduction to the book and a list of all public chapters. Lives in `index.md`.
- *Public*. The main content of the book. The order of chapters is declared inside `chapters.txt` in the following format:

    ~~~~
    generative-models
    conditioning
    patterns-of-inference
    ~~~~
    
    (i.e., one filename per line, omit the `.md` portion) 
- *Private*. Used for the play space (`play-space.md`) and any other pages that needn't be in the main content of the book.

I highly recommend reading through the [Pandoc Markdown documentation](http://johnmacfarlane.net/pandoc/README.html#pandocs-markdown) before editing the chapter files. `generative-models.md` offers a good example of the syntax. One convention is worth mentioning. We use the "fenced" code-block syntax, e.g., 

    ~~~~ {data-engine="bher" data-exercise="simple-flip"}
    (flip (0.5))
    ~~~~

Within the curly braces, `data-engine="bher"` specifies that this code block will be run through the `bher` inference engine (the current choices are `webchurch`, `bher`, `mit-church`, and `cosh`). This engine property will be injected as a CSS class in the compiled HTML. The `data-exercise` property indicates the name of the exercise; this is used to organize records in the database of student-run programs. It is permissible to not declare a `data-exercise` property (in this case, the database won't store runs for this exercise), but if such a property is declared, **it must be unique within the chapter file**.

The look and feel of the book is controlled by three files: `chapter.template`, `index.template`, and `style.css`.

# Compile scripts

You can compile all the chapters along with any `.md` files not listed inside `chapters.txt` using the command:

    make all

Read the Makefile for details

# Dependencies

- Bash
- Pandoc 1.11.1+
- Python 2.7+
- GNU make

# Development Notes

## TODO

- Add some directory structure to separate input (Markdown + assets [e.g., images]) from output.

