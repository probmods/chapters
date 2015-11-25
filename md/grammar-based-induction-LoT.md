% Grammar-based induction

>***Note: This chapter has not been revised for the new format and Church engine. Some content may be incomplete! Some example may not work!***


# Example: Learning Compositional Concepts

How can we account for the productivity of human concepts (the fact that every child learns a remarkable number of different, complex concepts)? The "classical" theory of concepts formation accounted for this productivity by hypothesizing that concepts are represented compositionally, by logical combination of the features of objects (see for example Bruner, Goodnow, and Austin, 1951). That is, concepts could be thought of as rules for classifying objects (in or out of the concept) and concept learning was a process of deducing the correct rule.

While this theory was appealing for many reasons, it failed to account for a variety of categorization experiments. Here are the training examples, and one transfer example, from the classic experiment of Medin and Schaffer (1978). The bar graph above the stimuli shows the portion of human participants who said that bug was a "fep" in the test phase (the data comes from a replication by Nosofsky, Gluck, Palmeri, McKinley (1994); the bug stimuli are courtesy of Pat Shafto):  

[[Image: Medin54-bugs.png |500px]]

Notice three effects: there is a gradient of generalization (rather than all-or-nothing classification), some of the Feps are better (or more typical) than others (this is called "typicality"), and the transfer item is a ''better'' Fep than any of the Fep exemplars (this is called "prototype enhancement"). Effects like these were difficult to capture with classical rule-based models of category learning, which led to deterministic behavior. As a result of such difficulties, psychological models of category learning turned to more uncertain, prototype and exemplar based theories of concept representation. These models were able to predict behavioral data very well, but lacked  compositional conceptual structure.

Is it possible to get graded effects from rule-based concepts? Perhaps these effects are driven by uncertainty in ''learning'' rather than uncertainty in the ''representations'' themselves? To explore these questions Goodman, Tenenbaum, Feldman, and Griffiths (2008) introduced the Rational Rules model, which learns deterministic rules by probabilistic inference. This model has an infinite hypothesis space of rules (represented in propositional logic), which are generated compositionally. Here is a slightly simplified version of the model, applied to the above experiment:

~~~~
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

~~~~
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
