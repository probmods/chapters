% Generative Models
% Long Ouyang
% July 21, 2013

# Defining Simple Generative Models

As our formal model of computation we start with the λ-calculus, and its embodiment in the LISP family of programming languages. The λ-calculus is a formal system which was invented by Alonzo Church in the 1920's.[1] Church introduced the λ-calculus as a model and formalization of computation, that is, as a way of formalizing the notion of an effectively computable function. The lambda calculus is a universal model of computation—it is conjectured to be equivalent to all other notions of classical computation (the λ-calculus was shown to have the same computational power as the Turing machine and vice versa by Alan Turing in his famous paper which introduced the Turing machine). It is remarkable that the λ-calculus is universal because it has only two basic operations: creating and applying functions.

In 1958 John McCarthy introduced LISP (**LIS**t **P**rocessing), a programming language based on the λ-calculus.[2] Scheme is a variant of LISP developed by Guy L. Steele and Gerald Jay Sussman with particularly simple syntax and semantics.[3] (For a simple tutorial on the Scheme language, see [1] or [2].)

We will use Scheme-style notation for the λ-calculus in this tutorial. The Church programming language - named in honor of Alonzo Church - is a generalization of Scheme which introduces the notion of probabilistic computation to the language. In the next few sections of this tutorial, we introduce the basics of Church programming and show how to use it to build generative models.

The λ-calculus formalizes the notion of computation using functions. Computation is performed in the λ-calculus by applying functions to arguments to compute results. Function application in Church looks like this:

~~~~ {.bher data-exercise="simple-flip"}
(+ 1 1)
~~~~

Here we see the function + applied to two arguments: 1 and 1. Note that in Church the name of the function comes first and the parentheses go outside the function. This is sometimes called Polish notation. If you run this simple program above you will see the resulting value of this function application. Since + is a deterministic function you will always get the same return value if you run the program many times.

In Church, in addition to deterministic functions, we have a set of random functions implementing random choices. These random primitive functions are called Exchangeable Random Primitives (XRPs). Application of an XRP results in a sample from the probability distribution defined by that XRP. For example, the simplest XRP is flip which results in either true or false -- it simulates a (possibly biased) coin toss. (Note that the return values true and false will look like this in the output: #t and #f.)

~~~~ {.bher}
(flip)
~~~~

Run this program a few times. You will get back a different sample on each execution. Also, notice the parentheses around flip. These are meaningful; they tell Church that you are asking for an application of the XRP flip. Delete the parentheses and see what happens. The object that was returned is the flip procedure object. Procedure is just another word for an actual implementation of some function. In Church, each time you run a program you get a sample by simulating the computations and random choices that the program specifies. If you run the program many times, and collect the values in a histogram, you can see what a typical sample looks like:

~~~~ {.bher}
(hist (repeat 1000 flip) "Flips")
~~~~


Here we have used the `repeat` procedure which takes a number of repetitions, $K$, and a random distribution (in this case `flip`) and returns a list of $K$ samples from that distribution. We have used the hist procedure to display the results of taking 1000 samples from `flip`. As you can see, the result is an approximately uniform distribution over `true` and `false`.

An important idea here is that flip can be thought of in two different ways. From one perspective, flip is a procedure which returns a sample from a fair coin. That is, it's a sampler or simulator. From another perspective, flip is itself a characterization of the distribution over true and false. When we think about probabilistic programs we will often move back and forth between these two views, emphasizing either the sampling perspective or the distributional perspective. (With suitable restrictions this duality is complete: any Church program implicitly represents a distribution and any distribution can be represented by a Church program. See The Meaning of Probabilistic Programs for more details on this duality.) We return to this relationship between probability and simulation below.

The flip function is the simplest XRP in Church, but you will find other XRPs corresponding to familiar probability distributions, such as `gaussian`, `gamma`, `dirichlet`, and so on.

## Building More Complex Programs

A Church program is syntactically composed of nested expressions. Roughly speaking an expression is either a simple value, or anything between parentheses (). In a deterministic LISP, like Scheme, all expressions without free variables have a single fixed value which is computed by a process known as evaluation. For example, consider the following more complex expression:

~~~~ {.bher}
(and true (or true false))
~~~~

This expression has an operator, the logical function and, and arguments, true and the subexpression which is itself an application of or. When reasoning about evaluation, it is best to think of evaluating the subexpressions first, then applying the function to the return values of its arguments. In this example or is first applied to true and false, returning true, then and is applied to true and the subexpression's return value, again returning true.
For another example, consider:

~~~~ {.bher}
;this line is a comment
(if 
 (flip 0.7)         ;the condition of "if"
 100                ;the consequent ("then")
 (or (flip) (flip)) ;the alternate ("else")
)
~~~~

Something something, a citation @Goodman:2008p865

# Exercises
Write some code here

~~~~ {.bher}
(+ 1 1)
~~~~

Write some other code here

~~~~ {.bher}
(+ 1 2)
~~~~


# References

