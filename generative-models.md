% Generative Models

# Defining Generative Models

We wish to describe in formal terms how to generate states of the world. That is, we wish to describe the causal process, or steps that unfold, leading to some potentially observable states. The key idea of this section is that these generative processes can be described as *computations*, but computations that involve random choices to capture uncertainty about the process.

As our formal model of computation we start with the $\lambda$-calculus, and its embodiment in the LISP family of programming languages.  The $\lambda$-calculus is a formal system which was invented by Alonzo Church in the 1920's. Church introduced the $\lambda$-calculus as a model and formalization of computation, that is, as a way of formalizing the notion of an effectively computable function. The lambda calculus is a *universal* model of computation -- it is conjectured to be equivalent to all other notions of classical computation (the $\lambda$-calculus was shown to have the same computational power as the Turing machine and vice versa by Alan Turing in his famous paper which introduced the Turing machine [TODO: cite]). It is remarkable that the $\lambda$-calculus is universal because it has only two basic operations: creating and applying functions.

In 1958 John McCarthy introduced LISP (**LIS**t **P**rocessing), a programming language based on the $\lambda$-calculus. Scheme is a variant of LISP developed by Guy L. Steele and Gerald Jay Sussman with particularly simple syntax and semantics. We will use Scheme-style notation for the $\lambda$-calculus in this tutorial. For a quick introduction to programming in Scheme see [the appendix on Scheme basics](appendix-scheme.html).

The Church programming language -- named in honor of Alonzo Church -- is a generalization of Scheme which introduces the notion of probabilistic computation to the language.
In the next few sections of this tutorial, we show how to use Church to build generative models (building on standard notions of computation, as realized in Scheme).

In Church, in addition to deterministic functions, we have a set of random functions implementing *random choices.*  These random primitive functions are called *Exchangeable Random Primitives* (XRPs). Application of an XRP results in a *sample* from the probability distribution defined by that XRP.  For example, the simplest XRP is `flip` which results in either true or false -- it simulates a (possibly biased) coin toss. (Note that the return values `true` and `false` will look like this in the output: `#t` and `#f`.)

~~~~
(flip)
~~~~

Run this program a few times. You will get back a different sample on each execution. Also, notice the parentheses around `flip`. These are meaningful; they tell Church that you are asking for an application of the XRP `flip`. Delete the parentheses and see what happens. The object that was returned is the `flip`  *procedure* object. *Procedure* is just another word for an actual implementation of some function. In Church, each time you run a program you get a *sample* by simulating the computations and random choices that the program specifies. If you run the program many times, and collect the values in a histogram, you can see what a typical sample looks like:

~~~~
(hist (repeat 1000 flip) "Flips")
~~~~

Here we have used the `repeat` procedure which takes a number of repetitions, $K$, and a random distribution (in this case `flip`) and returns a list of $K$ samples from that distribution. We have used the `hist` procedure to display the results of taking 1000 samples from `flip`. As you can see, the result is an approximately uniform distribution over `true` and `false`.

An important idea here is that `flip` can be thought of in two different ways. From one perspective, `flip` is a procedure which returns a sample from a fair coin. That is, it's a *sampler* or *simulator*. From another perspective, `flip` is *itself* a characterization of the distribution over `true` and `false`. When we think about probabilistic programs we will often move back and forth between these two views, emphasizing either the sampling perspective or the distributional perspective. (With suitable restrictions this duality is complete: any Church program implicitly represents a distribution and any distribution can be represented  by a Church program. See [[The Meaning of Probabilistic Programs]] for more details on this duality.) We return to this relationship between probability and simulation below.

The `flip` function is the simplest XRP in Church, but you will find other XRPs corresponding to familiar probability distributions, such as `gaussian`, `gamma`, `dirichlet`, and so on.


[FIXME: Many but not all of the XRPs and other basic functions implemented in Church can be found on the [[Automatically generated documentation]] page.]


For another example, consider:

~~~~
;this line is a comment
(if
 (flip 0.7)         ;the condition of "if"
 100                ;the consequent ("then")
 (or (flip) (flip)) ;the alternate ("else")
)
~~~~

This expression is composed of an `if` conditional that evaluates the first expression (a flip here) then evaluates the second expression if the first is true or otherwise evaluates the third expression.<ref>The branching construct, `if`, is strictly not a function, because it does not evaluate all of its arguments, but instead *short-circuits* evaluating only the second or third. It has a value like any other function.</ref>
(We have also used comments here: anything after a semicolon is ignored when evaluating.) Notice that the first `flip` has an argument: flip with an argument is a biased random choice. In this case this flip will be true with probability 0.7.

We can use `lambda` to construct more complex stochastic functions from the primitive ones. Here is a stochastic function that will only sometimes double its input:

~~~~
(define noisy-double (lambda (x) (if (flip) x (+ x x))))

(noisy-double 3)
~~~~

A lambda expression with an empty argument list, `(lambda () ...)`, is called a *thunk*: this is a function that takes no input arguments. If we apply a thunk (to no arguments!) we get a return value back, for example `(flip)`, and if we do this many times we can figure out the marginal probability of each return value.  Thus a thunk is an object that represents a whole *probability distribution*. By using higher-order functions we can construct and manipulate probability distributions.  A good example comes from coin flipping...

## Example: Flipping Coins

The following program defines a fair coin, and flips it 20 times:

~~~~
(define fair-coin (lambda () (if (flip 0.5) 'h 't))) ;the thunk is a fair coin
(hist (repeat 20 fair-coin) "fair coin")
~~~~


This program defines a "trick" coin that comes up heads most of the time (95%), and flips it 20 times:

~~~~
(define trick-coin (lambda () (if (flip 0.95) 'h 't)))
(hist (repeat 20 trick-coin) "trick coin")
~~~~

<style classes="bg-yellow">
<em>Note on Church syntax:</em>

A common mistake when defining names for new functions and using them with higher-order functions like `repeat` is to confuse the name of a thunk with the name of a variable that stands for the output of a single function evaluation.  For instance, why doesn't this work?

~~~~
(define trick-coin-1 (if (flip 0.95) 'h 't))
(hist (repeat 20 trick-coin-1) "trick coin")
~~~~
The higher-order function `repeat` requires as input a thunk, a procedure (or function) with no arguments, as returned by `lambda` in the examples above.  Consider the difference in what is returned by these two code fragments:

~~~~
(define trick-coin-1 (if (flip 0.95) 'h 't))
trick-coin-1
~~~~
`trick-coin-1` names a variable that is defined to be the result of evaluating the `(if ...)` expression a single time (either `h` or `t`), while below `trick-coin-2` names a thunk that can serve as the input to the higher-order function `repeat`.

~~~~
(define trick-coin-2 (lambda () (if (flip 0.95) 'h 't)))
trick-coin-2
~~~~
The difference between these two programs becomes particularly subtle when using the `(define (name) ... )` syntax.  Simply putting the name to be defined in parentheses turns a variable definition into a thunk definition:

~~~~
(define (trick-coin-2) (if (flip 0.95) 'h 't))
trick-coin-2
~~~~
To Church the last two definitions of `trick-coin-2` are the same -- both output a thunk -- although superficially the last one looks more similar to the variable definition that assigns `trick-coin-1` to a single value of `h` or `t`.
</style>

The higher-order function `make-coin` takes in a weight and outputs a function (a thunk) describing a coin with that weight.  Then we can use `make-coin` to make the coins above, or others.

~~~~
(define (make-coin weight) (lambda () (if (flip weight) 'h 't)))
(define fair-coin (make-coin 0.5))
(define trick-coin (make-coin 0.95))
(define bent-coin (make-coin 0.25))

(hist (repeat 20 fair-coin) "20 fair coin flips")
(hist (repeat 20 trick-coin) "20 trick coin flips")
(hist (repeat 20 bent-coin) "20 bent coin flips")
~~~~

We can also define a higher-order function that takes a "coin" and "bends it":

~~~~
(define (make-coin weight) (lambda () (if (flip weight) 'h 't)))
(define (bend coin)
  (lambda () (if (equal? (coin) 'h)
                 ( (make-coin 0.7) )
                 ( (make-coin 0.1) ) )))

(define fair-coin (make-coin 0.5))
(define bent-coin (bend fair-coin))

(hist (repeat 100 bent-coin) "bent coin")
"done"
~~~~
Make sure you understand how the `bend` function works! Why are there an "extra" pair of parentheses outside each `make-coin` statement?


Higher-order functions like `repeat`, `map`, `apply` (or `sum`) can be quite useful.  Here we use them to visualize the number of heads we expect to see if we flip a weighted coin (weight = 0.8) 10 times.  We'll repeat this experiment 1000 times and then use `hist` to visualize the results.  Try varying the coin weight or the number of repetitions to see how the expected distribution changes.

~~~~
(define make-coin (lambda (weight) (lambda () (flip weight))))
(define coin (make-coin 0.8))

(define data (repeat 1000 (lambda () (sum (map (lambda (x) (if x 1 0)) (repeat 10 coin))))))
(hist data  "Distribution of coin flips")
~~~~


# Example: Causal Models in Medical Diagnosis

Generative knowledge is often *causal* knowledge.  As an example of how causal knowledge can be encoded in Church expressions, consider a simplified medical scenario:

~~~~
(define lung-cancer (flip 0.01))
(define cold (flip 0.2))

(define cough (or cold lung-cancer))

cough
~~~~

This program generates random conditions for a patient in a doctor's office.  It first specifies the base rates of two diseases the patient could have: lung cancer is rare while a cold is common, and there is an independent chance of having each disease.  The program then specifies a process for generating a common symptom of these diseases -- an effect with two possible causes: The patient coughs if they have a cold or lung cancer (or both).  Here is a slightly more complex causal model:

~~~~
(define lung-cancer (flip 0.01))
(define TB (flip 0.005))
(define cold (flip 0.2))
(define stomach-flu (flip 0.1))
(define other (flip 0.1))

(define cough (or (and cold (flip 0.5))
                  (and lung-cancer (flip 0.3))
                  (and TB (flip 0.7))
                  (and other (flip 0.01))))


(define fever (or (and cold (flip 0.3))
                  (and stomach-flu (flip 0.5))
                  (and TB (flip 0.1))
                  (and other (flip 0.01))))


(define chest-pain (or (and lung-cancer (flip 0.5))
                       (and TB (flip 0.5))
                       (and other (flip 0.01))))

(define shortness-of-breath (or (and lung-cancer (flip 0.5))
                                (and TB (flip 0.2))
                                (and other (flip 0.01))))

(list "cough" cough "fever" fever "chest-pain" chest-pain "shortness-of-breath" shortness-of-breath)
~~~~

Now there are four possible diseases and four symptoms.  Each disease causes a different pattern of symptoms.  The causal relations are now probabilistic: Only some patients with a cold have a cough (50%), or a fever (30%).  There is also a catch-all disease category "other", which has a low probability of causing any symptom.  *Noisy logical* functions, or functions built from `and`, `or`, and `flip`, provide a simple but expressive way to describe probabilistic causal dependencies between Boolean (true-false valued) variables.

When you run the above code, the program generates a list of symptoms for a hypothetical patient.  Most likely all the symptoms will be false, as (thankfully) each of these diseases is rare.  Experiment with running the program multiple times.  Now try modifying the `define` statement for one of the diseases, setting it to be true, to simulate only patients known to have that disease.  For example, replace `(define lung-cancer (flip 0.01))` with `(define lung-cancer true)`. Run the program several times to observe the characteristic patterns of symptoms for that disease.



# Prediction, Simulation, and Probabilities

Suppose that we flip two fair coins, and return the list of their values:

~~~~
(list (flip) (flip))
~~~~
How can we predict the return value of this program? For instance, how likely is it that we will see `(#t #f)`? A **probability** is a number between 0 and 1 that expresses the answer to such a question: it is a degree of belief that we will see a given outcome, such as `(#t #f)`. The probability if an event $A$ (such as the above program returning `(#t #f)`) is usually written as: $P(A)$.

As we did above, we can sample many times and examine the histogram of return values:

~~~~
(define (random-pair) (list (flip) (flip)))

(hist (repeat 1000 random-pair) "return values")
~~~~
(The parentheses around `random-pair` make an object that can be sampled from many times in a single execution of the program; this is described below, but the details aren't important for now.)

We see by examining this histogram that `(#t #f)` comes out about 0.25 of the time. We may define the **probability** of a return value to be the fraction of times (in the long run) that this value is returned from evaluating the program -- then the probability of `(#t #f)` from the above program is 0.25.

Even for very complicated programs we can predict the probability of different outcomes by simulating (sampling from) the program. It is also often useful to compute these probabilties directly by reasoning about the sampling process.

## Product Rule

In the above example we take three steps to compute the output value: we sample from the first `(flip)`, then from the second, then we make a list from their values. To make this more clear let us re-write the program as:

~~~~
(define A (flip))
(define B (flip))
(define C (list A B))
C
~~~~
We can directly observe (as we did above) that the probability of `#t` for `A` is 0.5, and the probability of `#f` from `B` is 0.5. Can we use these two probabilities to arrive at the probability of 0.25 for the overall outcome `C=(#t #f)`? Yes, using the *product rule* of probabilities:
 The probability of two random choices is the product of their individual probabilities.
The probability of several random choices together is often called the *joint probability* and written as $P(A,B)$.
Since the first and second random choices must each have their specified values in order to get `(#t #f)` in the example, the joint probability is their product: 0.25.

We must be careful when applying this rule, since the probability of a choice can depend on the probabilities of previous choices. For instance, compute the probability of `(#t #f)` resulting from this program:

~~~~
(define a (flip))
(define b (flip (if a 0.3 0.7)))
(list a b)
~~~~

In general, the joint probability of two random choices $A$ and $B$ made sequentially, in that order, can be written as $P(A,B) = P(A) P(B|A)$.  This is read as the product of the probability of $A$ and the probability of "$B$ given $A$", or "$B$ conditioned on $A$" -- that is, the probability of making choice $B$ given that choice $A$ has been made in a certain way.  Only when the second choice is independent of the first choice does this expression reduce to a product of the simple probabilities of each choice individually: $P(A,B) = P(A) P(B)$.

What is the relation between $P(A,B)$ and $P(B,A)$, the joint probability of the same choices written in the opposite order?  The only logically consistent definitions of probability require that these two probabilities be equal, so $P(A) P(B|A) = P(B) P(A|B)$.  This is the basis of <em>Bayes' theorem</em>, which we will encounter later.  <!--For more see [[The Meaning of Probabilistic Programs]].-->

## Sum Rule or Marginalization

Now let's consider an example where we can't determine from the overall return value the sequence of random choices that were made:

~~~~
(or (flip) (flip))
~~~~
We can sample from this program and determine that the probability of returning `#t` is about 0.75.

We cannot simply use the product rule to determine this probability because we don't know the sequence of random choices that led to this return value.
However we can notice that the program will return true if the two component choices are `#t,#t`, or `#t,#f`, or `#f,#t`. To combine these possibilities we use another rule for probabilities:
 If there are two alternative sequences of choices that lead to the same return value, the probability of this return value is the sum of the probabilities of the sequences.
We can write this using probability notation as: $P(A) = \sum_{B} P(A,B)$ , where we view $A$ as the final value and $B$ as the sequence of random choices on the way to that value.
Using the product rule we can determine that the probability in the example above is 0.25 for each sequence that leads to return value `#t`, then, by the sum rule, the probability of `#t` is 0.25+0.25+0.25=0.75.

Using the sum rule to compute the probability of a final value is called *marginalization*. From the point of view of sampling processes marginalization is simply ignoring (or not looking at) intermediate random values that are created on the way to a final return value. From the point of view of directly computing probabilities, marginalization is summing over all the possible "histories" that could lead to a return value.



# Stochastic recursion

It is possible to have a ''stochastic recursion'' that randomly decides whether to stop. Importantly, such recursion must be constructed to halt eventually (with probability 1). For example, an important probability distribution is the ''geometric distribution''. The geometric distribution is a distribution over the non-negative integers that represents the probability of flipping a coin $N$ times and getting exactly 1 head. This distribution can be written in Church with the following simple recursion.

~~~~
(define (geometric p) 
  (if (flip p) 
      0 
      (+ 1 (geometric p))))

(geometric .8)
~~~~

Notice that the base case of the recursion is probabilistic. There is no upper bound on how long the computation can go on, although the probability of reaching some number declines quickly as we walk out on the number line.



# Persistent Randomness: `mem`

Consider building a model with a set of objects that each have a randomly chosen property. For instance, describing the eye colors of a set of people:

~~~~
(define (eye-color person) (uniform-draw '(blue green brown)))

(list
 (eye-color 'bob)
 (eye-color 'alice)
 (eye-color 'bob) )
~~~~

The results of this generative process are clearly wrong: Bob's eye
color can change each time we ask about it! What we want is a model in
which eye color is random, but *persistent.* We can do this using
another Church primitive: `mem`. `mem` is a higher order
function: it takes a procedure and produces a *memoized* version of
the procedure.
<!-- The original procedure is wrapped in some logic which
intercepts calls to the underlying procedure. The first time the
procedure is called with some arguments, the underlying procedure is
invoked to get a return value. This return value is then stored in a
table with associated with the input arguments. Finally, the value is
returned to the caller. If the memoized procedure is called again with
the same arguments, the value associated with those arguments is
simply looked up an returned without calling the underlying procedure
again. -->
When a stochastic procedure is memoized, it will
sample a random value on the **first** call, and then return that
same value when called with the same arguments thereafter. The
resulting memoized procedure has a persistent value within each "run"
of the generative model. For instance consider the equality of two
flips, and the equality of two memoized flips:

~~~~
(equal? (flip) (flip))
~~~~

~~~~
(define mem-flip (mem flip))
(equal? (mem-flip) (mem-flip))
~~~~

Now returning to the eye color example, we can represent the notion that eye color is random, but each person has a fixed eye color.

~~~~
(define eye-color
  (mem
    (lambda (person) (uniform-draw '(blue green brown)))))

(list
 (eye-color 'bob)
 (eye-color 'alice)
 (eye-color 'bob) )
~~~~

This type of modeling is called *random world* style (McAllester,
Milch, Goodman, 2008). Note that we don't have to specify ahead of
time the people whose eye color we will ask about: the distribution on
eye colors is implicitly defined over the infinite set of possible
people, but only constructed "lazily" when needed.  Memoizing
stochastic functions thus provides a powerful toolkit to represent and
reason about an unbounded set of properties of an unbounded set of objects.
For instance, here we define a function `flip-n` that encodes the
outcome of the $n$th flip of a particular coin:

~~~~
(define flip-n (mem (lambda (n) (flip))))
(list (list (flip-n 1) (flip-n 12) (flip-n 47) (flip-n 1548))
      (list (flip-n 1) (flip-n 12) (flip-n 47) (flip-n 1548)))
~~~~

There are in principle a countably infinite number of such flips, each independent
of all the others.  But the outcome of the $n$th flip -- the 1st, the
12th, the 47th, or the 1548th -- once determined, will always have the same value.
Here we define a function that encodes the outcome of the $n$th flip
of the $m$th coin, a doubly infinite set of properties:

~~~~
(define flip-n-coin-m (mem (lambda (n m) (flip))))
(list (list (flip-n-coin-m 1 1) (flip-n-coin-m 12 1) (flip-n-coin-m 1 47) (flip-n-coin-m 12 47))
      (list (flip-n-coin-m 1 3) (flip-n-coin-m 12 3) (flip-n-coin-m 1 47) (flip-n-coin-m 12 47)))
~~~~

In traditional computer science memoization is an important technique
for optimizing programs by avoiding repeated work (see
[[Memoization as Optimization]]). In the probabilistic setting, such
as in Church, we can see this taken further and memoization
actually affects the *expressivity* of the language.

# Example: Bayesian Tug of War

Imagine a game of tug of war, where each person may be strong or weak, and may be lazy or not on each match. If a person is lazy they only pull with half their strength. The team that pulls hardest will win. We assume that half of all people are strong, and that on any match, each person has a 1 in 3 chance of being lazy.  This program runs a tournament between several teams, mixing up players across teams.  Can you guess who is strong or weak, looking at the tournament results?

~~~~
(define strength (mem (lambda (person) (if (flip) 10 5))))

(define lazy (lambda (person) (flip (/ 1 3))))

(define (total-pulling team)
  (apply +
         (map (lambda (person) (if (lazy person) (/ (strength person) 2) (strength person)))
              team)))

(define (winner team1 team2) (if (< (total-pulling team1) (total-pulling team2)) team2 team1))

(list "Tournament results:"
      (winner '(alice bob) '(sue tom))
      (winner '(alice bob) '(sue tom))
      (winner '(alice sue) '(bob tom))
      (winner '(alice sue) '(bob tom))
      (winner '(alice tom) '(bob sue))
      (winner '(alice tom) '(bob sue)))

~~~~

Notice that `strength` is memoized because this is a property of a person true across many matches, while `lazy` isn't.  Each time you run this program, however, a new "random world" will be created: people's strengths will be randomly re-generated and used in all the matches.



#Example: Intuitive physics

<!-- Put in simple 2d physics examples here: plinko, stability, ping-pong. -->










<!-- Note: the following was removed from the Hierarchical Models section. Possibly some should go here, though not all.

# Packaging Randomness with `lambda`

In the first part of the tutorial we introduced the abstraction operator, `lambda`. `lambda` is a function constructor. It takes
as arguments a number of formal parameters, and some code using those parameters, and returns a packaged function that when applied to
some values will bind those values to its formal parameters and execute the code. In the stochastic $\lambda$-calculus,
`lambda` allows us to build arbitrary reusable generative processes.

XRPs themselves, of course, represent simple reusable generative processes. For example, `flip` (with no arguments) defines a generative process that generates observation from an unbiased coin. It models the (admittedly trivial) "causal process" of flipping an unbiased coin. `flip` also has a version which takes an argument, specifying the weight of the coin, allowing us to implement biased coin flips. With `lambda` we can package up a biased call to `flip` into a procedure which can then be reused.

{{#churchserv:
(define my-coin (lambda () (flip .7)))

(my-coin)
(my-coin)

}}

Our "coin" in this case is a procedure of no arguments that can be called ("flipped") as many times as we like. In functional programming a procedure of
no arguments like this one is called a *thunk.*

{{#churchserv:
(define my-thunk
 (lambda ()
      (+ 1 2)))

(my-thunk)
}}

A deterministic thunk can only ever return a single value. Thus in deterministic LISPs, like Scheme, we can think of thunks as constant values.  For example, the thunk above is equivalent in meaning to the value `3` with respect to the behavior of a program it is used in. However, in Church, the meaning of a thunk is no longer a necessarily a single value. Thunks can return different values on different calls. In fact, in Church thunks can be thought of as the *definition* of sampleable probability distributions.

In defining `my-coin` as a thunk we "wrapped-up" or "encapsulated" the coin weight $.7$ inside of the procedure. In functional programming this construct, where we wrap up some information inside of a procedure is called a *closure*, because some information is "closed over" in the body of the function. This is a fundamental and important concept, as we will see shortly. It is not only constants like .7 which can be closed over, but also other kinds of information.

{{#churchserv:
(define my-coin-weight .7)
(define my-coin (lambda () (flip my-coin-weight)))

(my-coin)
}}

Here we have captured a variable `my-coin-weight` in the closure, rather than a simple value. So far, however, our examples have only packaged constant information into the closure. In the next section we will see how we can use closures to build reusable stochastic processes which have randomness at multiple levels.

# Hierarchical Generative Models

Using thunks and closures we can now implement our first hierarchical generative process. Let's imagine that we want to model a mint producing coins (with poor quality control). The coins will be mostly close to unbiased, but not all exactly weighted at .5. We can achieve this by modifying the proceeding code to **first** sample the weight of the coin from some distribution, and then wrap up that weight inside of the thunk.


First, we will need to choose a distribution for the coin weights coming out of the factory. For this, we will use a *beta* distribution. A beta distribution is a distribution on real numbers between 0 and 1, thus it can be thought of as a distribution on coin weights. The beta distribution takes two parameters that are called *pseudo-counts*. Pseudo-counts can be thought of the number of heads or tails that came up in some (imagined) prior set of coin tosses. Here are a few examples of different values for the parameters of the beta distribution.

<img src='Beta_distribution_pdf.png' width='400' />

To understand how the pseudo-counts work notice that as the proportion of pseudo-counts favors either heads or tails, then the beta distribution becomes more skewed towards coin weights which are biased in that direction. When the pseudo-counts are symmetric, then the distribution is peaked at .5. As the **total** number of pseudo-counts becomes greater then the distribution becomes more and more steeply peaked. For instance, $Beta(2,2)$ and $Beta(10,10)$ both have their mean at .5, but the latter has much lower variance. Note that $Beta(1,1)$ is the uniform distribution on the (0,1) interval. When the pseudo-counts are less than 1 then the distribution becomes more steeply peaked close to 0 and 1 (this is also where our interpretation of pseudo-counts as previous flips starts to break down).

{{#churchserv:
(define my-coin-weight (first (beta 1 1)))
(define my-coin (lambda () (flip my-coin-weight)))

(my-coin)
(my-coin)
}}

In this example it was extremely important that we used a closure. This allows all applications of  `my-coin` to be flips of a coin with the *same weight*. In other words, we choose the weight of the coin *once* and this weight is shared across all flips of the biased coin in the future. It is this sharing of higher-level random choices that gives hierarchical modeling its power. Also note, that this sharing accurately models our causal understanding of the coin factory. The factor produces coins, some of which are biased. One the coin is manufactured, however, its bias does not change.

If instead we had written this:

{{#churchserv:
(define my-coin (lambda () (flip  (beta 1 1))))

(my-coin)
(my-coin)
}}

Then each time we applied `my-coin` we would first sample a different coin weight. The beta distribution in these examples is what is called *prior distribution* on the coin weight. When we build hierarchical models we talk about each level being a *prior* on the one below.

# Packaging Reusable Random Processes with `lambda` and `let`

In the preceding section we showed how to build a hierarchical generative process for biased coins. To do this we drew a value from a `beta` random variable and then assigned it to a particular variable `my-coin-weight`. We needed to name the `beta` draw so that we could package it into the closure.

It is always possible to use `define` to explicitly name your variables like this, however, there is another very important and useful LISP expression which can be used instead.  `define` let's us name *global* variables -- variables which we have access to anywhere in the program -- however, often we want to bind a variable in some local context. `let` allows us to do this.  `let` has the following syntax:

<pre>
(let ( (var-name-1 expression-1)
        (var-name-2 expression-2)
        ...
        (var-name-N expression-N) )
     body-of-let-where-variables-have-scope )
</pre>

The variables inside of the `let` expression only have scope until the end of the `let` expression. The value of the whole `let`-expression is just the value of the body -- whatever the body evaluates to. We can use `let` to define our hierarchical coin.

{{#churchserv:
(define my-coin
	(let ((weight (beta 1 1)))
	 (lambda () (flip weight))))

(my-coin)
}}

We use `let` to bind a draw from `beta` to the variable `weight`, we then enclose this variable in a closure and return it.  There is something worth noting about this example.  The value of the `let`-expression here is a **procedure** object returned by `lambda`. This is another instance of the important feature of LISP that procedures are *first-class objects*. This means that they can be the value of an expression, they can be passed to other procedures as arguments, they can be returned by procedures, and they can be stored as data.

In fact, `let` is actually just syntactic sugar for  a more cumbersome use of  $\lambda$-abstraction. The schematic `let` expression above could be rewritten as the following `lambda`-expression.

<pre>
((lambda (var-name-1 var-name-2 ... var-name-N)
    body-of-lambda-where-variables-have-scope ) expression-1 expression-2 ... expression-N)
</pre>

Here we have created an anonymous procedure with formal parameters`var-name-1 var-name-2 ... var-name-N`, and have applied this to the expressions that get bound into those variables as arguments. Internally Church turns `let` expressions into `lambda` expressions of this form, but it is provided because it is much easier to read.

Sometimes it is useful to refer to one of the earlier variables when defining later variables in a `let`-binding. To do this you must `let*` which has the following syntax.

<pre>
(let* ( (var-name-1 expression-1)
         (var-name-2 expression-2-using-variable-1)
         ...
         (var-name-N expression-N-using-variables-1-to-(N-1) ))
     body-of-let-where-variables-have-scope )
</pre>

For example, suppose that we wanted to put a prior on our beta distribution pseudo-counts. For instance, suppose that there were ten different factories all reproducing coins, and we think that the quality control varies from factory to factory. We can model this assumption by placing a prior on the pseudocounts of `beta`.

A typical distribution for this purpose is the *gamma distribution*.

<img src='Gamma_distribution_pdf.svg' width='325' />

Putting a gamma prior on our pseudocounts we can write our new generative process using `let*`.

{{#churchserv:
(define my-coin
	(let* ((pseudo-head (gamma 1 2))
                (pseudo-tail (gamma 1 2))
                (weight (beta pseudo-head pseudo-tail)))
	 (lambda () (flip weight))))

(my-coin)
}}

Earlier we claimed that the variables bound by a `let` only have scope inside the body of the `let`. One thing you may be wondering is how the procedure `my-coin` still has access to the values bound by the `let` after it has been returned. To explain this, we need to explain how variables work in Church.
Scheme and Church are languages that are *lexically* or *statically scoped*. What this means is that value of a variable is the value that the variable had wherever it was defined. In other words, the value of the variables named *weight* inside of the closure is the value it had inside the `let` binding. In particular, this means that the following code works properly.

{{#churchserv:
(define my-coin
	(let ((weight (beta 1 1)))
	 (lambda () (flip weight))))

(define weight 'some-symbol)

(my-coin)
}}

How do Scheme and Church implement this? All variable bindings are stored in a data structure called an *environment*. The environment is essentially a set of key-value pairs, where the keys are variable names and the values are the values that the variable names are bound to. When a procedure object is constructed in Church it gets a copy of the local environment that exists *at the moment it is defined*. When we call that procedure it looks up the variables in this local environment. Variable bindings in environments are *ordered* so that the "closest" binding is used.  For example, the following code also still works correctly.

{{#churchserv:
(define weight 'some-symbol)

(define my-coin
	(let ((weight (beta 1 1)))
	 (lambda () (flip weight))))

(my-coin)

}}


The first binding to `weight`, bound by the `define`, is *shadowed*, by the second, so when we evaluate the procedure object that is bound to `my-coin` it always uses the more local, "closer" `let`-bound version of `weight`.

-->

Here's an example of a generative model.

<canvas id="plinkoCanvas" width="350" height="500" style="background-color:#333333;" onload="initPlinko();"></canvas>
<br/>
<button onClick="initPlinko(6, 7);">Simulate</button>
