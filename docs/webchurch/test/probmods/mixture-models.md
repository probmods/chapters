~~~~ {.mit-church test_id="0"}
(define colors '(blue green red))

(define samples
 (mh-query
   200 100

   (define phi (dirichlet '(1 1 1)))
   (define alpha 0.1)
   (define prototype (map (lambda (w) (* alpha w)) phi))

   (define bag->prototype (mem (lambda (bag) (dirichlet prototype))))

   ;;each observation (which is named for convenience) comes from one of three bags:
   (define obs->bag
     (mem (lambda (obs-name)
            (uniform-draw '(bag1 bag2 bag3)))))

   (define draw-marble
     (mem (lambda (obs-name)
            (multinomial colors (bag->prototype (obs->bag obs-name))))))

   ;;did obs1 and obs2 come from the same bag? obs1 and obs3?
   (list (equal? (obs->bag 'obs1) (obs->bag 'obs2))
         (equal? (obs->bag 'obs1) (obs->bag 'obs3)))

   (and
    (equal? 'red (draw-marble 'obs1))
    (equal? 'red (draw-marble 'obs2))
    (equal? 'blue (draw-marble 'obs3))
    (equal? 'blue (draw-marble 'obs4))
    (equal? 'red (draw-marble 'obs5))
    (equal? 'blue (draw-marble 'obs6))
    )))

(hist (map first samples) "obs1 and obs2 same category?")
(hist (map second samples) "obs1 and obs3 same category?")
'done
~~~~

~~~~ {.mit-church test_id="1"}
(define colors '(blue green red))

(define samples
 (mh-query
   200 100

   (define phi (dirichlet '(1 1 1)))
   (define alpha 0.1)
   (define prototype (map (lambda (w) (* alpha w)) phi))

   (define bag->prototype (mem (lambda (bag) (dirichlet prototype))))

   ;;the probability that an observation will come from each bag:
   (define bag-mixture (dirichlet '(1 1 1)))

   ;;each observation (which is named for convenience) comes from one of three bags:
   (define obs->bag
     (mem (lambda (obs-name)
            (multinomial '(bag1 bag2 bag3) bag-mixture))))

   (define draw-marble
     (mem (lambda (obs-name)
            (multinomial colors (bag->prototype (obs->bag obs-name))))))

   ;;did obs1 and obs2 come from the same bag? obs1 and obs3?
   (list (equal? (obs->bag 'obs1) (obs->bag 'obs2))
         (equal? (obs->bag 'obs1) (obs->bag 'obs3)))

   (and
    (equal? 'red (draw-marble 'obs1))
    (equal? 'red (draw-marble 'obs2))
    (equal? 'blue (draw-marble 'obs3))
    (equal? 'blue (draw-marble 'obs4))
    (equal? 'red (draw-marble 'obs5))
    (equal? 'blue (draw-marble 'obs6))
    )))

(hist (map first samples) "obs1 and obs2 same category?")
(hist (map second samples) "obs1 and obs3 same category?")
'done
~~~~

~~~~ {.mit-church test_id="2"}
(define (noisy=? x y) (and (flip (expt 0.1 (abs (- (first x) (first y)))))
                           (flip (expt 0.1 (abs (- (rest x) (rest y)))))))
(define samples
 (mh-query
   200 100

   (define bag-mixture (dirichlet '(1 1 1)))

   (define obs->cat
     (mem (lambda (obs-name)
            (multinomial '(bag1 bag2 bag3) bag-mixture))))

   (define cat->mean (mem (lambda (cat) (list (gaussian 0.0 1.0) (gaussian 0.0 1.0)))))

   (define observe
     (mem (lambda (obs-name)
            (pair (gaussian (first (cat->mean (obs->cat obs-name))) 0.01)
                  (gaussian (second (cat->mean (obs->cat obs-name))) 0.01)))))

   ;;sample a new observations and its category
   (list (obs->cat 't) (observe 't))

   (no-proposals
   (and
    (noisy=? '(0.5 . 0.5) (observe 'a1))
    (noisy=? '(0.6 . 0.5) (observe 'a2))
    (noisy=? '(0.5 . 0.4) (observe 'a3))
    (noisy=? '(0.55 . 0.55) (observe 'a4))
    (noisy=? '(0.45 . 0.45) (observe 'a5))
    (noisy=? '(0.5 . 0.5) (observe 'a6))
    (noisy=? '(0.7 . 0.6) (observe 'a7))


    (noisy=? '(-0.5 . -0.5) (observe 'b1))
    (noisy=? '(-0.7 . -0.4) (observe 'b2))
    (noisy=? '(-0.5 . -0.6) (observe 'b3))
    (noisy=? '(-0.55 . -0.55) (observe 'b4))
    (noisy=? '(-0.5 . -0.45) (observe 'b5))
    (noisy=? '(-0.6 . -0.5) (observe 'b6))
    (noisy=? '(-0.6 . -0.4) (observe 'b7))
    ))))

(scatter (map second samples) "predictive")
'done
~~~~

~~~~ {.mit-church test_id="3"}
(define vocabulary (append '(DNA evolution)'(parsing phonology)))

(define topics '(topic1 topic2)) (define doc-length 10)

(define samples
  (mh-query
   200 100

   (define document->length (mem (lambda (doc-id) doc-length)))
   (define document->mixture-params (mem (lambda (doc-id) (dirichlet (make-list (length topics) 1.0)))))
   (define topic->mixture-params (mem (lambda (topic) (dirichlet (make-list (length  vocabulary) 0.1)))))


   (define document->topics (mem (lambda (doc-id)
                                   (repeat  (document->length doc-id)
                                            (lambda () (multinomial topics (document->mixture-params doc-id)))))))

   (define document->words (mem (lambda (doc-id) (map (lambda (topic)
                                                        (multinomial vocabulary (topic->mixture-params topic)))
                                                      (document->topics doc-id)))))

   ;;get the distributions over words for the two topics
   (pair (topic->mixture-params 'topic1) (topic->mixture-params 'topic2))

   (no-proposals
    (and
     (equal? (document->words 'doc1)  '(DNA evolution DNA evolution DNA evolution DNA evolution DNA evolution))
     (equal? (document->words 'doc2)  '(parsing phonology parsing phonology parsing phonology parsing phonology parsing phonology))
     (equal? (document->words 'doc4)  '(DNA evolution DNA evolution DNA evolution DNA evolution DNA evolution))
     (equal? (document->words 'doc5)  '(parsing phonology parsing phonology parsing phonology parsing phonology parsing phonology))
     (equal? (document->words 'doc7)  '(DNA evolution DNA evolution DNA evolution DNA evolution DNA evolution))
     (equal? (document->words 'doc8)  '(parsing phonology parsing phonology parsing phonology parsing phonology parsing phonology))
     (equal? (document->words 'doc9)  '(DNA evolution DNA evolution DNA evolution DNA evolution DNA evolution))
     (equal? (document->words 'doc10)  '(parsing phonology parsing phonology parsing phonology parsing phonology parsing phonology))
     ))))

(barplot (map (lambda (a b) (pair a b)) vocabulary (first (last samples))) "Distribution over words for Topic 1")
(barplot (map (lambda (a b) (pair a b)) vocabulary (rest (last samples))) "Distribution over words for Topic 2")
~~~~

~~~~ {.mit-church test_id="4"}
(define (noisy= target value variance)
  (= 0 (gaussian (- target value) variance)))

(define (count-by start end increment)
  (if (> start end)
      '()
      (pair start (count-by (+ start increment) end increment))))

(define (expectation l)
  (/ (apply + l) (length l)))

(define prototype-1 8.0)
(define prototype-2 10.0)

(define (compute-pair-distance stimulus-1 stimulus-2)
  (expectation
   (mh-query
    2000 10

    (define (vowel-1) (gaussian prototype-1 0.5))
    (define (vowel-2) (gaussian prototype-2 0.5))

    (define (noise-process target)
      (gaussian target 0.2))

    (define (sample-target)
      (if (flip)
          (vowel-1)
          (vowel-2)))

    (define target-1 (sample-target))
    (define target-2 (sample-target))

    (define obs-1 (noise-process target-1))
    (define obs-2 (noise-process target-2))

    (abs (- target-1 target-2))

    (and (noisy= stimulus-1 obs-1  0.001) (noisy= stimulus-2 obs-2  0.001))
    )))

(define (compute-perceptual-pairs list)
  (if (< (length list) 2)
      '()
      (pair (compute-pair-distance (first list) (second list)) (compute-perceptual-pairs (rest list)))))

(define (compute-stimuli-pairs list)
  (if (< (length list) 2)
      '()
      (pair (abs (- (first list) (second list))) (compute-stimuli-pairs (rest list)))))

(define stimuli (count-by prototype-1 prototype-2 0.1))

(define stimulus-distances (compute-stimuli-pairs stimuli))
(define perceptual-distances (compute-perceptual-pairs stimuli))

(barplot (map (lambda (a b) (pair a b)) (iota (- (length stimuli) 1)) stimulus-distances) "Acoustic Distances")
(barplot (map (lambda (a b) (pair a b)) (iota (- (length stimuli) 1)) perceptual-distances) "Perceptual Distances")
~~~~

~~~~ {.mit-church test_id="5"}
(define actual-obs (list true true true true false false false false))

(define samples
 (mh-query
   200 100

   (define coins (if (flip) '(c1) '(c1 c2)))

   (define coin->weight (mem (lambda (c) (uniform 0 1))))

   (define (observe) (flip (coin->weight (uniform-draw coins))))

   (length coins)

   (equal? actual-obs (repeat (length actual-obs) observe))))

(hist samples "number of coins")
'done
~~~~

~~~~ {.mit-church test_id="6"}
(define colors '(blue green red))

(define samples
 (mh-query
   200 100

   (define phi (dirichlet '(1 1 1)))
   (define alpha 0.1)
   (define prototype (map (lambda (w) (* alpha w)) phi))

   (define bag->prototype (mem (lambda (bag) (dirichlet prototype))))

   ;;unknown number of categories (created with placeholder names):
   (define num-bags (+ 1 (poisson 1.0)))
   (define bags (repeat num-bags gensym))

   ;;each observation (which is named for convenience) comes from one of the bags:
   (define obs->bag
     (mem (lambda (obs-name)
            (uniform-draw bags))))

   (define draw-marble
     (mem (lambda (obs-name)
            (multinomial colors (bag->prototype (obs->bag obs-name))))))

   ;;how many bags are there?
   num-bags

   (and
    (equal? 'red (draw-marble 'obs1))
    (equal? 'red (draw-marble 'obs2))
    (equal? 'blue (draw-marble 'obs3))
    (equal? 'blue (draw-marble 'obs4))
    (equal? 'red (draw-marble 'obs5))
    (equal? 'blue (draw-marble 'obs6))
    )))

(hist samples "how many bags?")
'done
~~~~

~~~~ {test_id="7"}
(list (gensym) (gensym) (gensym))
~~~~

~~~~ {.mit-church test_id="8"}
(equal? (gensym) (gensym))
~~~~
