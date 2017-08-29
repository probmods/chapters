~~~~ {test_id="0"}
(define (sample)
 (rejection-query
  
  ;;this machine makes a widget -- which we'll just represent with a real number:
  (define (widget-maker)  (multinomial '(.2 .3 .4 .5 .6 .7 .8) '(.05 .1 .2 .3 .2 .1 .05)))
  
  ;;this machine tests widgets as they come out of the widget-maker, letting
  ;; through only those that pass threshold:
  (define (next-good-widget)
    (define widget (widget-maker))
    (if (> widget threshold)
        widget
        (next-good-widget)))
  
  ;;but we don't know what threshold the widget tester is set to:
  
  (define threshold  (multinomial '(.3 .4 .5 .6 .7) '(.1 .2 .4 .2 .1)))
  
  ;;what is the threshold?
  threshold
  
  ;;if we see this sequence of good widgets:
  (equal? (repeat 3 next-good-widget)
          '(0.6 0.7 0.8))))

(hist (repeat 20 sample))
~~~~

~~~~ {test_id="1"}
(define (sample)
 (rejection-query
  
  ;;this machine makes a widget -- which we'll just represent with a real number:
  (define (widget-maker)  (multinomial '(.2 .3 .4 .5 .6 .7 .8) '(.05 .1 .2 .3 .2 .1 .05)))
  
  ;;this machine tests widgets as they come out of the widget-maker, letting
  ;; through only those that pass threshold:
  (define (next-good-widget)
    (rejection-query
     (define widget (widget-maker))
     widget
     (> widget threshold)))
  
  ;;but we don't know what threshold the widget tester is set to:
  
  (define threshold  (multinomial '(.3 .4 .5 .6 .7) '(.1 .2 .4 .2 .1)))
  
  ;;what is the threshold?
  threshold
  
  ;;if we see this sequence of good widgets:
  (equal? (repeat 3 next-good-widget)
          '(0.6 0.7 0.8))))
  
(hist (repeat 20 sample))
~~~~

~~~~ {test_id="2"}
(define (choose-action goal? transition state)
  (query
   (define action (action-prior))
   action
   (goal? (transition state action))))
~~~~

~~~~ {test_id="3"}
(define (choose-action goal? transition state)
  (rejection-query
   (define action (action-prior))
   action
   (goal? (transition state action))))

(define (action-prior) (uniform-draw '(a b)))

(define (vending-machine state action)
  (case action
    (('a) 'bagel)
    (('b) 'cookie)
    (else 'nothing)))

(define (have-cookie? object) (equal? object 'cookie))

(define (sample)
 (choose-action have-cookie? vending-machine 'state))

(hist (repeat 100 sample))
~~~~

~~~~ {test_id="4"}
;;;fold: choose-action
(define (choose-action goal? transition state)
  (rejection-query
   (define action (action-prior))
   action
   (goal? (transition state action))))
;;;
(define (action-prior) (uniform-draw '(a b)))

(define (vending-machine state action)
  (case action
    (('a) (multinomial '(bagel cookie) '(0.9 0.1)))
    (('b) (multinomial '(bagel cookie) '(0.1 0.9)))
    (else 'nothing)))

(define (have-cookie? object) (equal? object 'cookie))

(define (sample)
 (choose-action have-cookie? vending-machine 'state))

(hist (repeat 100 sample))
~~~~

~~~~ {test_id="5"}
;;;fold: choose-action
(define (choose-action goal? transition state)
  (rejection-query
   (define action (action-prior))
   action
   (goal? (transition state action))))
;;;
(define (action-prior) (uniform-draw '(a b)))

(define (vending-machine state action)
  (case action
        (('a) (multinomial '(bagel cookie) '(0.9 0.1)))
        (('b) (multinomial '(bagel cookie) '(0.1 0.9)))
        (else 'nothing)))
(define (sample)
 (rejection-query
  (define goal-food (uniform-draw '(bagel cookie)))
  (define goal? (lambda (outcome) (equal? outcome goal-food)))
  
  goal-food
  
  (equal? (choose-action goal? vending-machine 'state) 'b)))

(hist (repeat 100 sample))
~~~~

~~~~ {test_id="6"}
;;;fold: choose-action
(define (choose-action goal? transition state)
  (rejection-query
   (define action (action-prior))
   action
   (goal? (transition state action))))
;;;
(define (action-prior) (uniform-draw '(a b)))

(define (vending-machine state action)
  (case action
        (('a) (multinomial '(bagel cookie) '(0.9 0.1)))
        (('b) (multinomial '(bagel cookie) '(0.5 0.5)))
        (else 'nothing)))

(define (sample)
  (rejection-query
   (define goal-food (uniform-draw '(bagel cookie)))
   (define goal? (lambda (outcome) (equal? outcome goal-food)))
   
   goal-food
   
   (equal? (choose-action goal? vending-machine 'state) 'b)))

(hist (repeat 100 sample)) 
~~~~

~~~~ {test_id="7"}
;;;fold: choose-action
(define (choose-action goal? transition state)
  (rejection-query
   (define action (action-prior))
   action
   (goal? (transition state action))))
;;;
(define (action-prior) (uniform-draw '(a b)))

(define (vending-machine state action)
  (case action
        (('a) (multinomial '(bagel cookie) '(0.9 0.1)))
        (('b) (multinomial '(bagel cookie) '(0.1 0.9)))
        (else 'nothing)))

(define (sample)
  (rejection-query
   (define food-preferences (uniform 0 1))
   (define (goal-food-prior) (if (flip food-preferences) 'bagel 'cookie))
   (define (make-goal food)
     (lambda (outcome) (equal? outcome food)))
   
   (goal-food-prior)
   
   (and (equal? (choose-action (make-goal (goal-food-prior)) vending-machine 'state) 'b)
        (equal? (choose-action (make-goal (goal-food-prior)) vending-machine 'state) 'b)
        (equal? (choose-action (make-goal (goal-food-prior)) vending-machine 'state) 'b))))

(hist (repeat 100 sample)) 
~~~~

~~~~ {test_id="8"}
;;;fold: choose-action
(define (choose-action goal? transition state)
  (rejection-query
   (define action (action-prior))
   action
   (goal? (transition state action))))
;;;
(define (action-prior) (uniform-draw '(a b)))

(define (vending-machine state action)
  (case action
        (('a) (multinomial '(bagel cookie) '(0.1 0.9)))
        (('b) (multinomial '(bagel cookie) '(0.1 0.9)))
        (else 'nothing)))

(define (sample)
  (rejection-query
   (define food-preferences (uniform 0 1))
   (define (goal-food-prior) (if (flip food-preferences) 'bagel 'cookie))
   (define (make-goal food)
     (lambda (outcome) (equal? outcome food)))
   
   (goal-food-prior)
   
   (and (equal? (choose-action (make-goal (goal-food-prior)) vending-machine 'state) 'b)
        (equal? (choose-action (make-goal (goal-food-prior)) vending-machine 'state) 'b)
        (equal? (choose-action (make-goal (goal-food-prior)) vending-machine 'state) 'b))))

(hist (repeat 100 sample)) 
~~~~

~~~~ {test_id="9"}
;;;fold: choose-action
(define (choose-action goal? transition state)
  (rejection-query
   (define action (action-prior))
   action
   (goal? (transition state action))))
;;;
(define (action-prior) (uniform-draw '(a b)))

(define (make-vending-machine a-effects b-effects)
  (lambda (state action)
    (case action
          (('a) (multinomial '(bagel cookie) a-effects))
          (('b) (multinomial '(bagel cookie) b-effects))
          (else 'nothing))))

(define (sample)
  (rejection-query
   
   (define a-effects (dirichlet '(1 1)))
   (define b-effects (dirichlet '(1 1)))
   (define vending-machine (make-vending-machine a-effects b-effects))
   
   (define goal-food (uniform-draw '(bagel cookie)))
   (define goal? (lambda (outcome) (equal? outcome goal-food)))
   
   (second b-effects)
   
   (and (equal? goal-food 'cookie)
        (equal? (choose-action goal? vending-machine 'state) 'b) )))

(define samples (repeat 500 sample))
(display (list "mean:" (mean samples)))
(hist samples "Probability that b gives cookie")
~~~~

~~~~ {test_id="10"}
;;;fold: choose-action
(define (choose-action goal? transition state)
  (rejection-query
   (define action (action-prior))
   action
   (goal? (transition state action))))
;;;
(define (action-prior) (if (flip 0.7) '(a) (pair 'a (action-prior))))

(define (sample)
  (rejection-query
   
   (define buttons->outcome-probs (mem (lambda (buttons) (dirichlet '(1 1)))))
   (define (vending-machine state action)
     (multinomial '(bagel cookie) (buttons->outcome-probs action)))
   
   (define goal-food (uniform-draw '(bagel cookie)))
   (define goal? (lambda (outcome) (equal? outcome goal-food)))
   
   (list (second (buttons->outcome-probs '(a a)))
         (second (buttons->outcome-probs '(a))))
   
   (and (equal? goal-food 'cookie)
        (equal? (choose-action goal? vending-machine 'state) '(a a)) )
   ))

(define samples (repeat 500 sample))
(hist (map first samples) "Probability that (a a) gives cookie")
(hist (map second samples) "Probability that (a) gives cookie")
~~~~

~~~~ {test_id="11"}
;;;fold: choose-action
(define (choose-action goal? transition state)
  (rejection-query
   (define action (action-prior))
   action
   (goal? (transition state action))))
;;;
(define (action-prior) (if (flip 0.7) '(a) (pair 'a (action-prior))))

(define (sample)
  (rejection-query
   
   (define buttons->outcome-probs (mem (lambda (buttons) (dirichlet '(1 1)))))
   (define (vending-machine state action)
     (multinomial '(bagel cookie) (buttons->outcome-probs action)))
   
   (define goal-food (uniform-draw '(bagel cookie)))
   (define goal? (lambda (outcome) (equal? outcome goal-food)))
   
   (list (second (buttons->outcome-probs '(a a)))
         (second (buttons->outcome-probs '(a)))
         goal-food)
   
   (and (equal? (vending-machine 'state '(a a)) 'cookie)
        (equal? (choose-action goal? vending-machine 'state) '(a a)) )
   ))

(define samples (repeat 500 sample))
(hist (map first samples) "Probability that (a a) gives cookie")
(hist (map second samples) "Probability that (a) gives cookie")
(hist (map third samples) "Goal probabilities")
~~~~

~~~~ {test_id="12"}
(define (teacher die)
  (query
   (define side (side-prior))
   side
   (equal? die (learner side))))
~~~~

~~~~ {test_id="13"}
(define (learner side)
  (query
   (define die (die-prior))
   die
   (equal? side (teacher die))))
~~~~

~~~~ {test_id="14"}
(define (teacher die depth)
  (query
   (define side (side-prior))
   side
   (equal? die (learner side depth))))

(define (learner side depth)
  (query
   (define die (die-prior))
   die
   (if (= depth 0)
       (equal? side (roll die))
       (equal? side (teacher die (- depth 1))))))
~~~~

~~~~ {test_id="15"}
(define (teacher die depth)
  (rejection-query
   (define side (side-prior))
   side
   (equal? die (learner side depth))))

(define (learner side depth)
  (rejection-query
   (define die (die-prior))
   die
   (if (= depth 0)
       (equal? side (roll die))
       (equal? side (teacher die (- depth 1))))))

(define (die->probs die)
  (case die
    (('A) '(0.0 0.2 0.8))
    (('B) '(0.1 0.3 0.6))
    (else 'uhoh)))

(define (side-prior) (uniform-draw '(red green blue)))
(define (die-prior) (if (flip) 'A 'B))
(define (roll die) (multinomial '(red green blue) (die->probs die)))

(define depth 0)
(learner 'green depth)
~~~~

~~~~ {test_id="16"}
(define (speaker state)
  (query
   (define words (sentence-prior))
   words
   (equal? state (listener words))))
~~~~

~~~~ {test_id="17"}
(define (listener words)
  (query
     (define state (state-prior))
     state
     (equal? words (speaker state))))
~~~~

~~~~ {test_id="18"}
(define (listener words)
  (query
     (define state (state-prior))
     state
     (if (flip literal-prob)
         (words state)
         (equal? words (speaker state)))))
~~~~

~~~~ {test_id="19"}
(define (state-prior) (uniform-draw '(0 1 2 3)))

(define (sentence-prior) (uniform-draw (list all-sprouted some-sprouted none-sprouted)))

(define (all-sprouted state) (= 3 state))
(define (some-sprouted state) (< 0 state))
(define (none-sprouted state) (= 0 state))

(define (speaker state depth)
  (rejection-query
   (define words (sentence-prior))
   words
   (equal? state (listener words depth))))

(define (listener words depth)
  (rejection-query
   (define state (state-prior))
   state
   (if (= depth 0)
       (words state)
       (equal? words (speaker state (- depth 1))))))

(define depth 1)

(hist (repeat 300 (lambda () (listener some-sprouted depth))))
~~~~

~~~~ {test_id="20"}
(define (choose-action goal? transition state)
  (rejection-query
    (define action (action-prior))
    action
    (goal? (transition state action))))

(define (action-prior) (uniform-draw '(a b)))

(define (vending-machine state action)
  (case action
    (('a) 'bagel)
    (('b) 'cookie)
    (else 'nothing)))

(define (have-cookie? object) (equal? object 'cookie))

(choose-action have-cookie? vending-machine 'state)
~~~~

~~~~ {test_id="21"}
;;;fold:
(define (iota count start step)
  (if (equal? count 0)
      '()
      (pair start (iota (- count 1) (+ start step) step))))

(define (sample-discrete weights) (multinomial (iota (length weights) 0 1) weights))
;;;

(define (match utility)
  (sample-discrete (normalize utility)))

(define (softmax utility b)
  (sample-discrete (normalize (map (lambda (x) (exp (* b x))) utility))))

(define (normalize lst)
  (let ((lst-sum (sum lst)))
    (map (lambda (x) (/ x lst-sum)) lst)))

(define utility-function '(1 2 3 4 5))
(define b 1)
(hist (repeat 1000 (lambda () (match utility-function))) "matching")
(hist (repeat 1000 (lambda () (softmax utility-function 1))) "softmax")
~~~~

~~~~ {test_id="22"}
;;;fold:
(define (last l)
    (cond ((null? (rest l)) (first l))
          (else (last (rest l)))))
;;;

; states have format (pair world-state agent-position)
(define (sample-action trans start-state goal? ending)
  (rejection-query
    (define first-action (action-prior))
    (define state-action-seq (rollout trans (pair start-state first-action) ending))
    state-action-seq
    (goal? state-action-seq)))

;; input and output are state-action pairs so we can run rollout
(define (transition state-action)
  (pair (forward-model state-action) (action-prior)))

;; modified version of unfold from paper, renamed rollout
(define (rollout next init end)
  (if (end init)
      (list init)
      (append (list init) (rollout next (next init) end))))


;; red-light green-light example

(define cheat-det .9)
(define (forward-model state-action)
  (pair
    (if (flip 0.5) 'red-light 'green-light)
    (let ((light (first (first state-action)))
          (position (rest (first state-action)))
          (action (rest state-action)))
      (if (eq? action 'go)
        (if (and (eq? light 'red-light)
                 (flip cheat-det))
          0
          (+ position 1))
        position))))

(define discount .95)
(define (ending? symbol) (flip (- 1 discount)))

(define goal-pos 5)
(define (goal-function state-action-seq)
  (> (rest (first (last state-action-seq))) goal-pos))

(define (action-prior) (if (flip 0.5) 'go 'stop))

;; testing
(sample-action transition (pair 'green-light 1) goal-function ending?)
~~~~

~~~~ {test_id="23"}
(define (choose-action goal? transition state deceive)
  (rejection-query
   (define action (action-prior))

    action

;;; add condition statement here
...
))


(define (action-prior) (uniform-draw '(a b c)))

(define (vending-machine state action)
  (case action
    (('a) (multinomial '(bagel cookie doughnut) '(0.8 0.1 0.1)))
    (('b) (multinomial '(bagel cookie doughnut) '(0.1 0.8 0.1)))
    (('c) (multinomial '(bagel cookie doughnut) '(0.1 0.1 0.8)))
    (else 'nothing)))

 (define (sample)
   (rejection-query
   (define deceive (flip .5))
   (define goal-food (uniform-draw '(bagel cookie doughnut)))
   (define goal? (lambda (outcome) (equal? outcome goal-food)))
   (define (sally-choice) (choose-action goal? vending-machine 'state deceive))

   goal-food

    ;;; add condition statement here
    ...
))

 (hist (repeat 100 sample) "Sally's goal")
~~~~

~~~~ {test_id="24"}
(define (remove lst bad-items)
  ;; remove bad items from a list
  (if (null? lst)
      lst
      (let ((kar (first lst)))
        (if (member kar bad-items)
            (remove (rest lst) bad-items)
            (pair kar (remove (rest lst) bad-items))
            ))))

(define doors (list 1 2 3))

;;;; monty-random
; (define (monty-random alice-door prize-door)
;   (enumeration-query
;    ..defines..
;    ..query..
;    ..condition..
;   ))

;;;; monty-avoid-both
; (define (monty-avoid-both alice-door prize-door)
;   (enumeration-query
;    ..defines..
;    ..query..
;    ..condition..
;    ))

;;;; monty-avoid-alice
; (define (monty-avoid-alice alice-door prize-door)
;   (enumeration-query
;    ..defines..
;    ..query..
;    ..condition..
;    ))

;;;; monty-avoid-prize
; (define (monty-avoid-prize alice-door prize-door)
;   (enumeration-query
;    ..defines..
;    ..query..
;    ..condition..
;    ))

(enumeration-query
 (define alice-door ...)
 (define prize-door ...)

 ;; we'll be testing multiple possible montys
 ;; let's use "monty-function" as an alias for whichever one we're testing
 (define monty-function monty-random)

 (define monty-door
   ;; get the result of whichever enumeration-query we're asking about
   ;; this will be a list of the form ((x1 x2 ... xn) (p1 p2 ... pn))
   ;; we then (apply multinomial ) on this list to sample from that distribution
   (apply multinomial (monty-function alice-door prize-door)))

 ;; query
 ;; what information could tell us whether we should switch?
 ...

 ;; condition
 ;; look at the problem description - what evidence do we have?
 ...
)
~~~~
