% Model of Cognitive Dissonance/Correspondence Bias

[Church Reference](webchurch/refs.html)

Keyboard shortcuts:

<code>Cmd + .</code> or <code>Ctrl + .</code> -- Fold code</acronym> (start foldable segments with <code>;;;fold:</code> and end with <code>;;;</code> )

<code>Cmd + ;</code> or <code>Ctrl + ;</code> -- Comment selection section

Simple model of cognitive model of a participant in Jones and Harris's class 1967. By adjusting the participant's priors and construal of the situation, one can see that the correspondence bias can be due to a number of latent factors (e.g., participant's estimate of the essay writer's susceptibility to social pressure).

~~~
;;;fold; utils ;;
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

;; priors and parameters ;;

(define preference-scale '(-10 -5 0 5 10)) ;(- is anti castro; + is pro castro)

(define influence-scale '(.005 .2 .4 .6 .8 .995))

(define options '(anti-castro pro-castro)) ; experimental domain

(define (act-prior) (uniform-draw options)) ; uniform prior over actions

(define (belief-prior) (multinomial preference-scale '(.3 .25 .2 .15 .1))) ; actor's beliefs

(define (situation-constraint-prior) (uniform-draw preference-scale)) ; direction and degree of induced action

(define (conviction-prior) (uniform-draw influence-scale)) ; strength of actor's (initial) belief

(define (power-of-situation-prior) (uniform-draw influence-scale)) ; strength of inducement to act

(define (susceptibility-to-social-influence-prior) (uniform-draw influence-scale)) ; actor's susceptibility to social pressure

  ;; the intuitive social psychologist ;;
(define (ip description actors-chose actors-conviction situation-constraint power-of-situation actors-susceptibility-to-social-pressure)
  (enumeration-query
   (define actors-belief (belief-prior))
   (define actor (apply multinomial (actors-choice actors-belief actors-conviction situation-constraint actors-susceptibility-to-social-pressure power-of-situation)))

   actors-belief

   ;ip observed:
   (equal? actors-chose (second actor)))) ; actor wrote __ essay



;;; ip's model of the actor ;;;
(define actors-choice
  (mem (lambda (actors-belief actors-conviction situation-constraint actors-susceptibility-to-social-pressure power-of-situation)
         (enumeration-query
          (define resultant-weight (logistic-regression (list actors-belief situation-constraint) (list actors-conviction (* actors-susceptibility-to-social-pressure power-of-situation))))
          (define action (act-prior))
          (define consonant-action (if (flip resultant-weight) (second options) (first options)))

          (list resultant-weight action)

          (equal? action consonant-action)))))

;; Observe Model's behavior in different situations/parameter regimes


(define params
  (list
    (list
    "Actor complies to situation pressure"
    'pro-castro ; Actor's action
    .6 ; actor's conviction
     5 ; situation constraint
    .6 ; power of situation
    .6) ; actor's susceptibility to social pressure

    (list
     "Actor doesn't comply to situation pressure"
    'anti-castro ; Actor's action
    .6 ; actor's conviction
     5 ; situation constraint
    .6 ; power of situation
    .6) ; actor's susceptibility to social pressure

   (list
    "Actor complies to situation pressure. Actor doesn't have strong belief"
    'pro-castro ; Actor's action
    .1 ; actor's conviction
     5 ; situation constraint
    .6 ; power of situation
    .6) ; actor's susceptibility to social pressure


   (list
    "Actor behaves consistently with situation pressure, but is not effected by it"
    'pro-castro ; Actor's action
    .6 ; actor's conviction
     5 ; situation constraint
    .6 ; power of situation
    0) ; actor's susceptibility to social pressure
))


(define (run-model model params)
  (map (lambda (xp) (pair (expectation (apply model xp)) xp)) params))

(define results
  (run-model ip params))

(barplot (list
           (map second results)
           (map first results))
           "Observers estimate of the probability that actor is pro-Castro")
~~~
