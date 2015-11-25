% Models that Reason about Social Sources to Learn from Actions and Outcomes

[Church Reference](webchurch/refs.html)
<script>$('#header').hide()</script>
Keyboard shortcuts:

<code>Cmd + .</code> or <code>Ctrl + .</code> -- Fold code</acronym> (start foldable segments with <code>;;;fold:</code> and end with <code>;;;</code> )

<code>Cmd + ;</code> or <code>Ctrl + ;</code> -- Comment selection section


# Results
## Experiment 1
Core Model

~~~
;;;fold: helper functions
(define (factorial n)
  (if (eq? n 0)
      1
      (* n (factorial (- n 1)))))

(define (combo n k)
  (/ (factorial n) (* (factorial k) (factorial (- n k)))))

(define (binomial weight xn)
  (let ([n (+ 1 xn)])
    (multinomial (iota n 0) (map (lambda (x) (bin_prob weight n x)) (iota n 0)))))

(define (observe weight ndata obs)
  (flip (bin_prob weight ndata obs)))

(define (bin_prob weight ndata obs)
  (define n ndata)
  (define k obs)
  (define p weight)
  (define nk (- n k))
  (define np (- 1 p))

  (* (combo n k) (expt p k) (expt np nk)))

(define (my-round x)
  (if (equal? x .5)
      (if (flip) 0 1)
      (round x)))

(define (expectation dist)
  (sum (apply map (pair * dist))))

(define (cartesian-product . lists)
  (fold (lambda (xs ys)
          (apply append
                 (map (lambda (x)
                        (map (lambda (y)
                               (pair x y))
                             ys))
                      xs)))
        '(())
        lists))

(define (run-model model params)
  (map (lambda (xp) (pair (expectation (apply model xp)) xp)) params))
;;;

;;;fold: set data and priors
(define ss-nsamples  5)

(define (act-prior)
  (uniform-draw '(0 1)))

(define (empirical-weight-prior)
  (multinomial '(.0005 .1 .2 0.3 0.4 0.5 0.6 0.7 0.8 .9 .9995) '(.3 3 1 .3 1 1 1 .3 1 3 .3)))
;;;

;;; zach model ;;;

;; zach model ;;
(define zachs-choice
  (mem (lambda (obs reliable nsamples)
         (enumeration-query

          (define weight (empirical-weight-prior))
          (define act (act-prior))
          (define result (if reliable
                             (my-round weight)
                             (if (flip) 1 0)))

          act

          (and (observe weight nsamples obs)
               (equal? act result))))))

;;; ss' model ;;;
(define (ss-model ss-obs zach-nsamples zach-reliable)
  (enumeration-query
   (define ss-weight (empirical-weight-prior))
   (define zach-obs (binomial ss-weight zach-nsamples))
   (define zach (zachs-choice zach-obs zach-reliable zach-nsamples))

   ss-weight

   ;;assuming our observations and zach's choice:
   (and (observe ss-weight ss-nsamples ss-obs)
        (equal? 1 (apply multinomial zach)))))

;; example trial ;;
(ss-model 4 10 0)
~~~


### Figure 8
Effect of learner's observations (k<sub>l</sub>) and number of Zach's observations (n<sub>z</sub>) on learner's estimate of horse _x_'s skill. What happens when Zach gets more knowledgeable?

~~~
;;;fold: helper functions
(define (lst->string data)
  (apply string-append
       (map (lambda (xn)
              (string-append (number->string xn) " "))
             data)))

(define (factorial n)
  (if (eq? n 0)
      1
      (* n (factorial (- n 1)))))

(define (combo n k)
  (/ (factorial n) (* (factorial k) (factorial (- n k)))))

(define (binomial weight xn)
  (let ([n (+ 1 xn)])
    (multinomial (iota n 0) (map (lambda (x) (bin_prob weight n x)) (iota n 0)))))

(define (observe weight ndata obs)
  (flip (bin_prob weight ndata obs)))

(define (bin_prob weight ndata obs)
  (define n ndata)
  (define k obs)
  (define p weight)
  (define nk (- n k))
  (define np (- 1 p))

  (* (combo n k) (expt p k) (expt np nk)))

(define (my-round x)
  (if (equal? x .5)
      (if (flip) 0 1)
      (round x)))

(define (expectation dist)
  (sum (apply map (pair * dist))))

(define (cartesian-product . lists)
  (fold (lambda (xs ys)
          (apply append
                 (map (lambda (x)
                        (map (lambda (y)
                               (pair x y))
                             ys))
                      xs)))
        '(())
        lists))

(define (run-model model params)
  (map (lambda (xp) (pair (expectation (apply model xp)) xp)) params))
;;;

;;;fold: set data and priors
(define ss-nsamples  5)

(define (act-prior)
  (uniform-draw '(0 1)))

(define (empirical-weight-prior)
  (multinomial '(.0005 .1 .2 0.3 0.4 0.5 0.6 0.7 0.8 .9 .9995) '(.3 3 1 .3 1 1 1 .3 1 3 .3)))
;;;

;;;fold: Core Model

;; zach model ;;
(define zachs-choice
  (mem (lambda (obs reliable nsamples)
         (enumeration-query

          (define weight (empirical-weight-prior))
          (define act (act-prior))
          (define result (if reliable
                             (my-round weight)
                             (if (flip) 1 0)))

          act

          (and (observe weight nsamples obs)
               (equal? act result))))))

;; ss' model ;;
(define (ss-model ss-obs zach-nsamples zach-reliable)
  (enumeration-query
   (define ss-weight (empirical-weight-prior))
   (define zach-obs (binomial ss-weight zach-nsamples))
   (define zach (zachs-choice zach-obs zach-reliable zach-nsamples))

   ss-weight

   ;;assuming our observations and zach's choice:
   (and (observe ss-weight ss-nsamples ss-obs)
        (equal? 1 (apply multinomial zach)))))
;;;

;; See the effect of zach-nsample or ss-obs
(define params-reliable
  (cartesian-product
   '(1) ;zach-reliable
   '(0 10 30) ;zach-nsamples
   '(1))) ;ss-obs

(define params-unreliable
  (cartesian-product
    '(0) ;zach-reliable
    '(0 10 30) ;zach-nsamples
    '(1))) ;ss-obs

;; What are the model predictions for ss who thought Zach was unreliable?
(define unreliable
  (run-model ss-model params-unreliable))

;; What are the model predictions for ss who thought Zach was reliable?
(define reliable
  (run-model ss-model params-reliable))

;; What are the model predictions for the aggregate data if the population
;; was a mixture of reliable and unreliable ss in the proportion measured in
;; the exit questionnaire of the experiment?
(define mixed
  (map (lambda (rel unrel)
         (pair (expectation
                (list (list (first rel) (first unrel))
                      '(.74 .26))) ;;measured in experiment
               (rest rel)))
       reliable unreliable))



(barplot (list (map third mixed) (map first mixed)) (string-append
                                                   "Model's predictions when it sees "
                                                   (number->string (second (first mixed)))
                                                   "/5 and Zach sees either "
                                                   (lst->string (map third mixed))
                                                   " races"))

~~~

#### Resulting Model vs. Data Plot (R<sup>2</sup> = .96)

<img src='images/djh/E1P1.png' width='500' />



### Figure 9

Effect of learner's estimate of Zach's reliability (&alpha;<sub>z</sub>), learner's observations (k<sub>l</sub>), and number of Zach's observations (n<sub>z</sub>) on learner's estimate of horse _x_'s skill. Is there a attributed reliability by knowledgeability interaction?

~~~
;;;fold: helper functions
(define (lst->string data)
  (apply string-append
       (map (lambda (xn)
              (string-append (number->string xn) " "))
             data)))

(define (factorial n)
  (if (eq? n 0)
      1
      (* n (factorial (- n 1)))))

(define (combo n k)
  (/ (factorial n) (* (factorial k) (factorial (- n k)))))

(define (binomial weight xn)
  (let ([n (+ 1 xn)])
    (multinomial (iota n 0) (map (lambda (x) (bin_prob weight n x)) (iota n 0)))))

(define (observe weight ndata obs)
  (flip (bin_prob weight ndata obs)))

(define (bin_prob weight ndata obs)
  (define n ndata)
  (define k obs)
  (define p weight)
  (define nk (- n k))
  (define np (- 1 p))

  (* (combo n k) (expt p k) (expt np nk)))

(define (my-round x)
  (if (equal? x .5)
      (if (flip) 0 1)
      (round x)))

(define (expectation dist)
  (sum (apply map (pair * dist))))

(define (cartesian-product . lists)
  (fold (lambda (xs ys)
          (apply append
                 (map (lambda (x)
                        (map (lambda (y)
                               (pair x y))
                             ys))
                      xs)))
        '(())
        lists))

(define (run-model model params)
  (map (lambda (xp) (pair (expectation (apply model xp)) xp)) params))
;;;

;;;fold: set data and priors
(define ss-nsamples  5)

(define (act-prior)
  (uniform-draw '(0 1)))

(define (empirical-weight-prior)
  (multinomial '(.0005 .1 .2 0.3 0.4 0.5 0.6 0.7 0.8 .9 .9995) '(.3 3 1 .3 1 1 1 .3 1 3 .3)))
;;;

;;;fold: Core Model

;; zach model ;;
(define (zachs-choice obs reliable nsamples)
  (enumeration-query

   (define weight (empirical-weight-prior))
   (define act (act-prior))
   (define result (if reliable
                      (my-round weight)
                      (if (flip) 1 0)))

   act

   (and (observe weight nsamples obs)
        (equal? act result))))

;; ss' model ;;
(define (ss-model ss-obs zach-nsamples zach-reliable)
  (enumeration-query
   (define ss-weight (empirical-weight-prior))
   (define zach-obs (binomial ss-weight zach-nsamples))

   (define zach (zachs-choice zach-obs zach-reliable zach-nsamples))

   ss-weight

   ;;assuming our observations and zach's choice:
   (and (observe ss-weight ss-nsamples ss-obs)
        (equal? 1 (apply multinomial zach)))))
;;;

; See the effect of zach-nsample or ss-obs
(define params-reliable
  (cartesian-product
   '(1) ;zach-reliable
   '(10) ;zach-nsamples
   '(1))) ;ss-obs

(define params-unreliable
  (cartesian-product
    '(0) ;zach-reliable
    '(10) ;zach-nsamples
    '(1))) ;ss-obs

;; What are the model predictions for ss who thought Zach was unreliable?
(define unreliable
  (run-model ss-model params-unreliable))

;; What are the model predictions for ss who thought Zach was reliable?
(define reliable
  (run-model ss-model params-reliable))

(barplot (list (append (map fourth reliable)
                       (map fourth unreliable))
               (append (map first reliable)
                       (map first unreliable))
               "label")
               (string-append
                "Model's predictions when it sees "
                (number->string (second (first reliable)))
                "/5 and Zach is thought to be {reliable(1)/unreliable(0)}"))

~~~


#### Resulting Model vs. Data Plot (R<sup>2</sup> = .88)

<img src='images/djh/E1P2.png' width='500' />

## Experiment 2

Confidence Model

~~~
;;;fold: helper functions
(define (at-index int lst)
  (if int
      (at-index (- int 1) (rest lst))
      (first lst)))

(define (factorial n)
  (if (eq? n 0)
      1
      (* n (factorial (- n 1)))))

(define (combo n k)
  (/ (factorial n) (* (factorial k) (factorial (- n k)))))

(define (binomial weight n)
  (multinomial (iota n 0) (map (lambda (x) (bin_prob weight n x)) (iota n 0))))


(define (observe weight ndata obs)
  (flip (bin_prob weight ndata obs)))

(define (bin_prob weight ndata obs)
  (define n ndata)
  (define k obs)
  (define p weight)
  (define nk (- n k))
  (define np (- 1 p))
    (* (combo n k) (expt p k) (expt np nk)))

(define (expectation dist) (sum (apply map (pair * dist))))

(define (my-round x)
  (if (equal? x .5)
      (if (flip) 0 1)
      (round x)))

(define (expectation dist)
  (sum (apply map (pair * dist))))

(define (marginalize-each data)
  (apply map (pair +
                   (map (lambda (probs vals)
                          (map (lambda (xv)
                                 (* probs xv))
                               vals))
                        (second data) (first data)))))

(define (cartesian-product . lists)
  (fold (lambda (xs ys)
          (apply append
                 (map (lambda (x)
                        (map (lambda (y)
                               (pair x y))
                             ys))
                      xs)))
        '(())
        lists))

(define (run-model model params)
  (map (lambda (xp) (pair (expectation (apply model xp)) xp)) params))
;;;

;;;fold: set data and priors
  (define reliable-prior .83)

  (define ss-nsamples 5)

  (define zach-nsamples 10)

  (define (act-prior)
    (uniform-draw '(0 1)))

  (define (empirical-weight-prior)
    (multinomial '(.0005 .1 .2 0.3 0.4 0.5 0.6 0.7 0.8 .9 .9995) '(.3 3 1 .3 1 1 1 .3 1 3 .3)))


;; Zach thinking about his action's accuracy and then binning it into "confidence" ;;
(define zach-with-confidence
  (lambda (z-obs reliable)

         (define action-dist
           (zachs-choice z-obs reliable))

         ;;given we are going to condition on action being 1 we can make this
         ;;simplification. The more general model would read:
         (define action (apply multinomial action-dist))
         ;; (define action 1)

         (define conf-number ;;proportion of times Zach thinks chosen action will be successful
           (if reliable
               (at-index action (second action-dist))
               (uniform-draw '(0 .25 .5 .75 1))))

         (define confidence
           (cond ((> conf-number .75) "high")
                 ((> conf-number .5) "medium")
                 (else "low")))

         (list action confidence conf-number)))


;;;

;; zach model ;;
(define zachs-choice
  (mem (lambda (z-obs reliable)
         (enumeration-query
          (define z-weight (empirical-weight-prior))
          (define act (act-prior))
          (define result (if reliable
                             (my-round z-weight)
                             (if (flip) 1 0)))

   act

   (and (observe z-weight zach-nsamples z-obs)
        (equal? act result))))))

;; ss' model ;;
(define (ss-model ss-obs zach-confidence zach-reliable)
  (enumeration-query
   (define ss-weight (empirical-weight-prior))
   (define zach-obs (binomial ss-weight zach-nsamples))
   (define zach (zach-with-confidence zach-obs zach-reliable))

   ss-weight

   ;;conditioning on ss' observations, zach's choice, and zach's confidence:
   (and (observe ss-weight ss-nsamples ss-obs)
        (equal? 1 (first zach))
        (equal? zach-confidence (second zach)))))



;; example trial ;;
(ss-model 2 'high' 1)
~~~

### Figure 10
Effect of Zach's confidence (c<sub>z</sub>) on learner's estimate of horse _x_'s skill (at different levels of learner's observations (k<sub>l</sub>). How does confidence effect Zach's influence?

~~~
;;;fold: helper functions
(define (lst->string data)
  (apply string-append
       (map (lambda (xn)
              (string-append (number->string xn) " "))
             data)))

(define (at-index int lst)
  (if int
      (at-index (- int 1) (rest lst))
      (first lst)))

(define (factorial n)
  (if (eq? n 0)
      1
      (* n (factorial (- n 1)))))

(define (combo n k)
  (/ (factorial n) (* (factorial k) (factorial (- n k)))))

(define (binomial weight n)
  (multinomial (iota n 0) (map (lambda (x) (bin_prob weight n x)) (iota n 0))))


(define (observe weight ndata obs)
  (flip (bin_prob weight ndata obs)))

(define (bin_prob weight ndata obs)
  (define n ndata)
  (define k obs)
  (define p weight)
  (define nk (- n k))
  (define np (- 1 p))
    (* (combo n k) (expt p k) (expt np nk)))

(define (expectation dist) (sum (apply map (pair * dist))))

(define (my-round x)
  (if (equal? x .5)
      (if (flip) 0 1)
      (round x)))

(define (expectation dist)
  (sum (apply map (pair * dist))))

(define (marginalize-each data)
  (apply map (pair +
                   (map (lambda (probs vals)
                          (map (lambda (xv)
                                 (* probs xv))
                               vals))
                        (second data) (first data)))))

(define (cartesian-product . lists)
  (fold (lambda (xs ys)
          (apply append
                 (map (lambda (x)
                        (map (lambda (y)
                               (pair x y))
                             ys))
                      xs)))
        '(())
        lists))

(define (run-model model params)
  (map (lambda (xp) (pair (expectation (apply model xp)) xp)) params))
;;;

;;;fold: set data and priors
  (define reliable-prior .83)

  (define ss-nsamples 5)

  (define zach-nsamples 10)

  (define (act-prior)
    (uniform-draw '(0 1)))

  (define (empirical-weight-prior)
    (multinomial '(.0005 .1 .2 0.3 0.4 0.5 0.6 0.7 0.8 .9 .9995) '(.3 3 1 .3 1 1 1 .3 1 3 .3)))

;;;

;;;fold: Confidence Model

  ;; Zach thinking about his action's accuracy and then binning it into "confidence" ;;
(define zach-with-confidence
  (lambda (z-obs reliable)

         (define action-dist
           (zachs-choice z-obs reliable))

         ;;given we are going to condition on action being 1 we can make this
         ;;simplification. The more general model would read:
         (define action (apply multinomial action-dist))
         ;; (define action 1)

         (define conf-number ;;proportion of times Zach thinks chosen action will be successful
           (if reliable
               (at-index action (second action-dist))
               (uniform-draw '(0 .25 .5 .75 1))))

         (define confidence
           (cond ((> conf-number .75) "high")
                 ((> conf-number .5) "medium")
                 (else "low")))

         (list action confidence conf-number)))

;; zach model ;;
(define zachs-choice
  (mem (lambda (z-obs reliable)
         (enumeration-query
          (define z-weight (empirical-weight-prior))
          (define act (act-prior))
          (define result (if reliable
                             (my-round z-weight)
                             (if (flip) 1 0)))

   act

   (and (observe z-weight zach-nsamples z-obs)
        (equal? act result))))))

;; ss' model ;;
(define (ss-model ss-obs zach-confidence zach-reliable)
  (enumeration-query
   (define ss-weight (empirical-weight-prior))
   (define zach-obs (binomial ss-weight zach-nsamples))
   (define zach (zach-with-confidence zach-obs zach-reliable))

   ss-weight

   ;;conditioning on ss' observations, zach's choice, and zach's confidence:
   (and (observe ss-weight ss-nsamples ss-obs)
        (equal? 1 (first zach))
        (equal? zach-confidence (second zach)))))
;;;

  (define params-reliable
    (cartesian-product
     '(1) ;zach-reliable
     '("low" "high") ;zach-confidence
     '(1))) ;ss-obs

  (define params-unreliable
    (cartesian-product
      '(0) ;zach-reliable
      '("low" "high") ;zach-confidence
      '(1))) ;ss-obs

  ;; What are the model predictions for ss who thought Zach was unreliable?
   (define unreliable
     (run-model ss-model params-unreliable))
  ;; What are the model predictions for ss who thought Zach was reliable?
   (define reliable
     (run-model ss-model params-reliable))

  ;; What are the model predictions for the aggregate data if the population
  ;; was a mixture of reliable and unreliable ss in the proportion measured in
  ;; the exit questionnaire of the experiment?
  (define mixed
    (map (lambda (rel unrel)
           (pair (expectation
                  (list (list (first rel) (first unrel))
                        (list reliable-prior (- 1 reliable-prior))))
                 (rest rel)))
         reliable unreliable))


(barplot (list (map third mixed) (map first mixed)) (string-append
                                                   "Model's predictions when it sees "
                                                   (number->string (second (first mixed)))
                                                   "/5 and Zach bets with {low/high} confidence"))


~~~

#### Resulting Model vs. Data Plot (R<sup>2</sup> = .99)

<img src='images/djh/E2P1.png' width='500' />


### Figure 11
Effect of learner's estimate of Zach's reliability on learner's estimate of horse _x_'s skill (at different levels of learner's observations (k<sub>l</sub> and Zach's confidence (c<sub>z</sub>)). Is there a confidence by reliability interaction?

~~~
;;;fold: helper functions
(define (lst->string data)
  (apply string-append
       (map (lambda (xn)
              (string-append (number->string xn) " "))
             data)))

(define (at-index int lst)
  (if int
      (at-index (- int 1) (rest lst))
      (first lst)))

(define (factorial n)
  (if (eq? n 0)
      1
      (* n (factorial (- n 1)))))

(define (combo n k)
  (/ (factorial n) (* (factorial k) (factorial (- n k)))))

(define (binomial weight n)
  (multinomial (iota n 0) (map (lambda (x) (bin_prob weight n x)) (iota n 0))))


(define (observe weight ndata obs)
  (flip (bin_prob weight ndata obs)))

(define (bin_prob weight ndata obs)
  (define n ndata)
  (define k obs)
  (define p weight)
  (define nk (- n k))
  (define np (- 1 p))
    (* (combo n k) (expt p k) (expt np nk)))

(define (expectation dist) (sum (apply map (pair * dist))))

(define (my-round x)
  (if (equal? x .5)
      (if (flip) 0 1)
      (round x)))

(define (expectation dist)
  (sum (apply map (pair * dist))))

(define (marginalize-each data)
  (apply map (pair +
                   (map (lambda (probs vals)
                          (map (lambda (xv)
                                 (* probs xv))
                               vals))
                        (second data) (first data)))))

(define (cartesian-product . lists)
  (fold (lambda (xs ys)
          (apply append
                 (map (lambda (x)
                        (map (lambda (y)
                               (pair x y))
                             ys))
                      xs)))
        '(())
        lists))

(define (run-model model params)
  (map (lambda (xp) (pair (expectation (apply model xp)) xp)) params))


;;;

;;;fold: set data and priors
(define reliable-prior .83)

(define ss-nsamples 5)

(define zach-nsamples 10)

(define (act-prior)
  (uniform-draw '(0 1)))

(define (empirical-weight-prior)
  (multinomial '(.0005 .1 .2 0.3 0.4 0.5 0.6 0.7 0.8 .9 .9995) '(.3 3 1 .3 1 1 1 .3 1 3 .3)))
;;;

;;;fold: Confidence Model

;; Zach thinking about his action's accuracy and then binning it into "confidence" ;;
(define zach-with-confidence
  (lambda (z-obs reliable)

         (define action-dist
           (zachs-choice z-obs reliable))

         ;;given we are going to condition on action being 1 we can make this
         ;;simplification. The more general model would read:
         (define action (apply multinomial action-dist))
         ;; (define action 1)

         (define conf-number ;;proportion of times Zach thinks chosen action will be successful
           (if reliable
               (at-index action (second action-dist))
               (uniform-draw '(0 .25 .5 .75 1))))

         (define confidence
           (cond ((> conf-number .75) "high")
                 ((> conf-number .5) "medium")
                 (else "low")))

         (list action confidence conf-number)))

;; zach model ;;
(define zachs-choice
  (mem (lambda (z-obs reliable)
         (enumeration-query
          (define z-weight (empirical-weight-prior))
          (define act (act-prior))
          (define result (if reliable
                             (my-round z-weight)
                             (if (flip) 1 0)))

   act

   (and (observe z-weight zach-nsamples z-obs)
        (equal? act result))))))

;; ss' model ;;
(define (ss-model ss-obs zach-confidence zach-reliable)
  (enumeration-query
   (define ss-weight (empirical-weight-prior))
   (define zach-obs (binomial ss-weight zach-nsamples))
   (define zach (zach-with-confidence zach-obs zach-reliable))

   ss-weight

   ;;conditioning on ss' observations, zach's choice, and zach's confidence:
   (and (observe ss-weight ss-nsamples ss-obs)
        (equal? 1 (first zach))
        (equal? zach-confidence (second zach)))))
;;;

(define params-reliable
  (cartesian-product
   '(1) ;zach-reliable
   '("low" "high") ;zach-confidence
   '(1))) ;ss-obs

(define params-unreliable
  (cartesian-product
    '(0) ;zach-reliable
    '("low" "high") ;zach-confidence
    '(1))) ;ss-obs

;; What are the model predictions for ss who thought Zach was unreliable?
 (define unreliable
   (run-model ss-model params-unreliable))
;; What are the model predictions for ss who thought Zach was reliable?
 (define reliable
   (run-model ss-model params-reliable))


(barplot (list (append (map (lambda (x) (list (third x) (fourth x))) reliable)
                       (map (lambda (x) (list (third x) (fourth x))) unreliable))
              (append (map first reliable)
                      (map first unreliable)))
              (string-append
               "Model's predictions when it sees "
               (number->string (second (first reliable)))
               "/5 and Zach bets with {low/high} confidence and is thought to be {reliable(1)/unreliable(0)}"))

~~~

#### Resulting Model vs. Data Plot (R<sup>2</sup> = .99)

<img src='images/djh/E2P2.png' width='500' />

## Experiment 3

Infer Zach's Reliability Model

~~~
;;;fold: helper functions ;;;
(define (factorial n)
  (if (eq? n 0)
      1
      (* n (factorial (- n 1)))))

(define (combo n k)
  (/ (factorial n) (* (factorial k) (factorial (- n k)))))

(define (binomial weight xn)
  (let ([n (+ 1 xn)])
    (multinomial (iota n 0) (map (lambda (x) (bin_prob weight n x)) (iota n 0)))))

(define (observe weight ndata obs)
  (flip (bin_prob weight ndata obs)))

(define (bin_prob weight ndata obs)
  (define n ndata)
  (define k obs)
  (define p weight)
  (define nk (- n k))
  (define np (- 1 p))

  (* (combo n k) (expt p k) (expt np nk)))

(define (my-round x)
  (if (equal? x .5)
      (if (flip) 0 1)
      (round x)))

(define (expectation dist)
  (sum (apply map (pair * dist))))

(define (marginalize-each data)
  (apply map (pair +
                   (map (lambda (probs vals)
                          (map (lambda (xv)
                                 (* probs xv))
                               vals))
                        (second data) (first data)))))

(define (cartesian-product . lists)
  (fold (lambda (xs ys)
          (apply append
                 (map (lambda (x)
                        (map (lambda (y)
                               (pair x y))
                             ys))
                      xs)))
        '(())
        lists))

(define (run-model model params)
  (map (lambda (xp) (pair (expectation (apply model xp)) xp)) params))

(define (run-model-multi model params)
  (map (lambda (xp) (append (list (marginalize-each (apply model xp))) xp)) params))

(define (run-model-multi2 model params)
  (map (lambda (xp) (append (marginalize-each (apply model xp)) xp)) params))
;;;

;;;fold: set parameters and priors ;;;

(define zach-reliable-prior .77)

(define ss-nsamples 5)

(define (act-prior)
  (uniform-draw '(0 1)))

(define (empirical-weight-prior)
  (multinomial '(.0005 .1 .2 0.3 0.4 0.5 0.6 0.7 0.8 .9 .9995) '(.3 3 1 .3 1 1 1 .3 1 3 .3)))
;;;

  ;;; zach model ;;;
(define zachs-choice
  (mem
   (lambda (obs reliable nsamples)
     (enumeration-query

      (define weight (empirical-weight-prior))
      (define act (act-prior))
      (define result (if reliable
                         (my-round weight)
                         (if (flip) 1 0)))

      act

      (and (observe weight nsamples obs)
           (equal? act result))))))


  ;;; ss' model ;;;
(define (ss-model ss-obs zach-nsamples zach-obs1 zach-acts-reliable)
  (enumeration-query

   (define zach-reliable (if (flip zach-reliable-prior) 1 0))
   (define zach1 (zachs-choice zach-obs1 zach-reliable zach-nsamples))


   zach-reliable

   ;;assuming our observations and zach's choice:
   (equal? zach-acts-reliable (apply multinomial zach1))))


;; What are the model predictions when Zach bets inconsistently with his evidence?
(ss-model 1 10 8 0)
~~~

### Figure 12
When Zach is observed acting (in)consistently with his observations, how does this effect the learner's assessment of his reliability and how influential is he subsequently?


~~~
;;;fold: helper functions ;;;
(define (factorial n)
  (if (eq? n 0)
      1
      (* n (factorial (- n 1)))))

(define (combo n k)
  (/ (factorial n) (* (factorial k) (factorial (- n k)))))

(define (binomial weight xn)
  (let ([n (+ 1 xn)])
    (multinomial (iota n 0) (map (lambda (x) (bin_prob weight n x)) (iota n 0)))))

(define (observe weight ndata obs)
  (flip (bin_prob weight ndata obs)))

(define (bin_prob weight ndata obs)
  (define n ndata)
  (define k obs)
  (define p weight)
  (define nk (- n k))
  (define np (- 1 p))

  (* (combo n k) (expt p k) (expt np nk)))

(define (my-round x)
  (if (equal? x .5)
      (if (flip) 0 1)
      (round x)))

(define (expectation dist)
  (sum (apply map (pair * dist))))

(define (marginalize-each data)
  (apply map (pair +
                   (map (lambda (probs vals)
                          (map (lambda (xv)
                                 (* probs xv))
                               vals))
                        (second data) (first data)))))

(define (cartesian-product . lists)
  (fold (lambda (xs ys)
          (apply append
                 (map (lambda (x)
                        (map (lambda (y)
                               (pair x y))
                             ys))
                      xs)))
        '(())
        lists))

(define (run-model model params)
  (map (lambda (xp) (pair (expectation (apply model xp)) xp)) params))

(define (run-model-multi model params)
  (map (lambda (xp) (append (list (marginalize-each (apply model xp))) xp)) params))

(define (run-model-multi2 model params)
  (map (lambda (xp) (append (marginalize-each (apply model xp)) xp)) params))
;;;

;;;fold: set parameters and priors ;;;

(define zach-reliable-prior .77)

(define ss-nsamples 5)

(define (act-prior)
  (uniform-draw '(0 1)))


(define (weight-prior)
  (uniform-draw '(.0005 .1 .3 .5 .7 .9 .9995)))

(define (empirical-weight-prior)
  (multinomial '(.0005 .1 .2 0.3 0.4 0.5 0.6 0.7 0.8 .9 .9995) '(.3 3 1 .3 1 1 1 .3 1 3 .3)))
;;;

;;;fold: infer reliability model
  ;;; zach model ;;;
(define zachs-choice
  (mem
   (lambda (obs reliable nsamples)
     (enumeration-query

      (define weight (weight-prior))
      (define act (act-prior))
      (define result (if reliable
                         (my-round weight)
                         (if (flip) 1 0)))

      act

      (and (observe weight nsamples obs)
           (equal? act result))))))


  ;;; ss' model (inferred) ;;;
(define (ss-model-infer-reliability ss-obs zach-nsamples zach-obs1 zach-acts-reliable)
  (enumeration-query

   (define zach-reliable (if (flip zach-reliable-prior) 1 0))
   (define zach1 (zachs-choice zach-obs1 zach-reliable zach-nsamples))


   zach-reliable

   ;;assuming our observations and zach's choice:
   (equal? zach-acts-reliable (apply multinomial zach1))))


 ;;; ss' model (core) ;;;
(define (ss-model-core ss-obs zach-nsamples zach-reliable)
  (enumeration-query
   (define ss-weight (weight-prior))
   (define zach-obs (binomial ss-weight zach-nsamples))
   (define zach (zachs-choice zach-obs zach-reliable zach-nsamples))

   ss-weight

   ;;assuming our observations and zach's choice:
   (and (observe ss-weight ss-nsamples ss-obs)
        (equal? 1 (apply multinomial zach)))))
;;;



;; What are the model predictions for ss who thought Zach was unreliable?
(define unreliable
  (expectation (ss-model-core 1 10 0)))

;; What are the model predictions for ss who thought Zach was reliable?
(define reliable
  (expectation (ss-model-core 1 10 1)))


;; What are the model predictions for the aggregate data if the population
;; was a mixture of reliable and unreliable ss in the proportion measured in
;; the exit questionnaire of the experiment?
(define (mixed reliability)
  (expectation
   (list (list reliable unreliable)
         (list reliability (- 1 reliability)))))



(define zach-reliability-inconsistent (second (second (ss-model-infer-reliability 1 10 8 0))))
(define zach-reliability-consistent (second (second (ss-model-infer-reliability 1 10 8 1))))
(define chance-estimate-when-zach-consistent (mixed zach-reliability-consistent))
(define chance-estimate-when-zach-inconsistent (mixed zach-reliability-inconsistent))


(barplot (list (list "Zach's reliability when he acted inconsistently"
                     "Zach's reliability when he acted consistently"
                     "Chance Estimate when he acted inconsistently"
                     "Chance Estimate when he acted consistently"
                     )
               (list zach-reliability-inconsistent
                     zach-reliability-consistent
                     chance-estimate-when-zach-inconsistent
                     chance-estimate-when-zach-consistent))
          "Model's predictions inferring Zach's reliability given his actions")
~~~


#### Resulting Model vs. Data Plot (R<sup>2</sup> = .98)

<img src='images/djh/E3P1.png' width='500' />
