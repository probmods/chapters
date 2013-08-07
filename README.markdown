# About

The source files and compile scripts for the online book, Probabilistic Models of Cognition. The source files are written in the Pandoc-extended version of Markdown. The compiler scripts are thin Bash and Python wrappers around Pandoc.

# Source files

Source files should be named `[filename].md`. There is one special source file, `index.md`, which gets compiled into the homepage for the book (`index.html`), whose most important feature is the table of contents. After compilation, the list of chapters is displayed on the homepage as well as every chapter page. You specify the ordering in `chapters.txt` by listing the relevant filename (without the `.md` portion), e.g.,

    generative-models
    conditioning
    patterns-of-inference

`.md` files not listed in `chapters.txt` will still be compiled, but they will not appear linked to from the homepage or the chapters.

The syntax for the .md files is [Pandoc-extended Markdown](http://johnmacfarlane.net/pandoc/README.html#pandocs-markdown). I highly recommend reading through that page before modifying the source files. A decent example of the syntax in action lives in `generative-models.md`. One convention is worth mentioning. We use the "fenced" code-block syntax, e.g., 

    ~~~~ {.bher data-exercise="simple-flip"}
    (flip (0.5))
    ~~~~

Within the curly braces, `.bher` specifies that this code block will be run through the `bher` inference engine (the current choices are `bher`, `mit-church`, `cosh`, `jsChurch`; we'll soon have a new option thanks to Julius's work on ProbJS). This engine property will be injected as a CSS class in the compiled HTML. The `data-exercise` property indicates the name of the exercise; this is used to organize records in the database of student-run programs. It is permissible to not declare a `data-exercise` property (in this case, the database won't store runs for this exercise), but if such a property is declared, **it must be unique within the chapter file**.

The look and feel of the book is controlled by three files: `chapter.pytemplate`, `index.template`, and `style.css`.

# Compile scripts

You can compile the entire book using the command:

    ./make-all.sh

In order, this will:

1. Make the index (by calling `python make-index.py`)
2. Make each chapter inside `chapters.txt` (by calling `./make-chapter.sh [chapter-name].md [chapter-num]` )
3. Make hidden pages (by calling `./make-chapter.sh [page-name].md`)

The compile flow is probably more complicated than it needs to be.

Each chapter gets compiled to a file named `[chapter-name]` (no `.html` extension; e.g., `generative-models`, `conditioning`). The dependency graph for each chapter is this:

    +---------------+     +--------------------+
    | chapters.txt  |     | chapter.pytemplate |
    +---------------+     +--------------------+
      +                                +
      |   +-----------------------+    |           +-------------------+
      +-->|   chapter.template    |<---+           | [chapter-name].md |
          +-----------------------+                +-------------------+
                     +                                     +
                     |                                     |
                     |     +-------------------+           |
                     +---->|   [chapter-name]  |<----------+
                           +-------------------+

The dependency graph for the homepage, `index.html`, is this:

    +---------------+     +--------------------+
    |   index.md    |     |    index.template  |
    +---------------+     +--------------------+
      +                                +
      |   +-----------------------+    |           +-------------------+
      +-->|      index.pyhtml     |<---+           |    chapters.txt   |
          +-----------------------+                +-------------------+
                     +                                     +
                     |                                     |
                     |     +-------------------+           |
                     +---->|     index.html    |<----------+
                           +-------------------+

# Dependencies

- Bash
- Pandoc 1.11.1+
- Python 2.7+

# Development Notes

## TODO

- Write some smart watch scripts that recompile whenever source files are updated (useful for quickly prototyping changes to the content).
- Add some directory structure to separate input (Markdown + assets [e.g., images]) from output.

## CONSIDER

- A heavier-weight templating system (yst, hakyll, nanoc, current scripts + dependencies declared in a Makefile, Django itself)
