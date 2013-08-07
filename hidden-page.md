% Exercises: Generative Models

# Marginal distributions

Here are three church programs.

~~~~ {.bher}
(if (flip) (flip 0.7) (flip 0.1))
~~~~

~~~~ {.bher}
(flip (if (flip) 0.7 0.1))
~~~~

~~~~ {.bher}
(flip 0.4)
~~~~
    
1. Show that the marginal distribution on return values for these three programs is the same by directly computing the probability using the rules of probability (hint: write down each possible history of random choices for each program). Check your answers by sampling from the programs.
2. Explain why these different-looking programs can give the same results.