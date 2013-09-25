% Probabilistic Models of Cognition


***Authors***: Noah D. Goodman and Joshua B. Tenenbaum

***Contributors***: Timothy J. O'Donnell, Andreas Stuhlmuller, Tomer Ullman,\
John McCoy, Long Ouyang



>*Best viewed in recent versions of Chrome, Firefox, or Safari on a laptop or desktop computer.*

>*This book contains many technical exercises that run directly in your web browser. At the end of some chapters, we present some extended exercises as homework problems. To save your progress on homework problems, you can register an account. Registering an account also helps us improve the book by tracking what kinds of programs users run and what kinds of errors they encounter.*

><div id="register" style='display: none; font-style: italic'><a href="/login">Login</a> or <a href="/register">register an account</a> </div>

# Prelude

What is thought? How can we describe the intelligent inferences made in everyday human reasoning and learning? How can we engineer intelligent machines? The computational theory of mind aims to answer these questions starting from the hypothesis that the mind is a computer, mental representations are computer programs, and thinking is a computational process -- running a computer program.

But what kind of program? A natural assumption is that these programs take the inputs -- percepts from the senses, facts from memory, etc -- and compute the outputs -- the intelligent behaviors. Thus the mental representations that lead to thinking are functions from inputs to outputs. However, this input-output view suffers from a combinatorial explosion: we must posit an input-output program for each task in which humans draw intelligent inferences. A different approach is to assume that mental representations are more like theories in science: pieces of knowledge that can support many inferences in many different situations. 
For instance, Newton's theory of motion makes predictions about infinitely many different configurations of objects and can be used to reason both forward in time and from final state of a physical system to the initial state. The *generative* approach to cognition posits that some mental representations are more like theories in this way: they capture general descriptions of how the world *works* -- these programs of the mind are models of the world that can be used to make many inferences. (While other programs of the mind take these generative programs and actually draw inferences.)

A generative model describes a process, usually one by which observable data is generated. Generative models represent knowledge about the causal structure of the world -- simplified, "working models" of a domain. These models may then be used to answer many different questions, by conditional inference. 
This contrasts to a more procedural or mechanistic approach in which knowledge represents the input-output mapping for a particular question directly. 
<!-- TODO: add some examples of cognitive capacities and the 'world models' they depend on... -->
While such generative models often describe how we think the "actual world" works, there are many cases where it is useful to have a generative model even if there is no "fact of the matter". 
A prime example of the latter is in linguistics, where generative models of grammar can usefully describe the possible sentences in a language by describing a process for constructing sentences.

It is possible to use deterministic generative models to describe possible ways a process could unfold, but due to sparsity of observations or actual randomness there will often be many ways that our observations could have been generated. How can we choose amongst them? Probability theory provides a system for reasoning under exactly this kind of uncertainty. Probabilistic generative models describe processes which unfold with some amount of randomness, and probabilistic inference describes ways to ask questions of such processes. This book is concerned with the knowledge that can be represented by probabilistic generative models and the inferences that can be drawn from them.

In order to make the idea of generative models precise we want a formal language that is designed to express the kinds of knowledge individuals have about the world. This language should be universal in the sense that it should be able to express any (computable) process. We build on the $\lambda$-calculus (as realized in functional programming languages) because the $\lambda$-calculus describes computational processes and captures the idea that what is important is causal dependence---in particular the $\lambda$-calculus does not focus on the sequence of time, but rather on which events influence which other events. We introduce randomness into this language to construct a stochastic $\lambda$-calculus, and describe conditional inferences in this language.

# Chapters
%(chapters)s

# Acknowledgements

The construction and ongoing support of this tutorial are made possible by grants from the Office of Naval Research, the James S. McDonnell Foundation, the National Science Foundation, and the Stanford VPOL.
