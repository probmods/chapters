~~~~ {test_id="0"}
(define baserate 0.1)

(define (take-sample)
  (rejection-query

   (define A (if (flip baserate) 1 0))
   (define B (if (flip baserate) 1 0))
   (define C (if (flip baserate) 1 0))
   (define D (+ A B C))

   A

   (>= D 2)))
   
(hist (repeat 100 take-sample) "Value of A, given D >= 2, using rejection")
~~~~

~~~~ {test_id="1"}
(define baserate 0.1)

(enumeration-query

 (define A (if (flip baserate) 1 0))
 (define B (if (flip baserate) 1 0))
 (define C (if (flip baserate) 1 0))
 (define D (+ A B C))

 A

 (>= D 2))
~~~~

~~~~ {test_id="2"}
(define baserate 0.1)

(define samples
  (mh-query 100 100

   (define A (if (flip baserate) 1 0))
   (define B (if (flip baserate) 1 0))
   (define C (if (flip baserate) 1 0))
   (define D (+ A B C))

   A

   (>= D 2)))
   
(hist samples "Value of A, given that D is greater than or equal to 2")
~~~~

~~~~ {test_id="3"}
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

(hist (repeat 2000 (lambda () (chain 'a 10))) "10 steps, starting at a.")
(hist (repeat 2000 (lambda () (chain 'c 10))) "10 steps, starting at c.")
(hist (repeat 2000 (lambda () (chain 'a 30))) "30 steps, starting at a.")
(hist (repeat 2000 (lambda () (chain 'c 30))) "30 steps, starting at c.")
~~~~

~~~~ {test_id="4"}
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
~~~~

~~~~ {test_id="5"}
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
~~~~

~~~~ {test_id="6"}
(define (geometric theta) (if (flip theta) (+ 1 (geometric theta)) 1))

(define samples
  (mh-query 2000 20
   (define x (geometric 0.7))
   x
   (> x 2)))

(hist samples "geometric > 2.")
~~~~

~~~~ {.norun test_id="7"}
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
~~~~

~~~~ {test_id="8"}
(define theta 0.7)

;;the target distribution (not normalized):
(define (target-distr x) 
  (if (< x 3) ;;the condition
      0.0     ;;prob is 0 if condition is violated
      (* (- 1 theta) (expt theta x)))) ;;otherwise prob is (proportional to) geometric distrib.

;;the proposal function and distribution,
;;here we're equally likely to propose x+1 or x-1.
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
~~~~

~~~~ {test_id="9"}
(define (all-but-last xs)
  (cond ((null? xs) (error "all-but-last got empty list!"))
        ((null? (rest xs)) '())
        (else (pair (first xs) (all-but-last (rest xs))))))

(define (all xs)
  (if (null? xs)
      #t
      (and (first xs)
           (all (rest xs)))))

(define (noisy-equal? a b)
  (flip (if (equal? a b) 1.0 0.2)))

(define samples
  (mh-query 30 1
            (define bits (repeat 10 (lambda () (if (flip) 1 0))))
            bits
            (all (map noisy-equal? (rest bits) (all-but-last bits)))))

(apply display samples)
~~~~

~~~~ {test_id="10"}
(define (inner x)
  (rejection-query
    (define y (flip))
    y
    (flip (if x 1.0 (if y 0.9 0.1)))))
    
(define (outer)
  (rejection-query
    (define x (flip))
    x
    (not (inner x))))
    
(hist (repeat 10000 outer))
~~~~

~~~~ {test_id="11"}
(define (inner x)
  (enumeration-query
   (define y (flip))
   y
   (flip (if x 1.0 (if y 0.9 0.1)))))

(define (outer)
  (enumeration-query
   (define x (flip))
   x
   (not (apply multinomial (inner x)))))

(hist (repeat 10000 (lambda () (apply multinomial (outer)))))
~~~~

~~~~ {test_id="12"}
(define inner 
  (mem (lambda (x)
         (enumeration-query
          (define y (flip))
          y
          (flip (if x 1.0 (if y 0.9 0.1)))))))

(define outer
  (mem (lambda () 
         (enumeration-query
          (define x (flip))
          x
          (not (apply multinomial (inner x)))))))

(hist (repeat 10000 (lambda () (apply multinomial (outer)))))
~~~~

~~~~ {test_id="13"}
(define inner 
  (mem (lambda (x)
         (mh-query 1000 1
          (define y (flip))
          y
          (flip (if x 1.0 (if y 0.9 0.1)))))))

(define outer
  (mem (lambda () 
         (mh-query 1000 1
          (define x (flip))
          x
          (not (uniform-draw (inner x)))))))

(hist (repeat 10000 (lambda () (uniform-draw (outer)))))
~~~~

~~~~ {test_id="14"}
(define baserate 0.1)

(define samples
  (mh-query 100 100

   (define A (if (flip baserate) 1 0))
   (define B (if (flip baserate) 1 0))
   (define C (if (flip baserate) 1 0))
   (define D (+ A B C))

   A

   (>= D 2)))
   
(hist samples "Value of A, given that D is greater than or equal to 2")
~~~~
