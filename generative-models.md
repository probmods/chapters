% Generative Models

#Models, simulation, and degrees of belief

One view of knowledge is that the mind maintains working models of parts of the world. 'Model' in the sense that it captures some of the structure in the world, but not all (and what it captures need not be exactly what is in the world---just useful). 'Working' in the sense that it can be used to simulate this part of the world, imagining what will follow from different initial conditions. As an example take the Plinko machine: a box with uniformly spaced pegs, with bins at the bottom. Into this box we can drop marbles:

<canvas id="plinkocanvas" width="10" height="10"" style="background-color:#333333;"></canvas>
<button id="makeplinko" onclick="plinkoinit(); $('#makeplinko').hide();">Set-up Plinko!</button>

The plinko machine is a 'working model' for many physical processes in which many small perturbations accumulate---for instance a leaf falling from a tree. It is an approximation to these systems because we use a discrete grid (the pegs) and discrete bins. Yet it is useful as a model: for instance, we can ask where we expect a marble to end up depending on where we drop it in, by running the machine several times---simulating the outcome.

Simulation is intimately connected to degrees of belief. For instance, imagine that someone has dropped a marble into the plinko machine; before looking at the outcome, you can probably report how much you believe that the ball has landed in each possible bin. Indeed, if you run the plinko machine many times, you will see a shape emerge in the bins. The number of balls in a bin gives you some idea how much you should expect a new marble to end up there. This 'shape of expected outcomes' can be formalized as a probability distribution (described below). Indeed, there is an intimate connection between simulation and probability, which we explore in the rest of this section.

There is one more thing to note about our Plinko machine above: we are using a computer program to *simulate* the simulation. Computers can be seen as universal simulators. How can we, clearly and precisely, describe the simulation we want a computer to do?


# Building Generative Models

We wish to describe in formal terms how to generate states of the world. That is, we wish to describe the causal process, or steps that unfold, leading to some potentially observable states. The key idea of this section is that these generative processes can be described as *computations*---computations that involve random choices to capture uncertainty about the process.

As our formal model of computation we start with the $\lambda$-calculus, and its embodiment in the LISP family of programming languages.  The $\lambda$-calculus is a formal system which was invented by Alonzo Church in the 1920's as a way of formalizing the notion of an effectively computable function [@Church192?]. The $\lambda$-calculus has only two basic operations for computing: creating and applying functions. Despite this simplicity, it is a *universal* model of computation---it is (conjectured to be) equivalent to all other notions of classical computation. (The $\lambda$-calculus was shown to have the same computational power as the Turing machine, and vice versa, by Alan Turing in his famous paper which introduced the Turing machine [@Turing1937]).

In 1958 John McCarthy introduced LISP (**LIS**t **P**rocessing), a programming language based on the $\lambda$-calculus. Scheme is a variant of LISP developed by Guy L. Steele and Gerald Jay Sussman with particularly simple syntax and semantics. We will use Scheme-style notation for the $\lambda$-calculus in this tutorial. For a quick introduction to programming in Scheme see [the appendix on Scheme basics](appendix-scheme.html).
The Church programming language [@Goodman2008], named in honor of Alonzo Church, is a generalization of Scheme which introduces the notion of probabilistic computation to the language. This addition results in a powerful language for describing generative models.

In Church, in addition to deterministic functions, we have a set of random functions implementing *random choices.*  These random primitive functions are called *Exchangeable Random Primitives* (XRPs). Application of an XRP results in a *sample* from the probability distribution defined by that XRP.  For example, the simplest XRP is `flip` which results in either true or false -- it simulates a (possibly biased) coin toss. (Note that the return values `true` and `false` will look like this in the output: `#t` and `#f`.)

~~~~
(flip)
~~~~

Run this program a few times. You will get back a different sample on each execution. Also, notice the parentheses around `flip`. These are meaningful; they tell Church that you are asking for an application of the XRP `flip`---resulting in a sample.
Without parentheses `flip` is a *procedure* object---a representation of the simulator itself, which can be used to get samples. 

In Church, each time you run a program you get a *sample* by simulating the computations and random choices that the program specifies. If you run the program many times, and collect the values in a histogram, you can see what a typical sample looks like:

~~~~
(hist (repeat 1000 flip) "Flips")
~~~~

Here we have used the `repeat` procedure which takes a number of repetitions, $K$, and a random distribution (in this case `flip`) and returns a list of $K$ samples from that distribution. We have used the `hist` procedure to display the results of taking 1000 samples from `flip`. As you can see, the result is an approximately uniform distribution over `true` and `false`.

An important idea here is that `flip` can be thought of in two different ways. From one perspective, `flip` is a procedure which returns a sample from a fair coin. That is, it's a *sampler* or *simulator*. From another perspective, `flip` is *itself* a characterization of the distribution over `true` and `false`. When we think about probabilistic programs we will often move back and forth between these two views, emphasizing either the sampling perspective or the distributional perspective. (With suitable restrictions this duality is complete: any Church program implicitly represents a distribution and any distribution can be represented  by a Church program [see e.g. @Ackerman2011 for more details on this duality].) We return to this relationship between probability and simulation below.

The `flip` function is the simplest XRP in Church, but you will find other XRPs corresponding to familiar probability distributions, such as `gaussian`, `gamma`, `dirichlet`, and so on. 
<!-- TODO: Many but not all of the XRPs and other basic functions implemented in Church can be found on the church reference appendix. -->
Using these XRPs we can construct more complex expressions that describe more complicated sampling processes. For instance here we describe a process that samples a number by multiplying two samples from a Guassian distribution:

~~~~
(* (gaussian 0 1) (gaussian 0 1) )
~~~~

What if we want to invoke this sampling process multiple times? We would like to construct a stochastic function that multiplies two Gaussians each time it is called.
We can use `lambda` to construct such complex stochastic functions from the primitive ones. 

~~~~
(define two-gaussians (lambda () (* (gaussian 0 1) (gaussian 0 1) )))
(density (repeat 100 two-gaussians))
~~~~

A lambda expression with an empty argument list, `(lambda () ...)`, is called a *thunk*: this is a function that takes no input arguments. If we apply a thunk (to no arguments!) we get a return value back, for example `(flip)`. A thunk is an object that represents a whole *probability distribution*.  
Complex functions can also have arguments. Here is a stochastic function that will only sometimes double its input:

~~~~
(define noisy-double (lambda (x) (if (flip) x (+ x x))))

(noisy-double 3)
~~~~

By using higher-order functions we can construct and manipulate probability distributions.  A good example comes from coin flipping...

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
<!--FIXME: multiple hists... -->


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
~~~~
Make sure you understand how the `bend` function works! Why are there an "extra" pair of parentheses outside each `make-coin` statement?


Higher-order functions like `repeat`, `map`, and `apply` can be quite useful.  Here we use them to visualize the number of heads we expect to see if we flip a weighted coin (weight = 0.8) 10 times.  We'll repeat this experiment 1000 times and then use `hist` to visualize the results.  Try varying the coin weight or the number of repetitions to see how the expected distribution changes.

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

We see by examining this histogram that `(#t #f)` comes out about 25% of the time. We may define the **probability** of a return value to be the fraction of times (in the long run) that this value is returned from evaluating the program -- then the probability of `(#t #f)` from the above program is 0.25.

Even for very complicated programs we can predict the probability of different outcomes by simulating (sampling from) the program. It is also often useful to compute these probabilities directly by reasoning about the sampling process.

## Product Rule

In the above example we take three steps to compute the output value: we sample from the first `(flip)`, then from the second, then we make a list from these values. To make this more clear let us re-write the program as:

~~~~
(define A (flip))
(define B (flip))
(define C (list A B))
C
~~~~
We can directly observe (as we did above) that the probability of `#t` for `A` is 0.5, and the probability of `#f` from `B` is 0.5. Can we use these two probabilities to arrive at the probability of 0.25 for the overall outcome `C` = `(#t #f)`? Yes, using the *product rule* of probabilities:
 The probability of two random choices is the product of their individual probabilities.
The probability of several random choices together is often called the *joint probability* and written as $P(A,B)$.
Since the first and second random choices must each have their specified values in order to get `(#t #f)` in the example, the joint probability is their product: 0.25.

We must be careful when applying this rule, since the probability of a choice can depend on the probabilities of previous choices. For instance, compute the probability of `(#t #f)` resulting from this program:

~~~~
(define A (flip))
(define B (flip (if A 0.3 0.7)))
(list A B)
~~~~

In general, the joint probability of two random choices $A$ and $B$ made sequentially, in that order, can be written as $P(A,B) = P(A) P(B|A)$.  This is read as the product of the probability of $A$ and the probability of "$B$ given $A$", or "$B$ conditioned on $A$"---that is, the probability of making choice $B$ given that choice $A$ has been made in a certain way.  Only when the second choice does not depend on (or "look at") the first choice does this expression reduce to a simple product of the probabilities of each choice individually: $P(A,B) = P(A) P(B)$.

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
We can write this using probability notation as: $P(A) = \sum_{B} P(A,B)$, where we view $A$ as the final value and $B$ as a random choice on the way to that value.
Using the product rule we can determine that the probability in the example above is 0.25 for each sequence that leads to return value `#t`, then, by the sum rule, the probability of `#t` is 0.25+0.25+0.25=0.75.

Using the sum rule to compute the probability of a final value is called *marginalization*. From the point of view of sampling processes marginalization is simply ignoring (or not looking at) intermediate random values that are created on the way to a final return value. From the point of view of directly computing probabilities, marginalization is summing over all the possible "histories" that could lead to a return value. Putting the product and sum rules together, the marginal probability of return values from a program that we have explored above is the sum over sampling histories of the product over choice probabilities---a computation that can quickly grow unmanageable, but can be approximated by sampling.



# Stochastic recursion

[Recursive functions](appendix-scheme.html#recursion) are a powerful way to structure computation in deterministic systems. In Church it is possible to have a *stochastic* recursion that randomly decides whether to stop. For example, the *geometric distribution* is a probability distribution over the non-negative integers that represents the probability of flipping a coin $N$ times and getting `true` exactly once:

~~~~
(define (geometric p) 
  (if (flip p) 
      0 
      (+ 1 (geometric p))))

(hist (repeat 1000 (lambda () (geometric 0.6))) "Geometric of 0.6")
~~~~

There is no upper bound on how long the computation can go on, although the probability of reaching some number declines quickly as we go. Indeed, stochastic recursions must be constructed to halt eventually (with probability 1). 


# Persistent Randomness: `mem`

It is often useful to model a set of objects that each have a randomly chosen property. For instance, describing the eye colors of a set of people:

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
function that takes a procedure and produces a *memoized* version of
the procedure.
When a stochastic procedure is memoized, it will
sample a random value the *first* time it is used for some arguments, but return that
same value when called with those arguments thereafter. The
resulting memoized procedure has a persistent value within each "run"
of the generative model (or simulated world). For instance consider the equality of two
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
  (mem (lambda (person) (uniform-draw '(blue green brown)))))

(list
 (eye-color 'bob)
 (eye-color 'alice)
 (eye-color 'bob) )
~~~~

This type of modeling is called *random world* style [@Mcallester2008].
Note that we don't have to specify ahead of
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

There are a countably infinite number of such flips, each independent
of all the others. The outcome of each, once determined, will always have the same value.

<!--
Here we define a function that encodes the outcome of the $n$th flip
of the $m$th coin, a doubly infinite set of properties:

~~~~
(define flip-n-coin-m (mem (lambda (n m) (flip))))
(list (list (flip-n-coin-m 1 1) (flip-n-coin-m 12 1) (flip-n-coin-m 1 47) (flip-n-coin-m 12 47))
      (list (flip-n-coin-m 1 3) (flip-n-coin-m 12 3) (flip-n-coin-m 1 47) (flip-n-coin-m 12 47)))
~~~~
-->

In computer science memoization is an important technique
for optimizing programs by avoiding repeated work.  
In the probabilistic setting, such as in Church, memoization actually affects the meaning of the memoized function.



# Example: Bayesian Tug of War

Imagine a game of tug of war, where each person may be strong or weak, and may be lazy or not on each match. If a person is lazy they only pull with half their strength. The team that pulls hardest will win. We assume that strength is a continuous property of an individual, and that on any match, each person has a 25% chance of being lazy.  This Church program runs a tournament between several teams, mixing up players across teams.  Can you guess who is strong or weak, looking at the tournament results?

~~~~
(define strength (mem (lambda (person) (gaussian 0 1))))

(define lazy (lambda (person) (flip 0.25)))

(define (total-pulling team)
  (sum
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

Notice that `strength` is memoized because this is a property of a person true across many matches, while `lazy` isn't.  Each time you run this program, however, a new "random world" will be created: people's strengths will be randomly re-generated, then used in all the matches.



#Example: Intuitive physics

Humans have a deep intuitive understanding of everyday physics---this allows us to make furniture, appreciate sculpture, and play baseball. How can we describe this intuitive physics? One approach is to posit that humans have a generative model that captures key aspects of real physics, though perhaps with approximations and noise. This mental physics simulator could for instance approximate Newtonian mechanics, allowing us to imagine the future state of a collection of (rigid) bodies.
We have included such a 2-dimensional physics simulator, the function `runPhysics`, that takes a collection of physical objects and runs physics 'forward' by some amount of time. (We also have `animatePhysics`, which does the same, but gives us an animation to see what is happening.) We can use this to imagine the outcome of various initial states, as in the Plinko machine example above:

~~~~
(define (dim) (uniform 5 20))
(define (xPos) (uniform 0 worldWidth))
(define (yPos) (uniform 0 worldHeight))

(define groundedWorld (addRect emptyWorld
                               (/ worldWidth 2)
                               worldHeight
                               worldWidth
                               10
                               #t))

(define (addRndCircle w) (addCircle w (xPos) (yPos) (dim) #f))
(define (addRndRect w) (addRect w (xPos) (yPos) (dim) (dim) #f))

(define world (addRndCircle (addRndRect (addRndCircle groundedWorld))))

(animatePhysics 1000 world)
~~~~

There are many judgments that you could imagine making with such a physics simulator. @Hamrick2011 have explored human intuitions about the stability of block towers. Look at several different random block towers; first judge whether you think the tower is stable, then simulate to find out if it is:

~~~~
(define towerWorld (makeTowerWorld))
(animatePhysics 1000 towerWorld)
~~~~

Were you often right? Were there some cases of 'surprisingly stable' towers?  @Hamrick2011 account for these cases by positing that people are not entirely sure where the blocks are initially (perhaps due to noise in visual perception). Thus our intuitions of stability are really stability given noise (or the expected stability marginalizing over slightly different initial configurations). We can realize this measure of stability as:

~~~~
;not working yet
(define (runTower) (doesTowerFall (runPhysics 1000 towerWorld)))
(hist (repeat 10 runTower))
~~~~

# Exercises

1) Here are three church programs:

	~~~~ {data-exercise="ex1.1"}
	(if (flip) (flip 0.7) (flip 0.1))
	~~~~

	~~~~ {data-exercise="ex1.2"}
	(flip (if (flip) 0.7 0.1))
	~~~~

	~~~~ {data-exercise="ex1.3"}
	(flip 0.4) 
	~~~~

	A) Show that the marginal distribution on return values for these three programs is the same by directly computing the probability using the rules of probability (hint: write down each possible history of random choices for each program). Check your answers by sampling from the programs. 

	B) Explain why these different-looking programs can give the same results.


2) Explain why (in terms of the evaluation process) these two programs give different answers (i.e. have different distributions on return values):

	~~~~ {data-exercise="ex2.1"}
	(define foo (flip))
	(list foo foo foo)
	~~~~

	~~~~ {data-exercise="ex2.2"}
	(define (foo) (flip))
	(list (foo) (foo) (foo))
	~~~~


3) In the simple medical diagnosis example we imagined a generative process for the diseases and symptoms of a single patient. If we wanted to represent the diseases of many patients we might have tried to make each disease and symptom into a ''function'' from a person to whether they have that disease, like this:

	~~~~ {data-exercise="ex3"}
	(define (lung-cancer person)  (flip 0.01))
	(define (cold person)  (flip 0.2))

	(define (cough person) (or (cold person) (lung-cancer person)))

	(list  (cough 'bob) (cough 'alice))
	~~~~

	Why doesn't this work correctly if we try to do the same thing for the more complex medical diagnosis example? How could we fix it?


4) Work through the evaluation process for the `bend` higher-order function in this example:

	~~~~ {data-exercise="ex4"}
	(define (make-coin weight) (lambda () (if (flip weight) 'h 't)))
	(define (bend coin) 
	  (lambda () (if (equal? (coin) 'h) 
	                 ( (make-coin 0.7) )
	                 ( (make-coin 0.1) ) )))
	
	(define fair-coin (make-coin 0.5))
	(define bent-coin (bend fair-coin))
	
	(hist (repeat 100 bent-coin) "bent coin")
	~~~~

	Directly compute the probability of the bent coin in the example. Check your answer by comparing to the histogram of many samples.

5) Here are four expressions you could evaluate using the model (the set of definitions) from the tug-of-war example:

	~~~~ {data-exercise="ex5"}
	(winner '(alice) '(bob))

	(equal? '(alice) (winner '(alice) '(bob)))

	(and (equal? '(alice) (winner '(alice) '(bob)))  
	     (equal? '(alice) (winner '(alice) '(fred))))

	(and (equal? '(alice) (winner '(alice) '(bob))) 
	     (equal? '(jane) (winner '(jane) '(fred))))
	~~~~

	A) Write down the sequence of expression evaluations and random choices that will be made in evaluating each expression.

	B) Directly compute the probability for each possible return value from each expression.

	C) Why are the probabilities different for the last two? Explain both in terms of the probability calculations you did and in terms of the "causal" process of evaluating and making random choices.

#) Use the rules of probability, described above, to compute the probability that the geometric distribution define by the following stochastic recursion returns the number 5.

	~~~~ {data-exercise="ex6"}
	(define (geometric p) 
	  (if (flip p) 
	      0 
	      (+ 1 (geometric p))))
	~~~~


#) Convert the following probability table to a compact Church program:

	 A      B     P(A,B)
	----  ----- -------------
 	F      F     0.14
 	F      T     0.96
 	T      F     0.4
 	T      T     0.4
 
	Hint: fix the probability of A and then define the probability of B to *depend* on whether A is true or not. Run your Church program and build a histogram to check that you get the correct distribution

	~~~~ {data-exercise="ex7"}
	(define a ...)
	(define b ...)
	(list a b)
	~~~~
