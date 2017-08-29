~~~~ {.idealized test_id="0"}
(query
 (define hypothesis (prior))
 hypothesis
 (equal? observed-data (repeat N (lambda () (observe hypothesis)))))
~~~~

~~~~ {test_id="1"}
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

     (equal? observed-data (repeat num-flips coin))))

(hist samples "Fair coin?")
~~~~

~~~~ {test_id="2"}
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
   
   (equal? observed-data (repeat num-flips coin))))

(hist prior-samples "Coin weight, prior to observing data")
(hist samples "Coin weight, conditioned on observed data")
~~~~

~~~~ {.mit-church test_id="3"}
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

~~~~ {test_id="4"}
(define observed-data '(h h h t h t h h t h))
(define num-flips (length observed-data))
(define num-samples 1000)
(define pseudo-counts '(10 10))
(define prior-samples (repeat num-samples (lambda () (beta (first pseudo-counts) 
                                                           (second pseudo-counts)))))

(define samples
  (mh-query
   num-samples 10
   
   (define coin-weight (beta (first pseudo-counts) (second pseudo-counts)))
   
   (define make-coin (lambda (weight) (lambda () (if (flip weight) 'h 't))))
   (define coin (make-coin coin-weight))
   
   coin-weight
   
   (equal? observed-data (repeat num-flips coin))))

(hist prior-samples "Coin weight, prior to observing data")
(hist samples "Coin weight, conditioned on observed data")
~~~~

~~~~ {test_id="5"}
(define samples
  (mh-query 10000 1
            (define cp (uniform 0 1)) ;;causal power of C to cause E.
            (define b (uniform 0 1))  ;;background probability of E.
            
            ;;the noisy causal relation to get E given C:
            (define (E-if-C C) 
              (or (and C (flip cp))
                  (flip b)))
            
            ;;infer the causal power:
            cp
            
            ;;condition on some contingency evidence:
            (and (E-if-C true)
                 (E-if-C true)
                 (not (E-if-C false))
                 (E-if-C true))))

(hist samples)
~~~~

~~~~ {test_id="6"}
(define (random-arithmetic-expression)
  (if (flip 0.7)
      (if (flip) 'x (sample-integer 10))
      (list (uniform-draw '(+ -)) (random-arithmetic-expression) (random-arithmetic-expression))))

(define (procedure-from-expression expr)
  (eval (list 'lambda '(x) expr)))

(define (sample)
(rejection-query
 
 (define my-expr (random-arithmetic-expression))
 (define my-proc (procedure-from-expression my-expr))
 
 my-expr
 
 (= (my-proc 1) 3)))

(apply display (repeat 20 sample))
~~~~

~~~~ {test_id="7"}
(define (random-arithmetic-fn)
  (if (flip 0.3)
      (random-combination (random-arithmetic-fn) (random-arithmetic-fn))
      (if (flip) 
          (lambda (x) x) 
          (random-constant-fn))))

(define (random-combination f g)
  (define op (uniform-draw (list + -)))
  (lambda (x) (op (f x) (g x))))

(define (random-constant-fn)
  (define i (sample-integer 10))
  (lambda (x) i))


(define (sample)
  (rejection-query
   
   (define my-proc (random-arithmetic-fn))
   
   (my-proc 2)
   
   (= (my-proc 1) 3)))

(repeat 100 sample)

(hist (repeat 500 sample))
~~~~

~~~~ {test_id="8"}
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
~~~~
