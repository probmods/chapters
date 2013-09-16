% Algorithms for inference

# Markov chains as samplers

Here is a markov chain:

~~~~
(define (transition state)
  (case state
    (('a) (multinomial '(a b c d) '(0.48 0.48 0.02 0.02)))
    (('b) (multinomial '(a b c d) '(0.48 0.48 0.02 0.02)))
    (('c) (multinomial '(a b c d) '(0.02 0.02 0.48 0.48)))
    (('d) (multinomial '(a b c d) '(0.02 0.02 0.48 0.48)))))

       
(define (chain state n)
  (if (= n 0)
      state
      (chain (transition state) (- n 1))))

(hist (repeat 2000 (lambda () (chain 'a 10))) "a 10")
(hist (repeat 2000 (lambda () (chain 'c 10))) "c 10")
(hist (repeat 2000 (lambda () (chain 'a 30))) "a 30")
(hist (repeat 2000 (lambda () (chain 'c 30))) "c 30")
'done
~~~~

After only a few steps the distribution is highly influence by the starting state. In the long run the distribution looks the same from any starting state. This is the '''stable distribution'''. In this case it is uniform&mdash;we have another (fairly baroque!) way to sample from the uniform distribution on `'(a b c d)`!

Of course we could have sampled from the uniform distribution using other Markov chains. For instance the following chain is more natural, since it transitions uniformly:

~~~~
(define (transition state)
  (uniform-draw '(a b c d)))
       
(define (chain state n)
  (if (= n 0)
      state
      (chain (transition state) (- n 1))))

(hist (repeat 2000 (lambda () (chain 'a 2))) "a 2")
(hist (repeat 2000 (lambda () (chain 'c 2))) "c 2")
(hist (repeat 2000 (lambda () (chain 'a 10))) "a 10")
(hist (repeat 2000 (lambda () (chain 'c 10))) "c 10")
'done
~~~~

Notice that this chain converges much more quickly to the uniform distribution---this is called the ''burn-in time''. 



## Markov chains with lag

We get the same distribution from samples from a single run, if we wait long enough between samples:

~~~~
(define (transition state)
  (case state
    (('a) (multinomial '(a b c d) '(0.48 0.48 0.02 0.02)))
    (('b) (multinomial '(a b c d) '(0.48 0.48 0.02 0.02)))
    (('c) (multinomial '(a b c d) '(0.02 0.02 0.48 0.48)))
    (('d) (multinomial '(a b c d) '(0.02 0.02 0.48 0.48)))))

       
(define (chain state n)
  (if (= n 0)
      (list state)
      (pair state (chain (transition state) (- n 1)))))

(define (take-every lst n)
  (if (< (length lst) n)
      '()
      (pair (first lst) (take-every (drop lst n) n))))

(hist (drop (chain 'a 100) 30) "burn-in 30, lag 0")
(hist (take-every (drop (chain 'a 2000) 30) 20) "burn-in 30, lag 10")
'done
~~~~


## Markov chains with infinite state space

This can also work over infinite state spaces. Here's a markov chain whose stationary distribution is geometric conditioned to be greater than 2:

~~~~
(define theta 0.7)

(define (transition state)
  (if (= state 3)
      (multinomial (list 3 4)
                   (list (- 1 (* 0.5 theta)) (* 0.5 theta)))
      (multinomial (list (- state 1) state (+ state 1))
                   (list 0.5 (- 0.5 (* 0.5 theta)) (* 0.5 theta)))))
  
(define (chain state n)
  (if (= n 0)
      state
      (chain (transition state) (- n 1))))

(hist (repeat 2000 (lambda () (chain 3 20))) "markov chain")
'done
~~~~

This Markov chain samples (in the long run) from the distribution specified by the Church query:

~~~~
(define (geometric theta) (if (flip theta) (+ 1 (geometric theta)) 1))

(query
  (define x (geometric 0.7))
  x
  (> x 2))
~~~~

That is, the Markov chain ''implements'' the query.



# Getting the right chain: MCMC

It turns out that for any (conditional) distribution there is a Markov chain with that stationary distribution. How can we find one when we need it? There are several methods for constructing them&mdash;they go by the name ''Markov chain Monte Carlo''.

First, if we have a target distribution, how can we tell if a Markov chain has this target distribution as it's stationary distribution? Let $p(x)$ be the target distribution, and let $\pi(x \rightarrow x')$ be the transition distribution (i.e. the `transition` function in the above programs). Since the stationary distribution is characterized by not changing when the transition is applied to it we have:
:$p(x') = \sum_x p(x)\pi(x \rightarrow x')$
Note that this stationarity equation holds for the distribution as a whole&mdash;a single state can of course be moved by the transition.

There is another condition, called ''detailed balance'', that is sufficient (but not necessary) to give the above stationarity condition, and is often easier to work with:
:$p(x)\pi(x \rightarrow x') = p(x')\pi(x' \rightarrow x)$
To show that detailed balance implies stationarity, substitute the right-hand side of the detailed balance equation into the stationarity equation (replacing the summand), then simplify.


## Satisfying detailed balance: MH

The math is fine, but how do we come up with a $q$ that satisfies detailed balance? One way it the '''Metropolis-Hastings''' recipe.

We start with a proposal distribution $q(x\rightarrow x')$ (which does not have the target distribution as its stationary distribution). We correct this into a transition function with the right stationary distribution by either accepting or rejecting each proposed transition. We accept with probability:
:$\min\left(1, \frac{p(x')q(x'\rightarrow x)}{p(x)q(x\rightarrow x')}\right).$ 
Exercise: show that this gives an actual transition probability (i.e. $\pi(x\rightarrow x')$) that satisfied detailed balance (Hint: the probability of transitioning comes from proposing a given new state, then accepting it; if you don't accept the proposal you "transition" to the original state).

In Church the MH recipe looks like:
<pre>
(define (target-distr x) ...)
(define (proposal-fn x) ...)
(define (proposal-distr x1 x2) ...)

(define (accept? x1 x2) 
  (flip (min 1 (/ (* (target-distr x2) (proposal-distr x2 x1)) 
                  (* (target-distr x1) (proposal-distr x1 x2))))))

(define (transition x)
  (let ((proposed-x (proposal-fn x)))
    (if (accept? x proposed-x) proposed-x x)))

(define (mcmc state iterations)
  (if (= iterations 0)
      '()
    (pair state (mcmc (transition state) (- iterations 1)))))
</pre>

<collapse title="mcmc with lag">

~~~~
(define (target-distr x) ...)
(define (proposal-fn x) ...)
(define (proposal-distr x1 x2) ...)

(define (accept? x1 x2) 
  (flip (min 1 (/ (* (target-distr x2) (proposal-distr x2 x1)) 
                  (* (target-distr x1) (proposal-distr x1 x2))))))

(define (transition x)
  (let ((proposed-x (proposal-fn x)))
    (if (accept? x proposed-x) proposed-x x)))

(define (mcmc state iterations lag)
  (if (= iterations 0)
      '()
      (let ((rest-chain (mcmc (transition state) (- iterations 1) lag)))
        (if (= 0 (mod iterations lag))
            (pair state rest-chain)
            rest-chain))))
~~~~

</collapse>

Note that in order to use this recipe we need to have a function that computes the target probability (not just one that samples from it) and the transition probability, but they need not be normalized (since the normalization terms will cancel).

We can use this recipe to construct a Markov chain for the conditioned geometric distribution, as above, by using a proposal distribution that is equally likely to propose one number higher or lower:

~~~~
(define theta 0.7)

;;the target distribution (not normalized):
(define (target-distr x) 
  (if (< x 3) ;;the condition
      0.0     ;;prob is 0 if condition is violated
      (* (- 1 theta) (expt theta x)))) ;;otherwise prob is (proportional to) geometric distrib.

;;the proposal function and distribution,
;;here we're equally likely to propose up or down one.
(define (proposal-fn x) (if (flip) (- x 1) (+ x 1))) 
(define (proposal-distr x1 x2) 0.5)

;;the MH recipe:
(define (accept? x1 x2) 
  (flip (min 1.0 (/ (* (target-distr x2) (proposal-distr x2 x1)) 
                    (* (target-distr x1) (proposal-distr x1 x2))))))

(define (transition x)
  (let ((proposed-x (proposal-fn x)))
    (if (accept? x proposed-x) proposed-x x)))

;;the MCMC loop:
(define (mcmc state iterations)
  (if (= iterations 0)
      '()
      (pair state (mcmc (transition state) (- iterations 1)))))


(hist (mcmc 3 1000) "mcmc for conditioned geometric")
'done
~~~~

The transition function that is automatically derived using the MH recipe is equivalent to the one we wrote by hand above.



## MH on program executions

How could we use the MH recipe for arbitrary Church programs? What's the state space? What are the proposals?

Church MH takes as the state space the space of all executions of the code inside a query. Equivalently this is the space of all random choices that may be used in to execute this code (unused choices can be ignored withut loss of generality by marginalizing). The un-normalized score is just the product of the probabilities of all the random choices, or zero if the conditioner doesn't evaluate to true.

Proposals are made by changing a single random choice, then updating the execution (which may result in choices being created or deleted).

To get this all to work we need a way to identify random choices across different executions of the program. We can do this by augmenting the program with ''call names''.


## States with structure and Gibbs sampling

Above the states were single entities (letters or numbers), but of course we may have probabilistic models where the state is more complex. In this case, element-wise proposals (that change a single part of the state at a time) can be very convenient.

For instance, consider the Ising model:
~~~~
~~~~

Here the state is a list of Boolean values. We can use the MH recipe with proposals that change a single element of this list at a time:
~~~~
~~~~

~~~~
(mh-query 1000 1
          (define v (repeat 10 (lambda () (if (flip) 1 0))))
          
          (begin (repeat 100000 (lambda () (+ 100 100)))
                 (barplot (map pair (iota 10) v) "bar") 
                 v)
          
          (all (map (lambda (a b) (flip (if (equal? a b) 1.0 0.2))) (rest v) (drop-right v 1))))
'done
~~~~


# Biases of MCMC

An MCMC sampler is guaranteed to take unbiased samples from its stationary distribution ''in the limit'' of arbitrary time between samples. In practice MCMC will have characteristic biases in the form of long burn-in and slow mixing. 

We already saw an example of slow mixing above: the first Markov chain we used to sample from the uniform distribution would take (on average) several iterations to switch from `a` or `b` to `c` or `d`. In order to get approximately independent samples, we needed to wait longer than this time between taking iterations. In contrast, the more efficient Markov chain (with uniform transition function) let us take sample with little lag. In this case poor mixing was the result of a poorly chosen transition function. Poor mixing is often associated with multimodal distributions.



# Importance sampling 

Imagine we want to compute the expected value (ie. long-run average) of the composition of a thunk `p` with a rela-valued function `f`. This is:
~~~~
(define (p) ...)
(define (f x) ...)
(mean (repeat 1000 (lambda () (f (p)))))
~~~~
Mathematically this is:
:$E_p(f) = \sum_x f(x) p(x) \simeq \frac{1}{N}\sum_{x_i}f(x)$
where $x_i$ are N samples drawn from the distribution `p`.

What if `p` is hard to sample from? E.g. what if it is a conditional:
~~~~
(define (p) (query ...))
(define (f x) ...)
(mean (repeat 1000 (lambda () (f (p)))))
~~~~
One thing we could do is to sample from the conditional (via rejection or MCMC), but this can be difficult or expensive. We can also sample from a different distribution `q` and then correct for the difference:
:$E_p(f) = \sum_x f(x) \frac{p(x)}{q(x)}q(x) \simeq \frac{1}{N} \sum_{x_i}f(x)\frac{p(x)}{q(x)} $
where $x_i$ are N samples drawn from the distribution `q`. This is called '''importance sampling'''. The factor $\frac{p(x)}{q(x)}$ is called the ''importance weight''.

If we want samples from distribution `p`, rather than an expectation, we can take N importance samples then ''resample'' N times from the discrete distribution on these samples with probabilities proportional to the importance weights. In the limit of many samples this resampling gives samples from the desired distribution. (Why?)

## Sequential Importance Resampling
