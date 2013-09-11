<!--
We have so far seen many *bounded* models: models with a finite set of random choices. In these models it is possible to enumerate all of the random choices that *could have been made*, even though we might not bother to make any given random choice during a given evaluation&mdash;for instance <code>(if (flip) 3 (flip 0.1))</code> often won't make the <code>(flip 0.1)</code> choice, but we know that there are two *possible* choices. In this section we will explore models that have an infinite set of possible random choices, though only finitely many will be made in any given evaluation. These models are defined using *recursion*.
-->

> Language is that which makes infinite use of finite means. --Wilhelm von Humboldt

How can we explain the unboundedness of human mental representations? For instance, you could potentially create or comprehend infinitely many sentences in english. Yet all of these sentences are created out of a finite set of words. Furthermore, not every sentence is possible: there is structure to this unboundedness. The non-parametric models we saw in the previous section are not well suited to capturing unbounded but structured spaces, like natural language. In this section we explore more structured unbounded models, defined via *recursion*.

# Recursion

Since a program is finite, unbounded complexity requires that a single expression represent many computations. For instance, in the program:
<pre>
(define coin (lambda () (flip 0.1)))
(repeat 10 coin)
</pre>
the lambda expression defining <code>coin</code> describes the ten computations constructed by repeat. To do this more explicitly, we can write a function that calls itself inside its own body&mdash;a *recursive function*. For instance, we can re-write the above program using a recursive function:

~~~~ {.mit-church}
(define (tosses K)
    (if (= K 0)
        '()
         (pair (flip 0.1) (tosses (- K 1)))))

(tosses 10)
~~~~

The function <code>tosses</code> is called ten times, decreasing the counter <code>K</code> each time until it reaches its *base case*, 0. As another example, consider computing the length of a list:

~~~~ {.mit-church}
(define (length list)
    (if (null? list)
        0
         (+ 1 (length (rest list)))))

(length '(1 2 3 4) )

~~~~

There are a number of things to note about this example. First we have used the `null?` procedure for the base case of the recursion&mdash;`null?` tests to see if a list is empty. This recursion loops though the list, one element at a time, adding one to the result of calling itself on the rest of the list.  When it gets to the end of the list it returns 0.

We have already seen several uses of the `repeat` procedure. This procedure can be used to build up a list of (independent) samples from some thunk. How can this procedure be implemented in Church?
Repeat is a *higher-order* recursive procedure:

~~~~ {.mit-church}
(define (repeat K thunk)
    (if (= K 0)
        '()
         (pair (thunk) (repeat (- K 1) thunk))))

(repeat 5 flip)

~~~~

One of the most powerful aspects of the LISP family of programming languages is its set of high-order list manipulating functions, such as `repeat`, `map`, and `fold`, which can be written via recursion.  For a deeper understanding of these please see [[Deterministic List Manipulating Functions]].

## Example: Geometric Distributions

In the above functions the recursion deterministically halted when a condition was met. It is also possible to have a *stochastic recursion* that randomly decides whether to stop. Importantly, such recursion must be constructed to halt eventually (with probability 1). For example, an important probability distribution is the *geometric distribution*. The geometric distribution is a distribution over the non-negative integers that represents the probability of flipping a coin $N$ times and getting exactly 1 head. This distribution can be written in Church with the following simple recursion.

~~~~ {.mit-church}
(define (geometric p)
  (if (flip p)
      0
      (+ 1 (geometric p))))

(geometric .8)
~~~~

Notice that the base case of the recursion is probabilistic. There is no upper bound on how long the computation can go on, although the probability of reaching some number declines quickly as we walk out on the number line.

## A Syntactic Version of Bayes Occam's Razor

In previous sections, we discussed Bayesian Occam's razor, which can be seen as a preference for hypotheses which are intrinsically simpler: a hypothesis with less flexibility is preferred if it fits the data equally well. Because this depends on the distribution intrinsic to the hypothesis, we might call this a preference for "semantic" simplicity. When dealing with hypotheses of unbounded representational complexity there is also a "syntactic" simplicity preference: a preference for hypotheses with simpler representation. This emerges from a generative model for hypotheses, rather than from the hypotheses themselves, because of the need to generate more complex hypotheses using more choices. The probability of a particular computation in Church is the product of the probability of all the random choices during that computation. All else being equal, large, complex structures (generated by more random choices) will be less probable than small structures (generated by fewer random choices). Thus penalizing more syntactically complex hypotheses is a side effect of using stochastic recursion to build complex hypotheses, via the Bayesian Occam's razor.

## Example: Inferring an Arithmetic Expression

To illustrate this effect, consider the following Church program, which induces an arithmetic function from examples. We generate an expression as a list, and then turn it into a value (in this case a procedure) by using `eval`&mdash;a function that invokes evaluation.

~~~~ {.mit-church}
(define (random-arithmetic-expression)
  (if (flip 0.6)
      (if (flip) 'x (sample-integer 10))
      (list (uniform-draw '(+ -)) (random-arithmetic-expression) (random-arithmetic-expression))))

(define (procedure-from-expression expr)
  (eval (list 'lambda '(x) expr) (get-current-environment)))

(define samples
 (mh-query
  100 100

  (define my-expr (random-arithmetic-expression))
  (define my-proc (procedure-from-expression my-expr))

  my-expr

  (= (my-proc 1) 3)
 ))


(map (lambda (e) (begin (display e) (display "\n"))) samples)
'done
~~~~

The query asks for an arithmetic expression on variable `x` such that it evaluates to `3` when `x`=1. In this example there are many extensionally equivalent ways to satisfy the condition, for instance the constant expressions `3` and `(+ 1 2)`, but because the more complex expressions require more choices to generate, they are chosen less often.

This query has a very "strict" condition: the function must give 3 when applied to 1. As the amount of data increases this strictness will make inference increasingly hard. We can ease inference by *relaxing* the condition, only requiring equality with high probability. To do so we use a "noisy" equality in the condition:

~~~~ {.mit-church}
(define (noisy= x y) (log-flip (* -3 (abs (- x y)))))

(define (random-arithmetic-expression)
  (if (flip 0.6)
      (if (flip) 'x (sample-integer 10))
      (list (uniform-draw '(+ -)) (random-arithmetic-expression) (random-arithmetic-expression))))

(define (procedure-from-expression expr)
  (eval (list 'lambda '(x) expr) (get-current-environment)))

(define samples
 (mh-query
  100 100

  (define my-expr (random-arithmetic-expression))
  (define my-proc (procedure-from-expression my-expr))

  my-expr

  (and (noisy= (my-proc 1) 3)
       (noisy= (my-proc 3) 5) )
 ))


(map (lambda (e) (begin (display e) (display "\n"))) samples)
~~~~

Try adding in more data consistent with the (+ x 2) rule, e.g., ` (noisy= (my-proc 4) 6) `, ` (noisy= (my-proc 9) 11) `. How do the results of querying on the arithmetic expression change as more consistent data points are observed, and why?

This is an example of a very powerful technique in probabilistic programing: a difficult inference problem can often be relaxed into an easier problem by inserting a noisy operation. Such a relaxation will have a parameter (the noise parameter), and various "temperature" techniques can be used to get samples from the original problem, using samples from the relaxed problem. (Temperature techniques that have been implemented for Church include parallel tempering, tempered transitions, and annealed importance sampling.)

# Example: Learning Compositional Concepts

How can we account for the productivity of human concepts (the fact that every child learns a remarkable number of different, complex concepts)? The "classical" theory of concepts formation accounted for this productivity by hypothesizing that concepts are represented compositionally, by logical combination of the features of objects (see for example Bruner, Goodnow, and Austin, 1951). That is, concepts could be thought of as rules for classifying objects (in or out of the concept) and concept learning was a process of deducing the correct rule.

While this theory was appealing for many reasons, it failed to account for a variety of categorization experiments. Here are the training examples, and one transfer example, from the classic experiment of Medin and Schaffer (1978). The bar graph above the stimuli shows the portion of human participants who said that bug was a "fep" in the test phase (the data comes from a replication by Nosofsky, Gluck, Palmeri, McKinley (1994); the bug stimuli are courtesy of Pat Shafto):

<img src='images/Medin54-bugs.png ' width='500' />

Notice three effects: there is a gradient of generalization (rather than all-or-nothing classification), some of the Feps are better (or more typical) than others (this is called "typicality"), and the transfer item is a *better* Fep than any of the Fep exemplars (this is called "prototype enhancement"). Effects like these were difficult to capture with classical rule-based models of category learning, which led to deterministic behavior. As a result of such difficulties, psychological models of category learning turned to more uncertain, prototype and exemplar based theories of concept representation. These models were able to predict behavioral data very well, but lacked  compositional conceptual structure.

Is it possible to get graded effects from rule-based concepts? Perhaps these effects are driven by uncertainty in *learning* rather than uncertainty in the *representations* themselves? To explore these questions Goodman, Tenenbaum, Feldman, and Griffiths (2008) introduced the Rational Rules model, which learns deterministic rules by probabilistic inference. This model has an infinite hypothesis space of rules (represented in propositional logic), which are generated compositionally. Here is a slightly simplified version of the model, applied to the above experiment:

~~~~ {.mit-church}
;;first set up the training (cat A/B) and test objects:
(define num-features 4)

(define A-objects (list '(0 0 0 1) '(0 1 0 1) '(0 1 0 0) '(0 0 1 0) '(1 0 0 0)))

(define B-objects (list '(0 0 1 1) '(1 0 0 1) '(1 1 1 0) '(1 1 1 1)))

(define T-objects (list '(0 1 1 0) '(0 1 1 1) '(0 0 0 0) '(1 1 0 1)
                        '(1 0 1 0) '(1 1 0 0) '(1 0 1 1)))

;;here are the human results from Nosofsky et al, for comparison:
(define human-A '(0.77 0.78 0.83 0.64 0.61))
(define human-B '(0.39 0.41 0.21 0.15))
(define human-T '(0.56 0.41 0.82 0.40 0.32 0.53 0.20))

;;two parameters: stopping probability of the grammar, and noise probability:
(define tau 0.3)
(define noise-param (exp -1.5))

;;a generative process for disjunctive normal form propositional equations:
(define (get-formula)
  (if (flip tau)
      (let ((c (Conj))
            (f (get-formula)))
        (lambda (x) (or (c x) (f x))))
      (Conj)))

(define (Conj)
  (if (flip tau)
      (let ((c (Conj))
            (p (Pred)))
        (lambda (x) (and (c x) (p x))))
      (Pred)))

(define (Pred)
  (let ((index (sample-integer num-features))
        (value (sample-integer 2)))
    (lambda (x) (= (list-ref x index) value))))


(define (noisy-equal? a b) (flip (if (equal? a b) 0.999999999 noise-param)))

(define samples
  (mh-query
   1000 10

   ;;infer a classification formula
   (define my-formula (get-formula))

   ;;look at posterior predictive classification
   (map my-formula (append T-objects A-objects B-objects))

   ;;conditioning (noisily) on all the training eamples:
   (and (all (map (lambda (x) (noisy-equal? true (my-formula x))) A-objects))
        (all (map (lambda (x) (noisy-equal? false (my-formula x))) B-objects)))))


;;now plot the predictions vs human data:
(define (means samples)
  (if (null? (first samples))
      '()
      (pair (mean (map (lambda (x) (if x 1.0 0.0)) (map first samples)))
            (means (map rest samples)))))

(scatter (map pair (means samples) (append human-T human-A human-B)) "model vs human")
'done
~~~~

Goodman, et al, have used to this model to capture a variety of classic categorization effects <ref>A rational analysis of rule-based concept learning. N. D. Goodman, J. B. Tenenbaum, J. Feldman, and T. L. Griffiths (2008). Cognitive Science. 32:1, 108-154.</ref>. Thus probabilistic induction of (deterministic) rules can capture many of the graded effects previously taken as evidence against rule-based models.

This style of compositional concept induction model, can be naturally extended to more complex hypothesis spaces <ref>For example: Compositionality in rational analysis: Grammar-based induction for concept learning. N. D. Goodman, J. B. Tenenbaum, T. L. Griffiths, and J. Feldman (2008). In M. Oaksford and N. Chater (Eds.). The probabilistic mind: Prospects for Bayesian cognitive science. A Bayesian Model of the Acquisition of Compositional Semantics. S. T. Piantadosi, N. D. Goodman, B. A. Ellis, and J. B. Tenenbaum (2008). Proceedings of the Thirtieth Annual Conference of the Cognitive Science Society.</ref>. It has been used to model theory acquisition, learning natural numbers concepts, etc. Further, there is no reason that the concepts need to be deterministic: in Church stochastic functions can be constructed compositionally and learned by induction <ref>Learning Structured Generative Concepts. A. Stuhlmueller, J. B. Tenenbaum, and N. D. Goodman (2010). Proceedings of the Thirty-Second Annual Conference of the Cognitive Science Society.</ref>.

<collapse name="Uncertainty Over Production Probabilities">

~~~~ {.mit-church}
;;first set up the training (cat A/B) and test objects:
(define num-features 4)

(define A-objects (list '(0 0 0 1) '(0 1 0 1) '(0 1 0 0) '(0 0 1 0) '(1 0 0 0)))

(define B-objects (list '(0 0 1 1) '(1 0 0 1) '(1 1 1 0) '(1 1 1 1)))

(define T-objects (list '(0 1 1 0) '(0 1 1 1) '(0 0 0 0) '(1 1 0 1)
                        '(1 0 1 0) '(1 1 0 0) '(1 0 1 1)))

;;here are the human results from Nosofsky et al, for comparison:
(define human-A '(0.77 0.78 0.83 0.64 0.61))
(define human-B '(0.39 0.41 0.21 0.15))
(define human-T '(0.56 0.41 0.82 0.40 0.32 0.53 0.20))

;;two parameters: stopping probability of the grammar, and noise probability:
(define noise-param (exp -1.5))


(define (noisy-equal? a b) (flip (if (equal? a b) 0.999999999 noise-param)))

(define samples
  (mh-query
   500 10

   ;;(integarted out) priors over production probabilities
   (define bb1 (make-beta-binomial 1 1))
   (define bb2 (make-beta-binomial 1 1))

   ;;a generative process for disjunctive normal form propositional equations:
   (define (get-formula)
     (if (bb1)
         (let ((c (Conj))
               (f (get-formula)))
           (lambda (x) (or (c x) (f x))))
         (Conj)))

   (define (Conj)
     (if (bb2)
         (let ((c (Conj))
               (p (Pred)))
           (lambda (x) (and (c x) (p x))))
         (Pred)))

   (define (Pred)
     (let ((index (sample-integer num-features))
           (value (sample-integer 2)))
       (lambda (x) (= (list-ref x index) value))))

   ;;infer a classification formula
   (define my-formula (get-formula))

   ;;look at posterior predictive classification
   (map my-formula (append T-objects A-objects B-objects))

   ;;conditioning (noisily) on all the training eamples:
   (and (all (map (lambda (x) (noisy-equal? true (my-formula x))) A-objects))
        (all (map (lambda (x) (noisy-equal? false (my-formula x))) B-objects)))))


;;now plot the predictions vs human data:
(define (means samples)
  (if (null? (first samples))
      '()
      (pair (mean (map (lambda (x) (if x 1.0 0.0)) (map first samples)))
            (means (map rest samples)))))

(scatter (map pair (means samples) (append human-T human-A human-B)) "model vs human")
'done
~~~~
</collapse>

<!--
### Example: 'Bag of Words' Models

In information retrieval documents are often represented as *bags of words*. This means that the content of the document is represented as an unordered collection of the words it contains. We can write a simple generative model for bags of words in Church.

~~~~ {.mit-church}
(define nouns '(chef omelet soup))
(define verbs '(eat work))
(define dictionary (append nouns verbs))

(define document-length (poisson 5))

(define document (repeat document-length (lambda () (uniform-draw dictionary))))

document
~~~~

Here we have used several new ERPs. The first is `poisson` which implements the *Poisson distribution*. The Poisson distribution is distribution over the non-negative integers that takes a parameter representing the mean of the distribution. Here is a plot of the Poisson distribution for several different parameter values.

[[image:Poisson_distribution_PMF.png|400px]]

Another ERP which we have used here is `uniform-draw` which takes a list and return one of its elements uniformly at random. The generative model we have defined first samples a length for the document from the `poisson` distribution and then proceeds to sample a document (represented as a list) by repeatedly calling `uniform-draw` on a dictionary of words. This generative model gives our first example of model with unbounded complexity. Poisson defines a distribution on all non-negative integers; in principle, we can generate a document of any size.

In the example above we used a uniform distribution over a set of objects, implemented by the ERP `uniform-draw`. This is a special case of the more general class of distributions known as *multinomial distributions*. The ERP `multinomial` implements a distribution over $K$ discrete outcomes. In other words, it is just a $K$-sided biased die.

~~~~ {.mit-church}
(define my-die (lambda () (multinomial '(1 2 3 4) '(1/2 1/6 1/6 1/6))))

(my-die)
(my-die)
(my-die)
~~~~

`multinomial` takes two arguments, the first is a list of the objects to sample from and the second is a list, of the same length, of probabilities for those objects. `uniform-draw` can be implemented using `multinomial`.

~~~~ {.mit-church}
(define (uniform-draw list)
  (let* ((list-length (length list))
           (weights (repeat list-length (lambda () (/ 1 list-length)))))
    (multinomial list weights)))

(uniform-draw '(1 2 3 4 5))
~~~~

We saw above how we could use the *beta* distribution to draw weights for `flip`. A multinomial distribution is just a generalization of `flip` from 2 possible outcomes to $K$ possible outcomes. There is a corresponding generalization of the *beta* distribution, called a *Dirichlet distribution*. A Dirichlet distribution is a distribution on length $K$ vectors of real numbers which sum to 1. These vectors fall into a $K$-dimensional *simplex*: the generalization of a triangle to multiple dimensions.  The Dirichlet distribution is parameterized by a vector of $K$ pseudo-counts&mdash; one for each of the possible outcomes. These pseudo-counts work just like the pseudo-counts for the beta distribution. The figure below shows a 4-dimensional Dirichlet distribution for several different pseudo-counts.

[[image:dirichlet.png|400px]]


We can use the Dirichlet distribution to draw a random die.

~~~~ {.mit-church}
(define my-die
  (let ((weights (dirichlet '(1 1 1 1))))
    (lambda () (multinomial '(1 2 3 4) weights))))

(my-die)
(my-die)
(my-die)
~~~~

We can now build a hierarchical bag-of-words model that puts a prior on the multinomial parameters. We draw a different set of parameters for each document.

~~~~ {.mit-church}
(define nouns '(chef omelet soup))
(define verbs '(eat work))
(define dictionary (append nouns verbs))

(define document-length (poisson 5))

(define document-proportions (dirichlet (repeat (length dictionary) (lambda () 1))))

(define document (repeat document-length (lambda () (multinomial dictionary document-proportions))))

document
~~~~
-->
<!--
Notice that this example includes a noisy observation function. This is an instance of *relaxation techniques*: extending the true query to one which has higher entropy (i.e. "noisier"), and is thus easier to do inference in.

To understand the use of relaxations, consider the following simple SAT problem:


There are a wide variety of useful relaxations. For instance, we may define noisy equality on lists by an edit (Levenstein) distance:
-->
<!--
Inference in unbounded models: its possible
Rules + stats
  -number game: first simple enumerated hypotheses, then generative process for hypotheses.
  -rational rules

structural occams razor (choice is currency): small structures are better, big structures always decline geometrically
-->
<!--
# Exchangeability
idea of purity

i.i.d not closed under lambda abstraction
echangeable things **are** closed under lambda abstraction



# Rules and Stats
number game: first simple enumerated hypotheses, then generative process for hypotheses.
rational rules




-->
<!--

a few things i pulled out of the book notes:

models with flexible (potentially unbounded complexity) structure: non-parametrics, rules, grammars.

conjugate models.

bayesian model selection.

coin flipping examples and subjective randomness?

undirected models: structure in the conditioner.


-->
<!--

~~~~ {.mit-church}
(define samples
  (repeated-mh-def-query
   100 100

   '(define red-pseudo-count (gamma 1 2))
   '(define blue-pseudo-count (gamma 1 2))
   '(define urn->proportion-red
      (mem
       (lambda (urn)
         (beta red-pseudo-count blue-pseudo-count))))

   '(define (sample-urn urn)
      (let* ((proportion-red (urn->proportion-red urn))
             (proportion-blue (- 1 proportion-red)))
        (repeat 10
                (lambda ()(multinomial '(red blue) (list proportion-red proportion-blue))))))

   '(define urn-1 (sample-urn 1))
   '(define urn-2 (sample-urn 2))

   '(urn->proportion-red 3)

   '(and (equal? urn-1 '(red red red red red red red red red red))
         (equal? urn-2 '(blue blue blue blue blue blue blue blue blue blue)))
   (get-current-environment)))

samples
~~~~

Here we have queried on the proportion of red marbles in a third urn. What we see is that most samples from this proportion seem to be near to 1 or near to 0. By adding an addition level of structure to our model, we have been able to learn transferable knowledge. We see that we have generated urns which are all blue or all red, therefore we hypothesize that the pseudocounts must favor sampling proportions which are close to 1 or 0.
-->
<!--
3.) Fan out dependency
learning about one thing can help you learn about others

(charles thesis)
learning inductive biases
lateral transfer
X-bar theory

3.i.) Blessing of Abstraction
    relative learning speeds of specific and abstract stuff
    close things can be learned slower than higher things
    tomer/noah cogsci paper
    kids can get abstract things before

examples:
      marbles example (fan out dependency) mostly white, mostly black, one marble (draw from a beta, draw)
          hypothesis selection
          beta binomial models (conjugate models)
      x-bar theory
      mixtures

Notes:

Hierarchical Bayes: particular depedency (A (B C C) (B2 ))
-->
<!--

@article{berwick1985acquisition,
  title={{The acquisition of syntactic knowledge. Cambridge, Mass}},
  author={Berwick, RC},
  journal={MIT Press},
  volume={132},
  pages={46--74},
  year={1985}
}


Not appreciating this fact has led to a kind of fallacy in some areas of cognitive science. It is often assumed that if it can be shown in some experiment that an inference depends on the several factors, this must mean that the correct model of the phenomenon must include all of those factors dependently. However, as can be seen by the preceding examples, in fact, our generative model can express causal independencies that during a real inference task disappear.

#### Notes
connect to law of conservation of belief

sentence processing

connect to non-monotonic reasoning

pragmatics example: (some => not-all)

compare to `amb`
 -->
<!--
a.) size principle (entropy) => subset principle/
elsewhere condition
       in the posterior you prefer the smaller set
generate the order of the polynomial and then draw number of parameters
             curve fitting example
parameter that doesn't do anything, it doesn't penalize: if you marginalize them out then they don't matter
          AIC/BIC


examples:
     rectangle game in Church (implicit negative evidence)
      curve fitting example
      size principle in
      grammar selection (perfors)

-->

# Grammar

One area in which recursively defined generative processes are used extensively is in models of natural language. The goal in these models is to capture the statistical structure in sequences of words. In the next few sections we will explore a series of increasingly complex models for such data.

## N-gram and Hierarchical N-gram Models

Many systems in computational linguistics make use of *n-gram models*. An n-gram model is a drastically simplified model of sentence structure where the distribution over words in a particular position depends on the last $(N-1)$ words. N-gram models are a simple example of an unbounded model where the structure of the computation itself depends on probabilistic choices. Here is the Church code for a simple bigram model, also called a *Markov model*, where the next word depends on the last.

~~~~ {.mit-church}
 (define vocabulary '(chef omelet soup eat work bake stop))

 (define (sample-words last-word)
   (if (equal? last-word 'stop)
       '()
       (pair last-word
             (let ((next-word
                    (case last-word
                      (('start) (multinomial vocabulary '(0.0032 0.4863 0.0789 0.0675 0.1974 0.1387 0.0277)))
                      (('chef)  (multinomial vocabulary '(0.0699 0.1296 0.0278 0.4131 0.1239 0.2159 0.0194)))
                      (('omelet)(multinomial vocabulary '(0.2301 0.0571 0.1884 0.1393 0.0977 0.1040 0.1831)))
                      (('soup)  (multinomial vocabulary '(0.1539 0.0653 0.0410 0.1622 0.2166 0.2664 0.0941)))
                      (('eat)   (multinomial vocabulary '(0.0343 0.0258 0.6170 0.0610 0.0203 0.2401 0.0011)))
                      (('work)  (multinomial vocabulary '(0.0602 0.2479 0.0034 0.0095 0.6363 0.02908 0.0133)))
                      (('bake)  (multinomial vocabulary '(0.0602 0.2479 0.0034 0.0095 0.6363 0.02908 0.0133)))
                      (else 'error))))
               (sample-words next-word)))))


 (sample-words 'start)
~~~~

Here we have used a `case` statement, which is another Church branching construct (a short form for nested `if`s, see [[the case statement]]).
`sample-words` is a recursion which builds up a list of words by sampling the next word conditional on the last. Each word is sampled from a multinomial distribution whose parameters are fixed. We start the recursion by sampling conditional on the special symbol `start`.  When we sample the symbol `stop` we end the recursion. Like the geometric distribution defined above, this stochastic recursion can produce unbounded structures&mdash;in this case lists of words of arbitrary length.

The above code may seem unnecessarily complex because it explicitly lists every transition probability. Suppose that we put a prior distribution on the multinomial transitions in the n-gram model. Using `mem` this is very straightforward:

~~~~ {.mit-church}
(define vocabulary '(chef omelet soup eat work bake stop))

(define word->distribution
  (mem (lambda (word) (dirichlet (make-list (length vocabulary) 1)))))

(define (transition word)
  (multinomial vocabulary (word->distribution word)))

(define (sample-words last-word)
  (if (equal? last-word 'stop)
      '()
      (pair last-word (sample-words (transition last-word)))))

(sample-words 'start)
~~~~

We now have a *hierarchical* n-gram model, which is both simpler to write and more powerful in the sense that it can learn the transition probabilities (rather than requiring them to be given).

## Hidden Markov Models

Another popular model in computational linguistics is the hidden Markov model (HMM). The HMM extends the Markov model by assuming that the "actual" states aren't observable. Instead there is an *observation model* that generates an observation from each "hidden state". We use the same construction as above to generate an unknown observation model.

~~~~ {.mit-church}
(define states '(s1 s2 s3 s4 s5 s6 s7 s8 stop))

(define vocabulary '(chef omelet soup eat work bake))


(define state->observation-model
  (mem (lambda (state) (dirichlet (make-list (length vocabulary) 1)))))

(define (observation state)
  (multinomial vocabulary (state->observation-model state)))

(define state->transition-model
  (mem (lambda (state) (dirichlet (make-list (length states) 1)))))

(define (transition state)
  (multinomial states (state->transition-model state)))


(define (sample-words last-state)
  (if (equal? last-state 'stop)
      '()
      (pair (observation last-state) (sample-words (transition last-state)))))

(sample-words 'start)
~~~~

## Infinite Hidden Markov Models

Just as when we considered the [[Mixture and Non-Parametric Models#Infinite Mixture Models | unknown latent categories]], we may wish to have a hidden Markov model over an unknown number of latent symbols. We can do this by again using a reusable source of state symbols:

~~~~ {.mit-church}
(define vocabulary '(chef omelet soup eat work bake))

(define (get-state) (DPmem 0.5 gensym))

(define state->transition-model
  (mem (lambda (state) (DPmem 1.0 (get-state)))))

(define (transition state)
  (sample (state->transition-model state)))

(define state->observation-model
  (mem (lambda (state) (dirichlet (make-list (length vocabulary) 1)))))

(define (observation state)
  (multinomial vocabulary (state->observation-model state)))

(define (sample-words last-state)
  (if (flip 0.2)
      '()
      (pair (observation last-state) (sample-words (transition last-state)))))

(sample-words 'start)
~~~~
This model is known as the *infinite hidden Markov model*. Notice how the transition model uses a separate DPmemoized function for each latent state: with some probability it will reuse a transition from this state, otherwise it will transition to a new state drawn from the globally shared source or state symbols&mdash;a DPmemoized `gensym`.

## Probabilistic Context-free Grammars

The models above generate sequences of words, but lack constituent structure (or "hierarchical structure" in the linguistic sense).

Probabilistic context-free grammars (PCFGs) are a straightforward (and canonical) way to generate sequences of words with constituent structure. There are many ways to write a PCFG in Church. One especially direct way (inspired by Prolog programming) is to let each non-terminal be represented by a Church procedure; here constituency is embodied by one procedure calling another&mdash;that is by causal dependence.

~~~~ {.mit-church}
(define (terminal t) (lambda () t))

(define D (lambda ()
            (map sample
                 (multinomial
                  (list (list (terminal 'the) )
                        (list (terminal 'a)))
                  (list (/ 1 2) (/ 1 2))))))
(define N (lambda ()
            (map sample
                 (multinomial
                  (list (list (terminal 'chef))
                        (list (terminal 'soup))
                        (list (terminal 'omelet)))
                  (list (/ 1 3) (/ 1 3) (/ 1 3))))))
(define V (lambda ()
            (map sample
                 (multinomial
                  (list (list (terminal 'cooks))
                        (list (terminal 'works)))
                  (list (/ 1 2) (/ 1 2))))))
(define A (lambda ()
            (map sample
                 (multinomial
                  (list (list (terminal 'diligently)))
                  (list (/ 1 1))))))
(define AP (lambda ()
             (map sample
                  (multinomial
                   (list (list A))
                   (list (/ 1 1))))))
(define NP (lambda ()
             (map sample
                  (multinomial
                   (list (list D N))
                   (list (/ 1 1))))))
(define VP (lambda ()
             (map sample
                  (multinomial
                   (list (list V AP)
                         (list V NP))
                   (list (/ 1 2) (/ 1 2))))))
(define S (lambda ()
            (map sample
                 (multinomial
                  (list (list NP VP))
                  (list (/ 1 1))))))
(S)
~~~~

We have used the procedure `sample`, which applies a thunk (to no arguments), resulting in a sample. `sample` is in fact trivial&mdash;it can be defined by:
<code>
(define (sample distribution) (apply distribution '()))
</code>.

Now, let's look at one of the procedures defining our PCFG in detail.

<pre>
(define VP (lambda ()
             (map sample
                  (multinomial
                   (list (list V AP)
                         (list V NP))
                   (list (/ 1 2) (/ 1 2))))))
</pre>

When `VP` is called it `map`s `sample` across a list which is sampled from a multinomial distribution: in this case either `(V AP)` or `(V NP)`. These two lists correspond to the *right-hand sides* (RHSs) of the rules $VP \longrightarrow V AP$ and $VP \longrightarrow V NP$ in the standard representation of PCFGs. These are lists that consist of symbols which are actually the names of other procedures. Therefore when `sample` is applied to them, they themselves recursively sample their RHSs until no more recursion can take place.  Note that we have wrapped our terminal symbols up as thunks so that when they are sampled they deterministically return the terminal symbol.

While it is most common to use PCFGs as models of strings (for linguistic applications), they can be useful as components of any probabilistic model where constituent structure is required. For instance, if you examine the Rational Rules model above, you will note that the hypothesis space of rules is generated from a PCFG&mdash;here the constituent structure is used to ensure that the parts of rules combine together into meaningful rules, that is, to provide a compositional semantics.

## Unfold

LISP is famous for its higher-order list manipulating functions (which you can read about here: [[Deterministic List Manipulating Functions]].) These functions extract common patterns of recursion, resulting in clearer more parsimonious code.

One particular function, called `fold` is especially powerful: it can be used to do any list-based recursion.  In the probabilistic setting there exists an important related procedure called `unfold` which recursively builds up lists.  `unfold` takes three arguments. The first is some object, the second is a transition function, which returns the next object given the last one. The last argument is a predicate that stops the recursion.

<pre>
 (define (unfold current transition stop?)
   (if (stop? current)
       '()
       (pair current (unfold (transition current) transition stop?))))
</pre>

With `unfold` defined we can now refactor our bigram model.

~~~~ {.mit-church}
(define (unfold current transition stop?)
   (if (stop? current)
       '()
       (pair current (unfold (transition current) transition stop?))))

(define vocabulary '(chef omelet soup eat work bake stop))

(define word->distribution
  (mem (lambda (word) (dirichlet (make-list (length vocabulary) 1)))))

(define (transition word)
  (multinomial vocabulary (word->distribution word)))

(define (stop? word) (equal? word 'stop))

(unfold 'start transition stop?)
~~~~


One thing to note about the PCFG example is that the each of the procedures is nearly identical. This suggests that we could write the grammar more succinctly. It turns out that there is a generalization of `unfold` called `tree-unfold` which will do the trick. Using `tree-unfold` we can rewrite our PCFG in a way that abstracts out the recursive structure, and looks much more like the standard notation for PCFGs:

~~~~ {.mit-church}
(define (terminal t) (list 'terminal t))

 (define (unwrap-terminal t) (second t))

 (define (tree-unfold transition start-symbol)
   (if (terminal? start-symbol)
       (unwrap-terminal start-symbol)
       (pair start-symbol
             (map (lambda (symbol) (tree-unfold  transition symbol)) (transition start-symbol)))))

(define (terminal? symbol)
  (if (list? symbol)
      (equal? (first symbol) 'terminal)
      false))

(define (transition nonterminal)
  (case nonterminal
    (('D) (multinomial(list (list (terminal 'the))
                            (list (terminal 'a)))
                      (list (/ 1 2) (/ 1 2))))
    (('N) (multinomial (list (list (terminal 'chef))
                             (list (terminal 'soup))
                             (list (terminal 'omelet)))
                       (list (/ 1 3) (/ 1 3) (/ 1 3))))
    (('V) (multinomial (list (list (terminal 'cooks))
                             (list (terminal 'works)))
                       (list (/ 1 2) (/ 1 2))))
    (('A) (multinomial (list (list (terminal 'diligently)))
                       (list (/ 1 1))))
    (('AP) (multinomial (list (list 'A))
                        (list (/ 1 1))))
    (('NP) (multinomial (list (list 'D 'N))
                        (list (/ 1 1))))
    (('VP) (multinomial (list (list 'V 'AP)
                              (list 'V 'NP))
                        (list (/ 1 2) (/ 1 2))))
    (('S) (multinomial (list (list 'NP 'VP))
                       (list (/ 1 1))))
    (else 'error)))


(tree-unfold transition 'S)

~~~~

Note that this samples a hierarchical (or "parenthesized") sequence of terminals. How would you "flatten" this to return a sequence without parentheses?

Exercise: write a version of the preceding PCFG that draws the RHS distributions from a Dirichlet distribution (as in the hierarchical n-gram model).


