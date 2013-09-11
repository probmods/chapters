% Conditioning

We have built up a tool set for constructing probabilistic generative models. These can represent knowledge about causal processes in the world: running one of these programs samples a particular outcome by sampling a "causal history" for that outcome. However, the power of a causal model lies in the flexible ways it can be used to reason about the world. For instance, if we have a generative model in which X depends on Y, we may ask: "assuming I have observed X, how must Y have been?" In this section we describe how a wide variety of inferences can be made from a single generative model by *conditioning* the model on an assumed or observed fact.

Much of cognition can be understood in terms of conditional inference.  In its most basic form, *causal reasoning* is conditional inference: given some observed effects, what were the likely causes?  *Predictions* are conditional inferences in the opposite direction: given that I have observed some known cause, what are its likely effects?  These inferences come from conditioning a probabilistic program expressing a "causal model", or an understanding of how effects depend on causes.  The acquisition of that causal model, or *learning*, is also conditional inference at a higher level of abstraction: given our general knowledge of how causal relations operate in the world, and some observed events in which candidate causes and effects co-occur in various ways, what specific causal relations are likely to hold between these observed variables?

To see how these concepts apply in a domain that is not usually thought of as causal, consider language.  The core questions of interest in the study of natural language are all at heart conditional inference problems.  Given beliefs about the syntactic structure of my language, and an observed sentence, what should I believe about the syntactic structure of that sentence? This is just the *parsing* problem.  The complementary problem of *speech production* is as follows: given some beliefs about the syntactic structure of my language (and beliefs about others' beliefs about that), and a particular thought I want to express, how should I encode the thought syntactically? Finally, the discovery or *acquisition* problem: given general knowledge about universal grammar and some data from a particular language, what should we believe about that language's structure? This problem is simultaneously the problem facing the linguist and the child trying to learn a language.

Parallel problems of conditional inference arise in visual perception, theory of mind (or intuitive psychology), and virtually every other domain of cognition.  In visual perception, we observe an image or image sequence that is the result of rendering a three-dimensional physical scene onto our two-dimensional retinas.  A probabilistic program can model both the physical processes at work in the world that produce natural scenes, and the imaging processes (the "graphics") that render images from scenes.  *Perception* is then conditioning this program on some observed output image and inferring the scenes most likely to have given rise to it.  In interacting with other people, we observe the actions of intentional agents that are the outputs of planning processes: programs that take as input an agent's mental states (beliefs and desires) and produce action sequences -- typically, for a rational agent, actions that are likely to produce the agent's desired states as reliably or efficiently as possible, given the agent's beliefs.  A rational agent can *plan* their actions by conditional inference to infer what steps would be most likely to achieve their desired state.  *Action understanding*, or interpreting an agent's observed behavior, can be expressed as conditioning a planning program (a "theory of mind") on the observed actions to infer the mental states that most likely gave rise to those actions, and to predict how the agent is likely to act in the future.

# Hypothetical Reasoning with `query`

Suppose that we know some fixed fact, and we wish to consider hypotheses about how a generative model could have given rise to that fact.  In Church we can use a special function called  `query` with the following interface.

~~~~ {.norun}
(query
   generative-model
   what-we-want-to-know
   what-we-know)
~~~~

`query` takes three arguments. The first is some generative model expressed as a series of `define` statements. The second is an expression, called the *query expression*, which represents the aspects of the computation that we are interested in. The last argument is the condition that must be met; this may encode observations, data, or more general assumptions.  It is called the *conditioner.*

Consider the following simple generative process.

~~~~
(define A (if (flip) 1 0))
(define B (if (flip) 1 0))
(define C (if (flip) 1 0))
(define D (+ A B C))
D
~~~~

This process samples three digits 0/1 and adds the result. The value of the final expression here is either 0, 1, 2 or 3. A priori, each of the variables `A`, `B`, `C` has .5 probability of being `1` or `0`.  However, suppose that we have observed that the sum `D` is equal to 3. How does this change the space of possible values that variable `A` can take on?  It is obvious that `A` must be equal to 1 for this result to happen. We can see this in the following Church query (which uses a particular implementation, rejection sampling, to be described shortly):

~~~~
(define (take-sample)
  (rejection-query

   (define A (if (flip) 1 0))
   (define B (if (flip) 1 0))
   (define C (if (flip) 1 0))
   (define D (+ A B C))

   A

   (equal? D 3)
   )
  )
(hist (repeat 100 take-sample) "Value of A, given that D is 3")
~~~~

The output of `rejection-query` is a "guess" about the likely value of `A`, conditioned on `D` being equal to 3.  We use `repeat` to take 100 guesses, which are then turned into a bar graph representing relative probabilities using the `hist` function.  Because `A` must necessarily equal 1, the histogram shows 100% of the samples on that value.

Now suppose that we condition on `D` being greater than or equal to 2.  Then `A` need not be 1, but it is more likely than not to be. (Why?) The corresponding histogram shows the appropriate distribution of "guesses" for `A` conditioned on this new fact:

~~~~
(define (take-sample)
  (rejection-query

   (define A (if (flip) 1 0))
   (define B (if (flip) 1 0))
   (define C (if (flip) 1 0))
   (define D (+ A B C))

   A

   (>= D 2)
   )
  )
(hist (repeat 100 take-sample) "Value of A, given that D is greater than or equal to 2")
~~~~

Predicting the outcome of a generative process is simply a special case of querying, where we condition on no restrictions (simply `true`) and ask about the outcome:

~~~~
(define (take-sample)
  (rejection-query

   (define A (if (flip) 1 0))
   (define B (if (flip) 1 0))
   (define C (if (flip) 1 0))
   (define D (+ A B C))

   D

   true
   )
  )
(hist (repeat 100 take-sample) "Value of D")
~~~~

## The Meaning of `query`

Going beyond the basic intuition of "hypothetical reasoning", the `query` operation can be understood in several, equivalent, ways. We focus on two: the process of *rejection sampling*, and the the mathematical operation of *conditioning* a distribution.

### Rejection Sampling

How can we imagine answering a hypothetical such as those above? We have already seen how to get a sample from a generative model, without constraint, by simply running the evaluation process "forward"  (i.e. "simulating" the process). We can imagine getting conditional samples by forward sampling the entire query, including both the query expression and conditioner, but only keeping the sample if the value returned by the conditioner expression is *true*. This process, known as *rejection sampling*, is an instance of the general search strategy of *generate-and-test*. This can be represented by the following schematic Church code:

~~~~ {.norun}
(define (rejection-query ..defines.. query-expression conditioner)
       ..defines..
       (define query-value query-expression)
       (define condition-value conditioner)
       (if (equal? condition-value true)
           query-value
           (rejection-query defines query-expression conditioner)))
~~~~
(This is only schematic because we must avoid evaluating the query-expression and conditioner until *inside* the rejection-query function. The Church implementation does this by *de-sugaring*: transforming the code before evaluation.)

The distribution of values returned by a query expression can be seen as being specified by `rejection-query`; this is also described as the distribution over the values returned by the query-expression *conditioned on* the conditioner being true. Using the idea of rejection sampling go back and look at the query examples above. Do the histograms that you get out make sense as the result of rejection sampling?

### Conditional Distributions

The definition of conditional distribution in terms of rejection sampling is equivalent to the formal definition of *conditional probability* in probability theory<ref>There are special cases when continuous random choices are used. Here it is possible to find situations where rejection sampling almost never returns a sample but the conditional distribution is still well defined</ref>. Conditional probabilities are often written $P(A=a|B=b)$ for the probability that "event" $A$ has value $a$ given that $B$ has value $b$. (The meaning of events $A$ and $B$ must be given elsewhere, unlike a Church program, which contains the full model specification.) In the case of a Church query, $A=a$ is the "event" of the query expression returning value $a$, while $B=b$ will be the conditioner returning true (so $b$ will be *true*). The conditional probability can be defined as the ratio:

$$ P(A=a \mid B=b)=\frac{ P(A=a,B=b)}{P(B=b)} $$

That is, the conditional probability is the ratio of the joint probability to the probability of the condition.

We can use the process of rejection sampling to understand this alternative definition of the conditional probability $P(A=a|B=b)$. We imagine sampling many times, but only keeping those samples in which the condition is true, i.e. $B=true$. The frequency of the query expression returning a particular value $a$ (i.e. $A=a$) *given* that the condition is true, will be the number of times that $A=a$ *and* $B=true$ divided by the number of times that $B=true$. Since the frequency of the conditioner returning true will be $P(B=true)$ in the long run, and the frequency that the condition returns true *and* the query expression returns a given value $a$ will be $P(A=a,B=true)$, we get the above formula for the conditional probability.

Try using the above formula for conditional probability to compute the probability of the different return values in the above query examples. Check that you get the same probability that you observe when using rejection sampling.


### Bayes Rule

One of the most famous rules of probability, *Bayes' rule*, looks like this:
$$P(h \mid d) = \frac{P(d \mid h)P(h)}{P(d)}$$
It is first worth noting that this follows immediately from the definition of conditional probability given above:
$$P(h|d) = \frac{P(h,d)}{P(d)} = \frac{\frac{P(d,h)P(h)}{P(h)}}{P(d)} = \frac{P(d|h)P(h)}{P(d)}$$

Next we can ask what this rule means in terms of sampling processes. Consider the Church program:

~~~~
(define observed-data true)

(define (prior) (flip))

(define (observe h) (if h (flip 0.9) (flip 0.1)))

(rejection-query

 (define hypothesis (prior))
 (define data (observe hypothesis))

 hypothesis

 (equal? data observed-data))
~~~~
Here we have generated a value, the *hypothesis*, from some distribution called the *prior*, then used an observation function which generates data from this hypothesis, the probability of such an observation function is often called the *likelihood*. Finally we have queried the hypothesis conditioned on the observation being equal to some observed data&mdash;this conditional distribution is often called the *posterior*. This is a typical setup in which Bayes' rule is used. Notice that in this case the conditional distribution $P(data | hypothesis)$ is just the probability distribution on return values from the `observe` function given an input value.

If we replace the conditioner with `true` in the code above, that is equivalent to observing no data.  Then query draws samples from the prior distribution, rather than the posterior.

Bayes rule simply says that, in special situations where the model decomposes nicely into a part "before" the query-expression and a part "after" the query expression, then the conditional probability takes on a nice form in terms of these components of the model. This is often a useful way to think about conditional inference in simple setting. However, we will see many examples as we go along where Bayes' rule doesn't apply in a simple way, but the conditional distribution is equally well understood in terms of sampling.

## Implementations of `query`

Much of the difficulty of implementing the Church language (or probabilistic models in general) is in finding useful ways to do conditional inference --- to implement `query`. The Church implementations that we will use in this tutorial have several different methods for query, each of which has its own limitations.

As we have seen already, the method of rejection sampling is implemented in `rejection-query`. This is a very useful starting point, but is often not efficient: even if we are sure that our model can satisfy the condition, it will often take a very large number of samples to find computations that do so. To see this, try making the probability of `A`, `B`, and `C` very low in the above example (eventually the query will time out and be killed):

~~~~ {.mit-church}
(define baserate 0.1)

(define (take-sample)
  (rejection-query

   (define A (if (flip baserate) 1 0))
   (define B (if (flip baserate) 1 0))
   (define C (if (flip baserate) 1 0))
   (define D (+ A B C))

   A

   (>= D 2)
   )
  )
(hist (repeat 100 take-sample) "Value of A, given that D is greater than or equal to 2, using rejection")
~~~~
Even for this very simple program, lowering the baserate by just one order of magnitude, to 0.01, will make `rejection-query` impractical.

Another option is to use the mathematical definition of conditional probability directly: to *enumerate* all of the execution histories for the query, and then to use the rules of probability to compute the conditional probability (which we can then use to sample if we wish). The **cosh** implementation uses this exact query method (NOTE: this implementation is a bit different-- it returns the exact distribution as a list of pairs and changing the code below too much may cause it to error):

~~~~ {.cosh}
(define baserate 0.1)

(exact-query

 (define A (if (flip baserate) 1 0))
 (define B (if (flip baserate) 1 0))
 (define C (if (flip baserate) 1 0))
 (define D (+ A B C))

 A

 (>= D 2)
 )
~~~~
Notice that the time it takes for this program to run doesn't depend on the baserate. Unfortunately it does depend critically on the number of random choices in an execution history: the number of possible histories that must be considered grows exponentially in the number of random choices. This renders `exact-query` impractical for all but the simplest models.

The AI literature is replete with other algorithms and techniques for dealing with conditional probabilistic inference, and several of these have been adapted into Church to give implementations of `query` that may be more efficient in various cases. (Though they vary in efficiency, each of these implementations is universal: given enough time it samples from the appropriate conditional distribution for a Church query over any Church model.) One implementation that we will often use is based on the *Metropolis Hastings* algorithm, a form of *Markov chain Monte Carlo* inference. For background on MH and MCMC, see the excellent introductions by David MacKay ([Chapter 29](http://www.inference.phy.cam.ac.uk/mackay/itprnn/ps/356.384.pdf) and [30](http://www.inference.phy.cam.ac.uk/mackay/itprnn/ps/387.412.pdf) of Information Theory, Inference, and Learning Algorithms) or [Radford Neal](http://www.cs.utoronto.ca/~radford/review.abstract.html).

~~~~ {.mit-church}
(define baserate 0.1)

(define samples
  (mh-query 100 100

   (define A (if (flip baserate) 1 0))
   (define B (if (flip baserate) 1 0))
   (define C (if (flip baserate) 1 0))
   (define D (+ A B C))

   A

   (>= D 2)
   )
  )
(hist samples "Value of A, given that D is greater than or equal to 2")
~~~~

The `mh-query` implementation takes two extra arguments and returns a list of many samples. The first extra argument is the number of samples to take, and the second controls the "lag", the number of internal random choices that the algorithm makes in a sequence of iterative steps between samples.  The total number of MH iterations, and hence the running time of the query, is the product of these two parameters.  (The workings of MH are beyond the scope of this section, but very roughly: The algorithm implements a random walk or diffusion process (a *Markov chain*) in the space of possible program evaluations that lead to the conditioner being true.  Each MH iteration is one step of this random walk, and the process is specially designed to visit each program evaluation with a long-run frequency proportional to its conditional probability.)

See what happens in the above query as you lower the baserate.  Inference should not slow down appreciably, but it will become less stable and less accurate.  It becomes increasingly difficult for MH to draw independent conditional samples by taking small random steps, so for a fixed lag (100 in the code above), the 100 samples returned will tend to be less representative of the true conditional inference.  In this case, stable and accurate conditional inferences can still be achieved in reasonable time by increasing the number of samples to 500 (while holding the lag at 100).

# Example: Causal Inference in Medical Diagnosis

This classic Bayesian inference task is a special case of conditioning. Kahneman and Tversky, and Gigerenzer and colleagues, have studied how people make simple judgments like the following:

> The probability of breast cancer is 1% for a woman at 40 who participates in a routine screening. If a woman has breast cancer, the probability is 80% that she will have a positive mammography. If a woman does not have breast cancer, the probability is 9.6% that she will also have a positive mammography. A woman in this age group had a positive mammography in a routine screening. What is the probability that she actually has breast cancer?

What is your intuition? Many people without training in statistical inference judge the probability to be rather high, typically between 0.7 and 0.9. The correct answer is much lower, less than 0.1, as we can see by evaluating this Church query:

~~~~ {.mit-church}
(define samples
 (mh-query 100 100
   (define breast-cancer (flip 0.01))

   (define positive-mammogram (if breast-cancer (flip 0.8) (flip 0.096)))

   breast-cancer

   positive-mammogram
 )
)
(hist samples "breast cancer")
~~~~

Kahneman and Tversky<ref>Tversky, A., & Kahneman, "Judgment under uncertainty: Heuristics and biases," *Science*, 1974.</ref> named this kind of judgment error *base rate neglect*, because in order to make the correct judgment, one must realize that the key contrast is between the *base rate* of the disease, 0.01 in this case, and the *false alarm rate * or probability of a positive mammogram given no breast cancer, 0.096.  The false alarm rate (or *FAR* for short) seems low compared to the probability of a positive mammogram given breast cancer (the *likelihood*), but what matters is that it is almost ten times higher than the base rate of the disease.  All three of these quantities are needed to compute the probability of having breast cancer given a positive mammogram using Bayes' rule for posterior conditional probability:

$$P(\textrm{cancer} \mid \textrm{positive mammogram}) = \frac{P(\textrm{positive mammogram} \mid \textrm{cancer} ) \times P(\textrm{cancer})}{P(\textrm{ positive mammogram})} \\
= \frac{0.8 \times 0.01}{0.8 \times 0.01 + 0.096 \times 0.99} = 0.078$$

Gigerenzer and colleagues<ref>Gigerenzer & Hoffrage, "How to improve Bayesian reason- ing without instruction: Frequency formats," *Psychological Review*, 1995.</ref> showed that this kind of judgment can be made much more intuitive to untrained reasoners if the relevant probabilities are presented as "natural frequencies", or the sizes of subsets of relevant possible outcomes:

> On average, ten out of every 1000 women at age 40 who come in for a routine screen have breast cancer.  Eight out of those ten women will get a positive mammography.  Of the 990 women without breast cancer, 95 will also get a positive mammography. We assembled a sample of 1000 women at age 40 who participated in a routine screening.  How many of those who got a positive mammography do you expect to actually have breast cancer?

Now one can practically read off the answer from the problem formulation: 8 out of 103 (95+8) women in this situation will have breast cancer.

Gigerenzer (along with Cosmides, Tooby and other colleagues) has argued that this formulation is easier because of evolutionary and computational considerations: human minds have evolved to count and compare natural frequencies of discrete events in the world, not to add, multiply and divide decimal probabilities.  But this argument alone cannot account for the very broad human capacity for causal reasoning.  We routinely make inferences for which we haven't stored up sufficient frequencies of events observed *in the world.* (And often for which no one has told us the relevant frequencies, although perhaps we have been told about degrees of causal strength or base rates in the form of probabilities or other linguistic encoding).

However, the basic idea that the mind is good at manipulating frequencies of situations, but bad at arithmetic on continuous probability values, can be extended to cope with novel situations if the frequencies that are manipulated can be frequencies of *imagined* situations. Recall that Church programs explicitly give instructions for sampling imagined situations, and only implicitly specify probability distributions. If human inference is similar to a Church query then it would readily create and manipulate imagined situations, and this could explain both why the frequency framing of Bayesian probability judgment is natural to people and how people cope with rarer and more novel situations.  The numbers given in the frequency formulation (or close approximations thereof) can be read off a tree of evaluation histories for 1000 calls of the Church program that specifies the causal model for this problem:

![](images/Cancer-world-tree.png)

Each path from root to leaf of this tree represents a sequence of random choices made in evaluating the above program (the first flip for breast-cancer, the second for positive-mammogram), with the number of traversals and the sampled value labeling each edge. (Because this is 1000 *random* samples, the number are close (but not exactly) those in the Gigerenzer, et al, story.) Selecting just the 106 hypothetical cases of women with a positive mammogram, and computing the fraction of those who also have breast cancer (7/106), corresponds exactly to `rejection-query`. Thus, we have used the causal representation in the above church program to manufacture frequencies which can be used to arrive at the inference that relatively few women with positive mammograms actually have breast cancer.

Yet unlike the rejection sampler people are quite bad at reasoning in this scenario. Why? One answer is that people don't represent their knowledge in quite the form of this simple church program.
Indeed, Krynski and Tenenbaum<ref>Krynski and Tenenbaum, "The Role of Causality in Judgment Under Uncertainty," *JEP: General*, 2007.</ref> have argued that human statistical judgment is fundamentally based on conditioning more explicit causal models:  they suggested that "base rate neglect" and other judgment errors may occur when people are given statistical information that cannot be easily mapped to the parameters of the causal models they intuitively adopt to describe the situation.  In the above example, they suggested that the notion of a false alarm rate is not intuitive to many people --- particularly when the false alarm rate is ten times higher than the base rate of the disease that the test is intended to diagnose!  They showed that "base rate neglect" could be eliminated by reformulating the breast cancer problem in terms of more intuitive causal models.  For example, consider their version of the breast cancer problem (the exact numbers and wording differed slightly):

> 1% of women at age 40 who participate in a routine screening will have breast cancer.  Of those with breast cancer, 80% will receive a positive mammogram.  20% of women at age 40 who participate in a routine screening will have a benign cyst.  Of those with a benign cyst, 50% will receive a positive mammogram due to unusually dense tissue of the cyst.  All others will receive a negative mammogram.  Suppose that a woman in this age group has a positive mammography in a routine screening. What is the probability that she actually has breast cancer?

This question is easy for people to answer -- empirically, just as easy as the frequency-based formulation given above.  We may conjecture this is because the relevant frequencies can be computed from a simple query on the following more intuitive causal model:

~~~~ {.mit-church}
(define samples
 (mh-query 100 100
   (define breast-cancer (flip 0.01))
   (define benign-cyst (flip 0.2))

   (define positive-mammogram (or (and breast-cancer (flip 0.8)) (and benign-cyst (flip 0.5))))

   breast-cancer

   positive-mammogram
 )
)
(hist samples "breast cancer")
~~~~

Because this causal model -- this Church program -- is more intuitive to people, they can imagine the appropriate situations, despite having been given percentages rather than frequencies.
What makes this causal model more intuitive than the one above with an explicitly specified false alarm rate?  Essentially we have replaced probabilistic dependencies on the "non-occurrence" of events (e.g., the dependence of a positive mammogram on *not* having breast cancer) with dependencies on explicitly specified alternative causes for observed effects (e.g., the dependence of a positive mammogram on having a benign cyst).

A causal model framed in this way can scale up to significantly more complex situations.  Recall our more elaborate medical diagnosis network from the previous section, which was also framed in this way using noisy-logical functions to describe the dependence of symptoms on disease:

~~~~ {.mit-church}
(define samples
  (mh-query 1000 100
    (define lung-cancer (flip 0.01))
    (define TB (flip 0.005))
    (define cold (flip 0.2))
    (define stomach-flu (flip 0.1))
    (define other (flip 0.1))

    (define cough (or (and cold (flip 0.5)) (and lung-cancer (flip 0.3)) (and TB (flip 0.7)) (and other (flip 0.01))))
    (define fever (or (and cold (flip 0.3)) (and stomach-flu (flip 0.5)) (and TB (flip 0.2)) (and other (flip 0.01))))
    (define chest-pain (or (and lung-cancer (flip 0.4)) (and TB (flip 0.5)) (and other( flip 0.01))))
    (define shortness-of-breath (or (and lung-cancer (flip 0.4)) (and TB (flip 0.5)) (and other (flip 0.01))))

    (list lung-cancer TB)

    (and cough fever chest-pain shortness-of-breath)

  )
)
(hist samples "Joint inferences for lung cancer and TB")
~~~~

You can use this model to infer conditional probabilities for any subset of diseases conditioned on any pattern of symptoms.  Try varying the symptoms in the conditioning set or the diseases in the query, and see how the model's inferences compare with your intuitions.  For example, what happens to inferences about lung cancer and TB in the above model if you remove chest pain and shortness of breath as symptoms?  (Why?  Consider the alternative explanations.)  More generally, we can condition on any set of events -- any combination of symptoms and diseases -- and query any others.  We can also condition on the negation of an event using `(not ...)`: e.g., how does the probability of lung cancer (versus TB) change if we observe that the patient does *not* have a fever, does *not* have a cough, or does not have either symptom?

A Church program thus effectively encodes the answers to a very large number of possible questions in a very compact form, where each question has the form, "Suppose we observe X, what can we infer about Y?".  In the program above, there are $3^9=19683$ possible simple conditioners (possible X's) corresponding to conjunctions of events or their negations (because the program has 9 stochastic Boolean-valued functions, each of which can be observed true, observed false, or not observed). Then for each of those X's there are a roughly comparable number of Y's, corresponding to all the possible conjunctions of variables that can be in the query set Y, making the total number of simple questions encoded on the order of 100 million. In fact, as we will see below when we describe complex queries, the true number of possibe questions encoded in just a short Church program like this one is very much larger than that; usually the set is infinite. With `query` we can in principle compute the answer to every one of these questions.  We are beginning to see the sense in which probabilistic programming provides the foundations for constructing a *language of thought*, as described in the Introduction: a finite system of knowledge that compactly and efficiently supports an infinite number of inference and decision tasks

Expressing our knowledge as a probabilistic program of this form also makes it easy to add in new relevant knowledge we may acquire, without altering or interfering with what we already know.  For instance, suppose we decide to consider behavioral and demographic factors that might contribute causally to whether a patient has a given disease:

~~~~ {.mit-church}
(define samples
  (mh-query 1000 100
    (define works-in-hospital (flip 0.01))
    (define smokes (flip 0.2))

    (define lung-cancer (or (flip 0.01) (and smokes (flip 0.02))))
    (define TB (or (flip 0.005) (and works-in-hospital (flip 0.01))))
    (define cold (or (flip 0.2) (and works-in-hospital (flip 0.25))))
    (define stomach-flu (flip 0.1))
    (define other (flip 0.1))

    (define cough (or (and cold (flip 0.5)) (and lung-cancer (flip 0.3)) (and TB (flip 0.7)) (and other (flip 0.01))))
    (define fever (or (and cold (flip 0.3)) (and stomach-flu (flip 0.5)) (and TB (flip 0.2)) (and other (flip 0.01))))
    (define chest-pain (or (and lung-cancer (flip 0.4)) (and TB (flip 0.5)) (and other( flip 0.01))))
    (define shortness-of-breath (or (and lung-cancer (flip 0.4)) (and TB (flip 0.5)) (and other (flip 0.01))))

   (list lung-cancer TB)

   (and cough chest-pain shortness-of-breath)

  )
)
(hist samples "Joint inferences for lung cancer and TB")
~~~~

Under this model, a patient with coughing, chest pain and shortness of breath is likely to have either lung cancer or TB.  Modify the above code to see how these conditional inferences shift if you also know that the patient smokes or works in a hospital (where they could be exposed to various infections, including many worse infections than the typical person encounters).  More generally, the causal structure of knowledge representation in a probabilistic program allows us to model intuitive theories that can grow in complexity continually over a lifetime, adding new knowledge without bound.

<!--
===Application: Bayesian networks as expert systems in AI===

In AI, causal models of this sort are often called *Bayesian networks*, *Belief networks*, or *Directed graphical models*.  Bayesian networks have revolutionized the field of *expert systems*, which aims to automate the knowledge of human experts in forms that machines can reason about.  Specifically in the context of medical diagnosis, the QMR (or "Quick medical reference") Bayesian network was an early landmark in the field. Just like our examples above, QMR has a two-layer diseases-cause-symptoms structure, with noisy-logical functions relating diseases to symptoms, but it is much bigger in order to capture all the diseases a typical physician has to deal with on a regular basis:

![](qmr.gif)

More recently, much more complex and temporally extended Bayesian networks are starting to play a role in systems biology and personalized genomic medicine, as in these examples from Kenneth Drake, Serologix:

![](Systems_Biology_Solution_fig01.gif‎)

-->

<!-- 

![](Systems_Biology_Solution_fig03.gif‎)-->

<!--  Tim: Note that relative probability doesn't change, while absolute prob goes up/down.
    Josh: I'm not sure how to incorporate this. It's complicated because you can't just compare
           base rates; the likelihoods matter too. -->



<!--  OLD STUFF ON BAYES NETS:

One popular formalism for representing hierarchical generative models is the *Bayes net*. A Bayes net, also called a *Bayesian belief network* or a *directed graphical model* is a graph which encodes the structure of a probabilistic model. It displays graphically which random variables depend on which other random variables. We will illustrate this by example. A textbook example of a scenario that can be represented in a Bayes net, due originally to Judea Pearl, is called the *sprinkler problem.*  Imagine there is some grass lawn which you observe as being wet or dry one morning. You know that there are two possible causes if it is wet. First, it may be because it rained the night before, or, second, it may be because there was an automatic sprinkler system that ran the night before.  Notice that while the variable "is the lawn wet" (`wet`) depends causally on both "did it rain" (`rain`) and "did the sprinkler run," (`sprinkler`), `rain` and `sprinkler` are independent (suppose that the sprinkler is automatic and not sensitive to the rain or not).  Suppose that the prior probability of it raining in general is $.1$ and the probability of the automatic sprinkler running is $.9$. Furthermore, let's suppose there is a small chance of the grass being wet by some other cause (say $.1$).

This can be represented with the following Bayes net.

[[image:church-sprinkler2.png|400px]]

This Bayes net shows that the variable `wet` depends on the variables `rain` and `sprinkler`, but that they do not depend on one another. It also shows the distributions over the variables. These distributions are represented as *conditional probability tables* (CPTs). The CPTs for `rain` and `sprinkler` are very simple, they just specify the probabilities of each of the two possible outcomes, since neither of these variables depend on anything else. The CPT for `wet` is more complex. It specifies a *conditional probability distribution* over the state of the grass for each of the two possible values of `rain` and `sprinkler`. Rain or sprinkling cause the grass to be wet with probability 1.0. If neither variable is true then the there is still some small probability that the grass gets wet by other means&mdash; thus injecting *noise* into the model.

This Bayes net can be expressed in Church very compactly.

~~~~
(define rain (flip .2))
(define sprinkler (flip .2))
(define wet (if (or rain sprinkler) true (flip .05)))
wet
~~~~

An important observation here is that this Church program actually expresses more knowledge about the generative process than the Bayes net above. In particular, the Bayes net encodes the set of conditional probability distributions as a simple table. The Church program on the other hand gives an explicit formula for sampling the value of `wet` given the value of the other two variables. This formula encodes the intuitive knowledge: "if it rains or the sprinkler runs, then the grass will definitely be wet, but there is some small chance it might be wet even if none of those things happen."
In general, Bayes nets represent dependencies between random variables while hiding much of the computational detail which is actually necessary to compute the values of one variable given another.

To take another example consider the binomial distribution we studied above. The Bayes net for this distribution would have $N$ nodes, representing the Bernoulli trials all pointing at another node representing the sum. The sum node would have a CPT which gave a probability for each possible total count. However, nowhere in the Bayes net would it be expressed that the *operation* linking the Bernoulli nodes and the sum node is addition. -->

# Reasoning with Arbitrary Propositions: Complex Queries

It is natural to condition a generative model on a value for one of the variables declared in this model. However, one may also wish to ask for more complex hypotheticals: "what if P," where P is a complex proposition composed out of variables declared in the model.

<!-- Another kind of conditioning which is difficult to express in traditional notation is conditioning which involves a "recoding" of random variables into new random variables. -->
Consider the following Church `query`.

~~~~
(define samples
  (mh-query
   100 100

   (define A (if (flip) 1 0))
   (define B (if (flip) 1 0))
   (define C (if (flip) 1 0))

   A

   (>= (+ A B C) 2)
   )
  )
(hist samples "Value of A, given that the sum is greater than or equal to 2")
~~~~

This query has the same content as an example above but the syntax is importantly different. We have defined a generative model that samples 3 instances of 0/1 digits. However, we have conditioned on the complex assumption that the sum of these random variables is greater than or equal to 2. This involves a new random variable, `(>= (+ A B C) 2)`. This latter random variable *did not appear anywhere in the generative model*. In the traditional presentation of conditional probabilities we usually think of conditioning as *observation*: it explicitly enforces random variables to take on certain values. For example, when we say $P(A|B=b)$ it explicitly require $B = b$. In order to express the above query in this way, we could add the complex variable to the generative model, then condition on it. However this intertwines the hypothetical assumption with the generative model, and this is not what we want: we want a simple model which supports many queries, rather than a complex model in which only a prescribed set of queries is allowed.

Writing models in Church allows the flexibility to build complex random expressions like this as needed, making assumptions that are phrased as complex propositions, rather than simple observations.  Hence the effective number of queries we can construct for most programs will not merely be a large number but countably infinite, much like the sentences in a natural language.  The `query` function in principle supports correct conditional inference for this infinite array of situations.

## Example: Reasoning about the Tug of War 

Returning to the earlier example of a series of tug-of-war matches, we can use query to ask a variety of different questions. For instance, how likely is it that bob is strong, given that he's been in a series of winning teams? (Note that we have written the `winner` function slightly differently here, to return the labels `'team1` or `'team2` rather than the list of team members.  This makes for more compact conditioning statements.)

~~~~
(define samples
  (mh-query 100 100
    (define strength (mem (lambda (person) (if (flip) 10 5))))
    (define lazy (lambda (person) (flip (/ 1 3))))

    (define (total-pulling team)
      (sum
         (map (lambda (person) (if (lazy person) (/ (strength person) 2) (strength person)))
               team)))

    (define (winner team1 team2) (if (< (total-pulling team1) (total-pulling team2)) 'team2 'team1))

    (strength 'bob)

    (and (eq? 'team1 (winner '(bob mary) '(tom sue)))
         (eq? 'team1 (winner '(bob sue) '(tom jim)))))
)
(hist samples "Bob strength")
~~~~

Try varying the number of different teams and teammates that bob plays with. How does this change the probability that bob is strong?  Do these changes agree with your intuitions? Can you modify this example to draw `strength` from a uniform distribution, instead of having just two possible values?

We can form many complex queries from this simple model. We could ask how likely a team of bob and mary is to win over a team of jim and sue, given that mary is at least as strong as sue, and bob was on a team that won against jim previously:

~~~~
(define samples
  (mh-query 100 100
    (define strength (mem (lambda (person) (if (flip) 10 5))))
    (define lazy (lambda (person) (flip (/ 1 3))))

    (define (total-pulling team)
      (sum
         (map (lambda (person) (if (lazy person) (/ (strength person) 2) (strength person)))
               team)))

    (define (winner team1 team2) (if (< (total-pulling team1) (total-pulling team2)) 'team2 'team1))

    (eq? 'team1 (winner '(bob mary) '(jim sue)))

    (and (>= (strength 'mary) (strength 'sue))
         (eq? 'team1 (winner '(bob francis) '(tom jim)))))
)
(hist samples "Do bob and mary win against jim and sue")
~~~~

As an exercise, let's go back to the tug-of-war tournament described under [[Generative Models]] and write a Church program to infer the probability that alice is stronger than bob, given a particular tournament outcome.

~~~~
(define samples
  (mh-query 100 100
    (define strength (mem (lambda (person) (if (flip) 10 5))))
    (define lazy (lambda (person) (flip (/ 1 3))))

    (define (total-pulling team)
      (sum
         (map (lambda (person) (if (lazy person) (/ (strength person) 2) (strength person)))
               team)))

    (define (winner team1 team2) (if (< (total-pulling team1) (total-pulling team2)) 'team2 'team1))

    (> (strength 'alice) (strength 'bob))

    (and (eq? 'team1 (winner '(alice bob) '(sue tom)))
         (eq? 'team2 (winner '(alice bob) '(sue tom)))
         (eq? 'team1 (winner '(alice sue) '(bob tom)))
         (eq? 'team1 (winner '(alice sue) '(bob tom)))
         (eq? 'team1 (winner '(alice tom) '(bob sue)))
         (eq? 'team1 (winner '(alice tom) '(bob sue))))

  )
)
(hist samples "Is alice stronger than bob?")
~~~~

A model very similar to this was used in Gerstenberg and Goodman (2012)<ref>Ping Pong in Church: Productive use of concepts in human probabilistic inference. T. Gerstenberg, and N. D. Goodman (2012). Proceedings of the Thirty-Fourth Annual Conference of the Cognitive Science Society.</ref> to predict human judgements about the strength of players in ping-pong tournaments. It achieved very accurate quantitative predictions without many free parameters.



# Exercises

## Conditioning and intervention

In the example on [[Generative Models#Example: Causal Models in Medical Diagnosis | Medical Diagnosis]] from the [[Generative Models]] section we suggested understanding the patterns of symptoms for a particular disease by changing the program to make that disease always true.

a. For this example, does this procedure give the same answers as using `query` to *condition* on the disease being true?

b. Why would this procedure give different answers than conditioning for more general hypotheticals? Construct an example where these are different. Then translate this into a Church model and show that intervening and observation give different answers. Hint: think about intervening versus observing on a variable that has a causal parent.

## Computing marginals

Use the rules for computing probabilities to compute the marginal distribution on return values from these Church programs.

~~~~
(rejection-query
  (define a (flip))
  (define b (flip))
  a
  (or a b))
~~~~

~~~~
(rejection-query
 (define nice (mem (lambda (person) (flip 0.7))))
 (define (smiles person) (if (nice person) (flip 0.8) (flip 0.5)))
 (nice 'alice)
 (and (smiles 'alice)  (smiles 'bob) (smiles 'alice)))
~~~~

## Extending the smiles model

a. Describe (using ordinary English) what the second Church program above means.
b. How would you change it if you thought people are more likely to smile if they want something? If you think some people are more likely to want something than others? If you think nice people are less likely to want something?
c. Given your extended model, how would you ask whether someone wants something from you, given that they are smiling and have rarely smiled before? Show the Church program and a histogram of the answers -- in what ways do these answers make intuitive sense or fail to?

## Casino game

Suppose that you are playing the following game at a casino. In this game, a machine randomly gives you a letter of the alphabet and the probability of winning depends on which letter you receive. The machine gives the letters a, e, i, o, u, y (the vowels) with probability 0.01 each and the remaining letters (i.e., the consonants) with probability 0.047 each. Let's use the variable $h$ to denote the letter that you receive; the probability of winning for a given $h$ is $1/Q(h)^2$, where $Q(h)$ denotes the numeric position of the letter (e.g., $Q(\textrm{a}) = 1, Q(\textrm{b}) = 2$, and so on).
Let's express this in formal terms. The hypothesis space, $H$, is the set of letters $\{a, b, c, d, \dots, y, z\}$ and the prior probability of a hypothesis $h$ is   0.01 for vowels (a, e, i, o, u, y) and 0.047 for consonants. The likelihood, $p(d \mid h) = 1/Q(h)^2$, is the probability of winning given that you drew some letter $h$.

a. (Here, give your answers in English, not math) What does the $d$ in $p(d \mid h)$ represent? What does the posterior $p(h \mid d)$ represent?

b. Manually compute $p(h \mid d)$ for each hypothesis (Excel or something like it is helpful here). Remember to normalize - make sure that summing all your $p(h \mid d)$ values gives you 1.
Now, we're going to write this model in Church using the `cosh` engine. Here is some starter code for you:

~~~~ {.cosh}
;; define some variables and utility functions
(define letters '(a b c d e f g h i j k l m n o p q r s t u v w x y z) )
(define (vowel? letter) (if (member letter '(a e i o u y)) #t #f))
(define letter-probabilities (map (lambda (letter) (if (vowel? letter) 0.01 0.047)) letters))

(define (my-list-index needle haystack counter)
  (if (null? haystack)
      'error
      (if (equal? needle (first haystack))
          counter
          (my-list-index needle (rest haystack) (+ 1 counter)))))

(define (get-position letter) (my-list-index letter letters 1))

;; actually compute p(h | d)
(rejection-query
 (define my-letter (multinomial letters letter-probabilities))

 (define my-position (get-position my-letter))
 (define my-win-probability (/ 1.0 (* my-position my-position)))
 (define win? ...)

 ;; query
 ...

 ;; condition
 ...
)
~~~~

c. What does the `my-list-index` function do? What would happen if you ran `(my-list-index 'mango '(apple banana) 1)`?

d. What does the `multinomial` function do? Use `multinomial` to express this distribution: TODO

e. Fill in the `...`'s in the code to compute $p(h \mid d)$. Include a screenshot of the resulting graph. What letter has the highest posterior probability? In English, what does it mean that this letter has the highest posterior? Make sure that your Church answers and hand-computed answers agree - note that this demonstrates the equivalence between the program view of conditional probability and the distributional view.

f. Which is higher, $p(\text{vowel} \mid d)$ or $p(\text{consonant} \mid d)$? Answer this using the Church code you wrote (hint: use the `vowel?` function)

g. What difference do you see between your code and the mathematical notation? What are the advantages and disadvantages of each? Which do you prefer?
