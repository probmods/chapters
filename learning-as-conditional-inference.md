% Learning as Conditional Inference

>***Note: This chapter has not been revised for the new format and Church engine. Some content may be incomplete! Some example may not work!***


<!--
-revise learning as induction section:
  -be more explicit about learning curves, trajectories.
  -infinite hypothesis spaces. poverty of stimulus arguments, inductive bias.
  -get TOC
  -add number game?
-->



Just as causal reasoning is a form of conditional inference, so is causal learning: discovering the persistent causal processes or causal properties of objects in the world. The line between "reasoning" and "learning" is unclear in cognition. We often think of learning as conditional inference about some object or process that can produce a potentially infinite sequence or set of outcomes, or *data points*, only some of which are observed at any time. What can be inferred about the object or process given a certain subset of the observed data? How much more can we learn as the size of the observed data set increases -- what is the *learning curve*?

To express learning as conditional inference, we require a program that describes a *hypothesis space* of possible processes that could have produced the observed data. Each of these hypotheses is itself one possible output of a higher-level function, a *hypothesis generator*. That higher-order function expresses our prior knowledge about how the process we observe is likely to work, before we have observed any data. After we observe some data, we now revise our beliefs through conditional inference.

## Example: Learning About Coins

As a simple illustration of learning, imagine that a friend pulls a coin out of her pocket and offers it to you to flip.  You flip it five times and observe a set of all heads,

  `(H H H H H)`.

Does this seem at all surprising?  To most people, flipping five heads in a row is a minor coincidence but nothing to get excited about.  But suppose you flip it five more times and continue to observe only heads.  Now the data set looks like this:

  `(H H H H H H H H H H)`.

Most people would find this a highly suspicious coincidence and begin to suspect that perhaps their friend has rigged this coin in some way -- maybe it's a weighted coin that always comes up heads no matter how you flip it.  This inference could be stronger or weaker, of course, depending on what you believe about your friend or how she seems to act; did she offer a large bet that you would flip more heads than tails?  Now you continue to flip five more times and again observe nothing but heads -- so the data set now consists of 15 heads in a row:

  `(H H H H H H H H H H H H H H H).`

Regardless of your prior beliefs, it is almost impossible to resist the inference that the coin is a trick coin.

This "learning curve" reflects a highly systematic and rational process of conditional inference.  Here's how to describe it using a probabilistic program<ref>following on Griffiths and Tenenbaum, "From mere coincidences to meaningful discoveries", Cognition, 2007, who present a more in-depth rational analysis and empirical study of people's sense of coincidence</ref>.  Recall how earlier we used stochastic functions with no inputs, or *thunks*, to describe coins of different weights.  Each such function now represents a hypothesis about the process generating our observations.  In the program below, the function `coin` represents these hypotheses.  The higher-order function `make-coin` takes one input, `weight`, and returns a `coin` thunk with that weight embedded in its definition.

For simplicity let's consider only two hypotheses, two possible definitions of `coin`, representing a fair coin and a trick coin that produces heads 95% of the time.  A priori, how likely is any coin offered up by a friend to be a trick coin?  Of course there is no objective or universal answer to that question, but for the sake of illustration let's assume that the *prior probability* of seeing a trick coin is 1 in a 1000, versus 999 in 1000 for a fair coin.  These probabilities determine the weight passed to `make-coin`.  Now to inference:

~~~~ {.mit-church}
(define observed-data '(h h h h h))
(define num-flips (length observed-data))

(define samples
  (mh-query
     1000 10

     (define fair-prior 0.999)
     (define fair-coin? (flip fair-prior))

     (define make-coin (lambda (weight) (lambda () (if (flip weight) 'h 't))))
     (define coin (make-coin (if fair-coin? 0.5 0.95)))

     fair-coin?

     (equal? observed-data (repeat num-flips coin))
   )
)
(hist samples "Fair coin?")
~~~~

Try varying the number of flips and the number of heads observed.  You should be able to reproduce the intuitive learning curve described above.  Observing 5 heads in a row is not enough to suggest a trick coin, although it does raise the hint of this possibility: its chances are now a few percent, approximately 30 times the baseline chance of 1 in a 1000.  After observing 10 heads in a row, the odds of trick coin and fair coin are now roughly comparable, although fair coin is still a little more likely.  After seeing 15 or more heads in a row without any tails, the odds are now strongly in favor of the trick coin.

Study how this learning curve depends on the choice of `fair-prior`.   There is certainly a dependence.  If we set `fair-prior` to be 0.5, equal for the two alternative hypotheses, just 5 heads in a row are sufficient to favor the trick coin by a large margin.  If `fair-prior` is 99 in 100, 10 heads in a row are sufficient.  We have to increase `fair-prior` quite a lot, however, before 15 heads in a row is no longer sufficient evidence for a trick coin: even at `fair-prior` = 0.9999, 15 heads without a single tail still weighs in favor of the trick coin.  This is because the evidence in favor of a trick coin accumulates exponentially as the data set increases in size; each successive `H` flip increases the evidence by nearly a factor of 2.

Learning is always about the shift from one state of knowledge to another.  The speed of that shift provides a way to diagnose the strength of a learner's initial beliefs.   Here, the fact that somewhere between 10 and 15 heads in a row is sufficient to convince most people that the coin is a trick coin suggests that for most people, the a priori probability of encountering a trick coin in this situation is somewhere between 1 in a 100 and 1 in 10,000 -- a reasonable range.  Of course, if you begin with the suspicion that any friend who offers you a coin to flip is liable to have a trick coin in his pocket, then just seeing five heads in a row should already make you very suspicious -- as we can see by setting `fair-prior` to a value such as 0.9.

## Example: Learning a Continuous Parameter (or, Learning with an Infinite Hypothesis Space)

The previous example represents perhaps the simplest imaginable case of learning.  Typical learning problems in human cognition or AI are more complex in many ways.  For one, learners are almost always confronted with more than two hypotheses about the causal structure that might underlie their observations.  Indeed, hypothesis spaces for learning are often infinite.  Countably infinite hypothesis spaces are encountered in models of learning for domains traditionally considered to depend on "discrete" or "symbolic" knowledge; hypothesis spaces of grammars in language acquisition are a canonical example.  Hypothesis spaces for learning in domains traditionally considered more "continuous", such as perception or motor control, are typically uncountable and parametrized by one or continuous dimensions.  In causal learning, both discrete and continuous hypothesis spaces typically arise.  In statistics and machine learning, making conditional inferences over continuous hypothesis spaces given data is usually called *parameter estimation*.

We can explore a basic case of learning with continuous hypothesis spaces by slightly enriching our coin flipping example.  Suppose that our hypothesis generator `make-coin`, instead of simply flipping a coin to determine which of two coin weights to use, can choose *any* coin weight between 0 and 1.  For this we need to introduce a new kind of XRP that outputs a real number in the interval $[0,1]$, corresponding to the coin weight, in addition to `flip` which outputs a Boolean truth value.  The simplest such XRP in Church is called `uniform`, which outputs a random real number chosen uniformly between a given upper and lower bound.  The following program computes conditional inferences about the weight of a coin drawn from a *prior distribution* described by the `uniform` function, conditioned on a set of observed flips.

~~~~ {.mit-church}
(define observed-data '(h h h h h))
(define num-flips (length observed-data))
(define num-samples 1000)
(define prior-samples (repeat num-samples (lambda () (uniform 0 1))))

(define samples
  (mh-query
     num-samples 10

     (define coin-weight (uniform 0 1))

     (define make-coin (lambda (weight) (lambda () (if (flip weight) 'h 't))))
     (define coin (make-coin coin-weight))

     coin-weight

     (equal? observed-data (repeat num-flips coin))
   )
)

(hist (append '(0) '(1) prior-samples) 10 "Coin weight, prior to observing data")
(hist (append '(0) '(1) samples) 10 "Coin weight, conditioned on observed data")
~~~~

Because the output of inference is a set of conditional samples, and each sample is drawn from the uncountable interval $[0,1]$, we cannot expect that any of these samples will correspond exactly to the true coin weight or the single most likely value.  By binning the samples, however, we can get a meaningful estimate of how likely the coin weight is to fall in any subinterval of $[0,1]$.  We call the distribution of samples produced by conditional inference on data the *conditional distribution*, or sometimes the *posterior distribution*, to contrast with the prior distribution expressing our a priori beliefs.   The code above illustrates both prior and conditional distributions, each with a histogram of 1000 samples.  (We append a single 0 and 1 to each set of samples in order to force the histograms to cover the whole range $[0,1]$.)

Experiment with different data sets, varying both the number of flips and the relative proportion of heads and tails.  How does the shape of the conditional distribution change?  The location of its peak reflects a reasonable "best guess" about the underlying coin weight.  It will be roughly equal to the proportion of heads observed, reflecting the fact that our prior knowledge is basically uninformative; a priori, any value of `coin-weight` is equally likely.  The spread of the conditional distribution reflects a notion of confidence in our beliefs about the coin weight.  The distribution becomes more sharply peaked as we observe more data, because each flip, as an independent sample of the process we are learning about, provides additional evidence the process's unknown parameters.

When studying learning as conditional inference, that is when considering an *ideal learner model*, we are particularly interested in the dynamics of how inferred hypotheses change as a function of amount of data (often thought of as time the learner spends acquiring data). We can map out the *trajectory* of learning by plotting a summary of the posterior distribution over hypotheses as a function of the amount of observed data. Here we plot the mean of the samples of the coin weight (also called the *expected* weight) in the above example:

~~~~ {.mit-church}
(define make-coin (lambda (weight) (lambda () (if (flip weight) 'h 't))))

(define (samples data)
  (mh-query 400 10

     (define coin-weight (uniform 0 1))

     (define coin (make-coin coin-weight))

     coin-weight

     (equal? data (repeat (length data) coin))
   )
)

(define true-weight 0.9)
(define true-coin (make-coin true-weight))
(define full-data-set (repeat 100 true-coin))
(define observed-data-sizes '(1 3 6 10 20 30 50 70 100))
(define (estimate N) (mean (samples (take full-data-set N))))
(map (lambda (N)
       (lineplot-value (pair N (estimate N)) "Learning trajectory"))
     observed-data-sizes)
~~~~

Try plotting different kinds of statistics, e.g., the absolute difference between the true mean and the estimated mean (using the function `abs`), or a confidence measure like the standard error of the mean.

Notice that different runs of this program can give quite different trajectories, but always end up in the same place in the long run. This is because the data set used for learning is different on each run. Of course, we are often interested in the average behavior of an ideal learner: we would average this plot over many randomly chosen data sets, simulating many different learners (however, this is too time consuming for a quick simulation).

Most real world problems of parameter estimation, or learning continuous parameters of causal models, are significantly more complex than this simple example.  They typically involve joint inference over more than one parameter at a time, with a more complex structure of functional dependencies.  They also often draw on stronger and more interestingly structured prior knowledge about the parameters, rather than just assuming uniform initial beliefs.  Yet the same basic logic of how to approach learning as conditional inference applies.

What if we would like to learn about the weight of a coin, or any parameters of a causal model, for which we have some informative prior knowledge?  It is easy to see that the previous Church program doesn't really capture our prior knowledge about coins, or at least not in the most familiar everyday scenarios.  Imagine that you have just received a quarter in change from a store -- or even better, taken it from a nicely wrapped-up roll of quarters that you have just picked up from a bank.  Your prior expectation at this point is that the coin is almost surely fair.  If you flip it 10 times and get 7 heads out of 10, you'll think nothing of it; that could easily happen with a fair coin and there is no reason to suspect the weight of this particular coin is anything other than 0.5.  But running the above query with uniform prior beliefs on the coin weight, you'll guess the weight in this case is around 0.7.

Our hypothesis generating function needs to be able to draw `coin-weight` not from a uniform distribution, but from some other function that can encode various expectations about how likely the coin is to be fair, skewed towards heads or tails, and so on. We use the beta distribution, encoded in the `beta` XRP.  `beta`, like `uniform` is a random procedure that outputs a real number in the interval $[0,1]$, and indeed it generalizes `uniform` in a natural way.  It is the most common prior distribution for learning about coin weights or similar parameters in statistical modeling and machine learning.  It takes two parameters known as *pseudo-counts*, because they can be thought of as the number of hypothetical heads and tails that were observed in some (imagined) prior set of coin tosses.
<!-- Given some data, conditional inferences about the coin weight can be expressed simply in terms of a mixture of these imagined heads and tails and the actual observed heads and tails.  -->
Here are a few examples of `beta`'s output for different choices of the parameters:
:

<img src='images/Beta_distribution_pdf.png' width='400' />
The height of each curve in these plots represents the relative probability of generating a coin weight at the corresponding x-value, for a range of `beta` pseudo-count parameters.
Get a feeling for the beta distribution by sampling from it with different psuedo-count parameters (note that the parameters must be greater than zero, but can be less than one):

~~~~
(define (beta-dist) (first (beta 10 1)))
(hist (append '(0) '(1) (repeat 1000 beta-dist)) 20 "beta distribution")
~~~~
To understand how the pseudo-counts work notice that as the proportion of pseudo-counts favors either heads or tails, then the beta distribution becomes more skewed towards coin weights which are biased in that direction. When the pseudo-counts are symmetric, then the distribution is peaked at .5. As the **total** number of pseudo-counts becomes greater then the distribution becomes more and more steeply peaked. For instance, $Beta(2,2)$ and $Beta(10,10)$ both have their mean at .5, but the latter is much more tightly peaked. Note that $Beta(1,1)$ is the uniform distribution on the (0,1) interval. When the pseudo-counts are less than 1 then the distribution becomes more steeply peaked close to 0 and 1 (this is also where our interpretation of pseudo-counts as previous flips starts to break down).

There is a deeper way to understand the family of beta distributions, and why we call its parameters *pseudo-counts*.  It is in a certain sense the natural parameterization of the full space of beliefs that can be formed by about a coin by flipping it, because each setting is equivalent to what you would learn about a coin from some set of observations.  This belief space is closed under conditional inference: if you describe your prior knowledge as a beta distribution, and you update your beliefs according to conditional inference, your posterior belief state will be guaranteed to be in the same space (another beta distribution).

The following Church program computes conditional inferences for an observed sequence of 7 heads out of 10, under the assumption of a moderately strong prior belief that the coin is fair or near-fair in its weight.

~~~~ {.mit-church}
(define observed-data '(h h h t h t h h t h))
(define num-flips (length observed-data))
(define num-samples 1000)
(define pseudo-counts '(10 10))
(define prior-samples (repeat num-samples (lambda () (first (beta (first pseudo-counts) (second pseudo-counts))))))

(define samples
  (mh-query
     num-samples 10

     (define coin-weight (first (beta (first pseudo-counts) (second pseudo-counts))))

     (define make-coin (lambda (weight) (lambda () (if (flip weight) 'h 't))))
     (define coin (make-coin coin-weight))

     coin-weight

     (equal? observed-data (repeat num-flips coin))
   )
)

(hist (append '(0) '(1) prior-samples) 10 "Coin weight, prior to observing data")
(hist (append '(0) '(1) samples) 10 "Coin weight, conditioned on observed data")
~~~~

Contrast both the prior distribution and the conditional distribution that this program produces with those produced above using a uniform prior on coin weight.  The prior distribution expresses much more confidence that the weight is near 0.5, and the peak moves away from 0.5 only slightly after seeing 7 out of 10 heads.  The peak of the conditional distribution is located roughly at $(7+10)/(7+3+10+10) = 17/30 \approx 0.567$, which we estimate by adding the actual observed heads and tails with the imagined heads and tails encoded in the $beta(10,10)$ prior.
<!-- add a link here to a discussion of conjugate models? -->
This seems intuitively reasonable: unless we have strong reason to suspect a trick coin, seeing 7 out of 10 heads is not much of a coincidence and shouldn't sway our inferences very much.  If we want to capture our prior knowledge when flipping a quarter out of a roll fresh from the bank, we should probably choose a considerably stronger prior, such as $beta(100,100)$ or even $beta(1000,1000)$.  Try re-running the code above with a much stronger beta prior and you'll see that the coin weight estimate hardly changes at all after seeing 7 out of 10 heads -- just as it should intuitively.

Is the family of Beta distributions sufficient to represent all of people's intuitive prior knowledge about the weights of typical coins?  It would be mathematically appealing if so, but unfortunately people's intuitions are too rich to be summed up with a single Beta distribution.  To see why, imagine that you flip this quarter fresh from the bank and flip it 25 times, getting heads every single time!  Using a Beta prior with pseudo-counts of 100, 100 or 1000, 1000 seems reasonable to explain why seeing 7 out of 10 heads does not move our conditional estimate of the weight very much at all from its prior value of 0.5, but this doesn't fit at all what we think if we see 25 heads in a row.  Try running the program above with a coin weight drawn from $Beta(100,100)$ and an observed data set of 25 heads and no tails.  The most likely coin weight in the conditional inference now shifts slightly towards a heads-bias, but it is far from what you would actually think given these (rather surprising!) data.  No matter how strong your initial belief that the bank roll was filled with fair coins, you'd think: "25 heads in a row without a single tail?  Not a chance this is a fair coin.  Something fishy is going on... This coin is almost surely going to come up heads forever!"  As unlikely as it is that someone at the bank has accidentally or deliberately put a trick coin in your fresh roll of quarters, that is not nearly as unlikely as flipping a fair coin 25 times and getting no tails.

Imagine the learning curve as you flip this coin from the bank and get 5 heads in a row... then 10 heads in a row... then 15 heads... and so on.  Your beliefs seem to shift from "fair coin" to "trick coin" hypotheses discretely, rather than going through a graded sequence of hypotheses about a continuous coin weight moving smoothly between 0.5 and 1.  It is clear that this "trick coin" hypothesis, however, is not merely the hypothesis of a coin that always (or almost always) comes up heads, as in the first simple example in this section where we compared two coins with weight 0.5 and 0.95.  Suppose that you flipped a quarter fresh from the bank 100 times and got 85 heads and 15 tails.  As strong as your prior belief starts out in favor of a fair coin, this coin also won't seem fair.  Using a strong beta prior (e.g., $beta(100,100)$ or $beta(1000,1000)$) suggests counterintuitively that the weight is still near 0.5 (respectively, 0.52 or 0.62). Given the choice between a coin of weight 0.5 and 0.95, weight 0.95 is somewhat more likely.  But neither of those choices matches intuition at this point, which is probably close to the empirically observed frequency: "This coin obviously isn't fair, and given that it came up heads 85/100 times, my best guess is it that it will come heads around 85% of the time in the future."  Confronted with these anomalous sequences, 25/25 heads or 85/100 heads from a freshly unwrapped quarter, it seems that the evidence shifts us from an initially strong belief in a fair coin (something like a $beta(1000,1000)$ prior) to a strong belief in a discretely different alternative hypothesis, a biased coin of some unknown weight (more like a uniform or $beta(1,1)$ distribution). Once we make the transition to the biased coin hypothesis we can estimate the coin's weight on mostly empirical grounds, effectively as if we are inferring that we should "switch" our prior on the coin's weight from a strongly symmetric beta to a much more uniform distribution.

We will see later on how to explain this kind of belief trajectory -- and we will see a number of learning, perception and reasoning phenomena that have this character.  The key will be to describe people's prior beliefs using more expressive programs than we can capture with a single XRP representing distributions familiar in statistics.   Our intuitive theories of the world have a more abstract structure, embodying a hierarchy of more or less complex mental models.


# Exercises

1. Write a church program that reproduces approximately the model from Griffiths and Tenenbaum (2006), "Optimal predictions in everyday cognition", Psychological Science.  Specifically, make a version of Figure 1, for Gaussian and Gamma priors (the Erlang is a special case of a Gamma distribution).  Your version of this figure can be discrete and approximate, using the church functions for drawing histograms of samples `(hist and density)` and line plots with discrete data points `(lineplot ...)` that are introduced in the churchserv examples on the [[Learning as Conditional Inference]] page.

(a) Your basic programs should do two things: (1) Draw samples from the priors for various parameter settings (e.g., mean and variance of the Gaussian), which should approximate the top panels of Fig 1; (2) Compute the prediction function, the median of the posterior for $t_{total}$ conditioned on observing one value of $t$ sampled from between 0 and $t_{total}$, which should approximate the bottom panels of Fig 1. Plot the median posterior prediction as a function of the observed sample of $t$ for approximately 7-10 different values, enough to give a good sense of the shape of the function.

(b) Modify your program for the prediction function to condition on the proposition that $t_{total}$ is greater than or equal to some observed quantity $t$, rather than taking $t$ to be a random sample from between 0 and $t_{total}$.  How does the prediction function change as a result of this modification, either qualitatively or quantitatively?  Why does it change?  (Extra credit: The appendix of Griffiths and Tenenbaum (2006) derives the prediction function in (a) analytically, using calculus.  Derive the prediction function for (b) analytically using a similar approach, and show how the two different mathematical forms derived correspond to the sampling-based approximate results that church returns.)

(c) From a Bayesian viewpoint, the two different church programs described in (a) and (b) correspond to using two different likelihood functions, or observation models, with the same prior on event durations or magnitudes.  What kinds of natural learning situations would be best captured by these different likelihood function or observation models?

