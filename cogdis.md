% Models for Learn from Zach Paper
[Church Reference](webchurch/refs.html)

Keyboard shortcuts:

<code>Cmd + .</code> or <code>Ctrl + .</code> -- Fold code</acronym> (start foldable segments with <code>;;;fold:</code> and end with <code>;;;</code> )

<code>Cmd + ;</code> or <code>Ctrl + ;</code> -- Comment selection section

Simple model of cognitive model of a paricipant in Jones and Harris's class 1967. By adjusting the participant's priors and construal of the situation, one can see that the correspondece bias can be due to a number of latent factors (e.g., participant's estimate of the essay writer's succeptibility to social pressure).

~~~
;;;; start Castro

  ;; utils ;;
  (define (expectation dist) (sum (apply map (pair * dist))))

  (define (zip a b)
    (if (equal? (length a) 0)
        '()
        (pair (list (first a) (first b)) (zip (rest a) (rest b)))))

  (define (zip-pair a b)
    (if (equal? (length a) 0)
        '()
        (pair (pair (first a) (first b)) (zip-pair (rest a) (rest b)))))

  ;; logistic regression ;;
  (define (dot-product lists) (sum (apply map (pair * lists))))

  (define (normalize xs)
    (let ([Z (sum xs)])
    (map (lambda (x) (/ x Z))
           xs)))

  (define (sigmoid x)
    (/ 1 (+ 1 (exp (* -1 x)))))

  (define (logistic-regression x weights)
    (sigmoid (dot-product (list (normalize weights)  x))))

  ;; experimental domain ;;
  (define options '(anti-castro pro-castro))


  ;; intuitive social psychologist's priors (for actors)

  (define (act-prior) (uniform-draw options))

  ;; direction of influence prior ;;
  (define preference-scale '(-10 -5 0 5 10))

  (define (belief-prior) (uniform-draw preference-scale))

  (define (situation-constraint-prior) (uniform-draw preference-scale))

  ;; power of influence prior;;
  (define influence-scale '(.005 .2 .4 .6 .8 .995))

  (define (conviction-prior) (uniform-draw influence-scale))

  (define (power-of-situation-prior) (uniform-draw influence-scale))

  (define (susceptibility-to-social-influence-prior) (uniform-draw influence-scale))


    ;;; the intuitive social psychologist ;;;
  (define (itp)
    (enumeration-query

     (define actors-belief (belief-prior))

     (define actors-conviction (conviction-prior))

     (define situation-constraint (situation-constraint-prior))

     (define power-of-situation (power-of-situation-prior))

     (define actors-susceptibility-to-social-pressure (susceptibility-to-social-influence-prior))

     (define actor (apply multinomial (actors-choice actors-belief actors-conviction situation-constraint actors-susceptibility-to-social-pressure power-of-situation)))

     (first actor)

     ;;itp observed actor writing pro-castro essay
     (and
      (equal? 'pro-castro (second actor))
      (equal? actors-conviction .6)
      (equal? situation-constraint 5)
      (equal? power-of-situation .6)
      (equal? actors-susceptibility-to-social-pressure .6)
      )))


  ;;; itp's model of the actor ;;;
  (define (actors-choice actors-belief actors-conviction situation-constraint actors-susceptibility-to-social-pressure power-of-situation)
    (enumeration-query

     (define resultant-weight (logistic-regression (list actors-belief situation-constraint) (list actors-conviction (* actors-susceptibility-to-social-pressure power-of-situation))))

     (define action (act-prior))

     (define consonant-action (if (flip resultant-weight) (first options) (second options)))

     (list resultant-weight action)

     (equal? action consonant-action)))

  ;; ditplay results ;;
  (define posterior-belief (itp))

  (expectation posterior-belief)
~~~
