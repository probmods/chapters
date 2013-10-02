% Models for sequences of observations


<!--   iid, exchangeable, (definetti,) n-gram, hmm, PCFG -->

<!-- put in zenith radio / representativeness as an example -->

<!-- Josh's HMM switching HW problem for this section? -->


In the last chapter we learned about common [patterns of inference](patterns-of-inference.html) that can result from a few observations, given the right model structure. 
There are also many common patterns of *data* that arise from certain model structures. 
It is common, for instance, to have a sequence of observations that we believe was each generated from the same causal process: a sequence of coin flips, a series of temperature readings from a weather station, the words in a sentence. 
In this chapter we explore models for sequences of observations, moving from simple models to those with increasingly complex statistical dependence between the observations.


# Independent and Exchangeable Sequences

If the observations have *nothing* to do with each other, except that they have the same distribution, they are called *identically, independently distributed* (usually abbreviated to i.i.d.). For instance the values that come from calling `flip` are i.i.d. To verify this, let's first check whether the distribution of two flips in the sequence look the same (are "identical"):

~~~~
(define (sequence) (repeat 10 flip))

(define sequences (repeat 1000 sequence))

(multiviz 
 (hist (map first sequences) "first flip")
 (hist (map second sequences) "second flip"))
~~~~

Now let's check that the first and second flips are independent, by conditioning on the first and seeing that the distribution of the second is (approximately) unchanged:

~~~~
(define (sequences first-val)
  (mh-query
   1000 10
   (define s (repeat 10 flip))
   (second s)
   (equal? (first s) first-val)))

(multiviz 
 (hist (sequences true)  "second if first is true")
 (hist (sequences false) "second if first is false"))
~~~~

It is easy to build other i.i.d. sequences in Church, we simply construct a stochastic thunk (which, recall, represents a distribution) and evaluate it several times. For instance, here is an extremely simple model for the words in a sentence:

~~~~
(define (thunk) (multinomial '(chef omelet soup eat work bake stop)
                             '(0.0032 0.4863 0.0789 0.0675 0.1974 0.1387 0.0277)))

(repeat 10 thunk)
~~~~

In this example the different words are indeed independent: you can show as above (by conditioning) that the first word tells you nothing about the second word.
However, constructing sequences in this way it is easy to accidentally create a sequence that is not entirely independent. For instance:

~~~~
(define word-probs (if (flip)
'(0.0032 0.4863 0.0789 0.0675 0.1974 0.1387 0.0277)
'(0.0699 0.1296 0.0278 0.4131 0.1239 0.2159 0.0194)))

(define (thunk) (multinomial '(chef omelet soup eat work bake stop)
                             word-probs))

(repeat 10 thunk)
~~~~

While the sequence looks very similar, the words are not independent: learning about the first word tells us something about the `word-probs`, which in turn tells us about the second word. Let's show this in a slightly simpler example:

~~~~
(define (sequences first-val)
  (mh-query
   1000 10
   (define prob (if (flip) 0.2 0.7))
   (define (myflip) (flip prob))
   (define s (repeat 10 myflip))
   (second s)
   (equal? (first s) first-val)))

(multiviz 
 (hist (sequences true)  "second if first is true")
 (hist (sequences false) "second if first is false"))
~~~~

Conditioning on the first value tells us something about the second. This model is thus not i.i.d., but it does have a slightly weaker property: it is [exchangeable](http://en.wikipedia.org/wiki/Exchangeable_random_variables), meaning that the probability of a sequence is the same in any order.

It turns out that exchangeable sequences can always be modeled in the form used for the last example: 
[de Finetti's theorem](http://en.wikipedia.org/wiki/De_Finetti\'s_theorem) says that, under certain technical conditions, any exchangeable sequence can be represented as follows, for some `latent-prior` and `observe` functions:

~~~~
(define latent (latent-prior))

(define (thunk) (observe latent))

(repeat 10 thunk)
~~~~


## Example: Subjective Randomness

[TODO]



# Markov Models

Many systems in computational linguistics make use of ''n-gram models''. An n-gram model is a drastically simplified model of sentence structure where the distribution over words in a particular position depends on the last $(N-1)$ words. N-gram models are a simple example of an unbounded model where the structure of the computation itself depends on probabilistic choices. Here is the Church code for a simple bigram model, also called a ''Markov model'', where the next word depends on the last.

~~~~ 
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
`sample-words` is a recursion which builds up a list of words by sampling the next word conditional on the last. Each word is sampled from a multinomial distribution whose parameters are fixed. We start the recursion by sampling conditional on the special symbol `start`.  When we sample the symbol `stop` we end the recursion. Like the geometric distribution defined above, this stochastic recursion can produce unbounded structures---in this case lists of words of arbitrary length. 

The above code may seem unnecessarily complex because it explicitly lists every transition probability. Suppose that we put a prior distribution on the multinomial transitions in the n-gram model. Using `mem` this is very straightforward:

~~~~
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

We now have a ''hierarchical'' n-gram model, which is both simpler to write and more powerful in the sense that it can learn the transition probabilities (rather than requiring them to be given).


# Hidden Markov Models

Another popular model in computational linguistics is the hidden Markov model (HMM). The HMM extends the Markov model by assuming that the "actual" states aren't observable. Instead there is an ''observation model'' that generates an observation from each "hidden state". We use the same construction as above to generate an unknown observation model.

~~~~
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


# Probabilistic Context-free Grammars

The models above generate sequences of words, but lack constituent structure (or "hierarchical structure" in the linguistic sense). 

Probabilistic context-free grammars (PCFGs) are a straightforward (and canonical) way to generate sequences of words with constituent structure. There are many ways to write a PCFG in Church. One especially direct way (inspired by Prolog programming) is to let each non-terminal be represented by a Church procedure; here constituency is embodied by one procedure calling another---that is by causal dependence.

~~~~
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

We have used the procedure `sample`, which applies a thunk (to no arguments), resulting in a sample. `sample` is in fact trivial---it can be defined by:
`(define (sample distribution) (apply distribution '()))`.

Now, let's look at one of the procedures defining our PCFG in detail.

	(define VP (lambda ()
	             (map sample
	                  (multinomial
	                   (list (list V AP) 
	                         (list V NP))
	                   (list (/ 1 2) (/ 1 2)))))).

When `VP` is called it `map`s `sample` across a list which is sampled from a multinomial distribution: in this case either `(V AP)` or `(V NP)`. These two lists correspond to the ''right-hand sides'' (RHSs) of the rules $VP \longrightarrow V AP$ and $VP \longrightarrow V NP$ in the standard representation of PCFGs. These are lists that consist of symbols which are actually the names of other procedures. Therefore when `sample` is applied to them, they themselves recursively sample their RHSs until no more recursion can take place.  Note that we have wrapped our terminal symbols up as thunks so that when they are sampled they deterministically return the terminal symbol.

While it is most common to use PCFGs as models of strings (for linguistic applications), they can be useful as components of any probabilistic model where constituent structure is required. For instance, if you examine the Rational Rules model above, you will note that the hypothesis space of rules is generated from a PCFG---here the constituent structure is used to ensure that the parts of rules combine together into meaningful rules, that is, to provide a compositional semantics.

# Unfold

LISP is famous for its higher-order list manipulating functions (which you can read about here: [[Deterministic List Manipulating Functions]].) These functions extract common patterns of recursion, resulting in clearer more parsimonious code.

One particular function, called `fold` is especially powerful: it can be used to do any list-based recursion.  In the probabilistic setting there exists an important related procedure called `unfold` which recursively builds up lists.  `unfold` takes three arguments. The first is some object, the second is a transition function, which returns the next object given the last one. The last argument is a predicate that stops the recursion.

<pre>
 (define (unfold current transition stop?)
   (if (stop? current)
       '()
       (pair current (unfold (transition current) transition stop?))))
</pre>

With `unfold` defined we can now refactor our bigram model. 

~~~~
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

~~~~
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


# Excercises

<!-- Write a version of the preceding PCFG that draws the RHS distributions from a Dirichlet distribution (as in the hierarchical n-gram model).-->

# References
