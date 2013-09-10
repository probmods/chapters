% Probabilistic Models of Cognition

***Authors***: Noah D. Goodman, Joshua B. Tenenbaum, Timothy J. O'Donnell

***Contributors***: Andreas Stuhlmuller, Tomer Ullman, John McCoy, Long Ouyang

# Prelude

What is thought? How can we describe the intelligent inferences made in everyday human reasoning and learning? How can we engineer intelligent machines? The computational theory of mind aims to answer these questions starting from the hypothesis that the mind is a computer, mental representations are computer programs, and thinking is a computational process -- running a computer program.

But what kind of program? A natural assumption is that this program take the inputs -- percepts from the senses, facts from memory, etc -- and compute the outputs -- the intelligent behaviors. Thus the mental representations that lead to thinking are functions from inputs to outputs. However, this input-output view suffers from a combinatorial explosion: we must posit an input-output program for each task in which humans draw intelligent inferences. A different approach is to assume that mental representations are more like theories: pieces of knowledge that can support many inferences in many different situations. For instance, Newton's theory of motion makes predictions about infinitely many different configurations of objects and can be used to reason both forward in time and from the consequences of an interaction to the initial state. The generative approach posits that mental representations are more like theories in this way: they capture more general descriptions of how the world works--hence, the programs of the mind are models of the world that can be used to make many inferences.

A generative model describes a process, usually one by which observable data is generated. Generative models represent knowledge about the causal structure of the world -- simplified, "working models" of a domain. These models may then be used to answer many different questions, by conditional inference. This contrasts to a more procedural or mechanistic approach in which knowledge represents the input-output mapping for a particular question directly. While such generative models often describe how we think the "actual world" works, there are many cases where it is useful to have a generative model even if there is no "fact of the matter". A prime example of the latter is in linguistics, where generative models of grammar can usefully describe the possible sentences in a language by describing a process for constructing sentences.

It is possible to use deterministic generative models to describe possible ways a process could unfold, but due to sparsity of observations or actual randomness there will often be many ways that our observations could have been generated. How can we choose amongst them? Probability theory provides a system for reasoning under exactly this kind of uncertainty. Probabilistic generative models describe processes which unfold with some amount of randomness, and probabilistic inference describes ways to ask questions of such processes. This tutorial is concerned with the knowledge that can be represented by probabilistic generative models and the inferences that can be drawn from them.

In order to make the idea of generative models precise we want a formal language that is designed to express the kinds of knowledge individuals have about the world. This language should be universal in the sense that it should be able to express any (computable) process. We build on the $\lambda$-calculus (as realized in functional programming languages) because the $\lambda$-calculus describes computational processes and captures the idea that what is important is causal dependence-- in particular the $\lambda$-calculus does not focus on the sequence of time, but rather on which events influence which other events. We introduce randomness into this language to construct a stochastic $\lambda$-calculus, and describe conditional inferences in this language.

# Chapters
%(chapters)s

# Acknowledgements

The construction and ongoing support of this tutorial are made possible by grants from the Office of Naval Research, the James S. McDonnell Foundation, and the Stanford VPOL.
