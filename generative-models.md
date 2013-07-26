% Generative Models
% Long Ouyang
% July 21, 2013

# Defining Simple Generative Models

As our formal model of computation we start with the λ-calculus, and its embodiment in the LISP family of programming languages. The λ-calculus is a formal system which was invented by Alonzo Church in the 1920's.[1] Church introduced the λ-calculus as a model and formalization of computation, that is, as a way of formalizing the notion of an effectively computable function. The lambda calculus is a universal model of computation—it is conjectured to be equivalent to all other notions of classical computation (the λ-calculus was shown to have the same computational power as the Turing machine and vice versa by Alan Turing in his famous paper which introduced the Turing machine). It is remarkable that the λ-calculus is universal because it has only two basic operations: creating and applying functions.

In 1958 John McCarthy introduced LISP (*LIS*t *P*rocessing), a programming language based on the λ-calculus.[2] Scheme is a variant of LISP developed by Guy L. Steele and Gerald Jay Sussman with particularly simple syntax and semantics.[3] (For a simple tutorial on the Scheme language, see [1] or [2].)

We will use Scheme-style notation for the λ-calculus in this tutorial. The Church programming language - named in honor of Alonzo Church - is a generalization of Scheme which introduces the notion of probabilistic computation to the language. In the next few sections of this tutorial, we introduce the basics of Church programming and show how to use it to build generative models.

The λ-calculus formalizes the notion of computation using functions. Computation is performed in the λ-calculus by applying functions to arguments to compute results. Function application in Church looks like this:

Some math:

$\alpha^\beta \sim \prod_i{p_i(d_i \mid h)}$

~~~~ {.bher}
snap blah blah
multiple lines
   indentation
~~~~

~~~~ {#mycode .haskell .numberLines startFrom="100"}
qsort []     = []
qsort (x:xs) = qsort (filter (< x) xs) ++ [x] ++
               qsort (filter (>= x) xs)
~~~~

Something something, a citation @Goodman:2008p865

blah blah further

As our formal model of computation we start with the λ-calculus, and its embodiment in the LISP family of programming languages. The λ-calculus is a formal system which was invented by Alonzo Church in the 1920's.[1] Church introduced the λ-calculus as a model and formalization of computation, that is, as a way of formalizing the notion of an effectively computable function. The lambda calculus is a universal model of computation—it is conjectured to be equivalent to all other notions of classical computation (the λ-calculus was shown to have the same computational power as the Turing machine and vice versa by Alan Turing in his famous paper which introduced the Turing machine). It is remarkable that the λ-calculus is universal because it has only two basic operations: creating and applying functions.

As our formal model of computation we start with the λ-calculus, and its embodiment in the LISP family of programming languages. The λ-calculus is a formal system which was invented by Alonzo Church in the 1920's.[1] Church introduced the λ-calculus as a model and formalization of computation, that is, as a way of formalizing the notion of an effectively computable function. The lambda calculus is a universal model of computation—it is conjectured to be equivalent to all other notions of classical computation (the λ-calculus was shown to have the same computational power as the Turing machine and vice versa by Alan Turing in his famous paper which introduced the Turing machine). It is remarkable that the λ-calculus is universal because it has only two basic operations: creating and applying functions.

As our formal model of computation we start with the λ-calculus, and its embodiment in the LISP family of programming languages. The λ-calculus is a formal system which was invented by Alonzo Church in the 1920's.[1] Church introduced the λ-calculus as a model and formalization of computation, that is, as a way of formalizing the notion of an effectively computable function. The lambda calculus is a universal model of computation—it is conjectured to be equivalent to all other notions of classical computation (the λ-calculus was shown to have the same computational power as the Turing machine and vice versa by Alan Turing in his famous paper which introduced the Turing machine). It is remarkable that the λ-calculus is universal because it has only two basic operations: creating and applying functions.

As our formal model of computation we start with the λ-calculus, and its embodiment in the LISP family of programming languages. The λ-calculus is a formal system which was invented by Alonzo Church in the 1920's.[1] Church introduced the λ-calculus as a model and formalization of computation, that is, as a way of formalizing the notion of an effectively computable function. The lambda calculus is a universal model of computation—it is conjectured to be equivalent to all other notions of classical computation (the λ-calculus was shown to have the same computational power as the Turing machine and vice versa by Alan Turing in his famous paper which introduced the Turing machine). It is remarkable that the λ-calculus is universal because it has only two basic operations: creating and applying functions.
