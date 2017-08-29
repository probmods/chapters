~~~~ {test_id="0"}
(define colors '(black blue green orange red))

(define bag->prototype
  (mem (lambda (bag) (dirichlet '(1 1 1 1 1)))))

(define (draw-marbles bag num-draws)
  (repeat num-draws
          (lambda () (multinomial colors (bag->prototype bag)))))

(hist (draw-marbles 'bag 50) "first sample")
(hist (draw-marbles 'bag 50) "second sample")
(hist (draw-marbles 'bag 50) "third sample")
(hist (draw-marbles 'bag 50) "fourth sample")
'done
~~~~

~~~~ {.mit-church test_id="1"}
(define colors '(black blue green orange red))

(define samples
 (mh-query
   200 100

  (define bag->prototype
    (mem (lambda (bag) (dirichlet '(1 1 1 1 1)))))

  (define (draw-marbles bag num-draws)
    (repeat num-draws
            (lambda () (multinomial colors (bag->prototype bag)))))

  ;;predict the next sample from each observed bag, and a new one:
  (list (draw-marbles 'bag-1 1)
        (draw-marbles 'bag-2 1)
        (draw-marbles 'bag-3 1)
        (draw-marbles 'bag-n 1))

  ;;condition on observations from three bags:
  (and
   (equal? (draw-marbles 'bag-1 6) '(blue blue black blue blue blue))
   (equal? (draw-marbles 'bag-2 6) '(blue green blue blue blue red))
   (equal? (draw-marbles 'bag-3 6) '(blue blue blue blue blue orange))
   )))

(hist (map first samples) "bag one posterior predictive")
(hist (map second samples) "bag two posterior predictive")
(hist (map third samples) "bag three posterior predictive")
(hist (map fourth samples) "bag n posterior predictive")
'done
~~~~

~~~~ {.mit-church test_id="2"}
(define colors '(black blue green orange red))

(define samples
 (mh-query
   200 100

   ;;we make a global prototype which is a dirichlet sample scaled to total 5.
   (define prototype (map (lambda (x) (* 5 x)) (dirichlet '(1 1 1 1 1))))

   ;;the prototype for each bag uses the global prototype as parameters.
   (define bag->prototype
     (mem (lambda (bag) (dirichlet prototype))))

   (define (draw-marbles bag num-draws)
     (repeat num-draws
             (lambda () (multinomial colors (bag->prototype bag)))))

   (list (draw-marbles 'bag-1 1)
         (draw-marbles 'bag-2 1)
         (draw-marbles 'bag-3 1)
         (draw-marbles 'bag-n 1))

   (and
    (equal? (draw-marbles 'bag-1 6) '(blue blue black blue blue blue))
    (equal? (draw-marbles 'bag-2 6) '(blue green blue blue blue red))
    (equal? (draw-marbles 'bag-3 6) '(blue blue blue blue blue orange))
    )))

(hist (map first samples) "bag one posterior predictive")
(hist (map second samples) "bag two posterior predictive")
(hist (map third samples) "bag three posterior predictive")
(hist (map fourth samples) "bag n posterior predictive")
'done
~~~~

~~~~ {.mit-church test_id="3"}
(define colors '(red blue))

(define (sample-bags obs-draws)
 (mh-query
   300 100

   ;;we make a global prototype which is a dirichlet sample scaled to total 2:
   (define phi (dirichlet '(1 1)))
   (define global-prototype (map (lambda (x) (* 2 x)) phi))

   ;;the prototype for each bag uses the global prototype as parameters.
   (define bag->prototype
     (mem (lambda (bag) (dirichlet global-prototype))))

   (define (draw-marbles bag num-draws)
     (repeat num-draws
             (lambda () (multinomial colors (bag->prototype bag)))))

   ;;query the inferred bag1 and global prototype:
   (list (first (bag->prototype (first (first obs-draws))))
         (first phi))

   ;;condition on getting the right observations from each bag.
   ;;obs-draws is a list of lists of draws from each bag (first is bag name).
   (all (map (lambda (bag) (equal? (rest bag)
                                   (draw-marbles (first bag) (length (rest bag)))))
             obs-draws))))


;;;;;;;;;end of the model, below is code to make plots of learning speed for this model.

;;compute the mean squared deviation of samples from truth:
(define (mean-dev true samples)
  (mean (map (lambda (s) (expt (- true s) 2)) samples)))

;;now we generate learning curves! we take a single sample from each bag.
;;plot the mean-squared error normalized by the no-observations error.

(define samples (sample-bags '((bag1))))
(define initial-specific (mean-dev 0.66 (map first samples)))
(define initial-global (mean-dev 0.66 (map second samples)))
(lineplot-value (pair 0 1) "specific learning")
(lineplot-value (pair 0 1) "general learning")

(define samples (sample-bags '((bag1 red))))
(lineplot-value (pair 1 (/ (mean-dev 0.66 (map first samples)) initial-specific))
                "specific learning")
(lineplot-value (pair 1 (/ (mean-dev 0.66 (map second samples)) initial-global))
                "general learning")

(define samples (sample-bags '((bag1 red) (bag2 red) (bag3 blue))))
(lineplot-value (pair 3 (/ (mean-dev 0.66 (map first samples)) initial-specific))
                "specific learning")
(lineplot-value (pair 3 (/ (mean-dev 0.66 (map second samples)) initial-global))
                "general learning")

(define samples (sample-bags '((bag1 red) (bag2 red) (bag3 blue) (bag4 red) (bag5 red) (bag6 blue))))
(lineplot-value (pair 6 (/ (mean-dev 0.66 (map first samples)) initial-specific))
                "specific learning")
(lineplot-value (pair 6 (/ (mean-dev 0.66 (map second samples)) initial-global))
                "general learning")

(define samples (sample-bags '((bag1 red) (bag2 red) (bag3 blue) (bag4 red) (bag5 red) (bag6 blue) (bag7 red) (bag8 red) (bag9 blue))))
(lineplot-value (pair 9 (/ (mean-dev 0.66 (map first samples)) initial-specific))
                "specific learning")
(lineplot-value (pair 9 ((/ (mean-dev 0.66 (map second samples)) initial-global))
                "general learning")

(define samples (sample-bags '((bag1 red) (bag2 red) (bag3 blue) (bag4 red) (bag5 red) (bag6 blue) (bag7 red) (bag8 red) (bag9 blue) (bag10 red) (bag11 red) (bag12 blue))))
(lineplot-value (pair 12 (/ (mean-dev 0.66 (map first samples)) initial-specific))
                      "specific learning")
(lineplot-value (pair 12 (/ (mean-dev 0.66 (map second samples)) initial-global))
                "general learning")

'done
~~~~

~~~~ {.mit-church test_id="4"}
(define colors '(black blue green orange red))

(define samples
 (mh-query
   200 100

   ;;the global prototype mixture:
   (define phi (dirichlet '(1 1 1 1 1)))

   ;;regularity parameters: how strongly we expect the global prototype to project (ie. determine the local prototypes):
   (define alpha (gamma 2 2))

   ;;put them together into the global parameters:
   (define prototype (map (lambda (w) (* alpha w)) phi))

   (define bag->prototype
     (mem (lambda (bag) (dirichlet prototype))))

   (define (draw-marbles bag num-draws)
     (repeat num-draws
             (lambda () (multinomial colors (bag->prototype bag)))))

   (list (draw-marbles 'bag-1 1)
         (draw-marbles 'bag-2 1)
         (draw-marbles 'bag-3 1)
         (draw-marbles 'bag-4 1)
         (draw-marbles 'bag-n 1)
         (log alpha))

   (and
    (equal? (draw-marbles 'bag-1 6) '(blue blue blue blue blue blue))
    (equal? (draw-marbles 'bag-2 6) '(green green green green green green))
    (equal? (draw-marbles 'bag-3 6) '(red red red red red red))
    (equal? (draw-marbles 'bag-4 1) '(orange))
    )))

(hist (map first samples) "bag one posterior predictive")
(hist (map second samples) "bag two posterior predictive")
(hist (map third samples) "bag three posterior predictive")
(hist (map fourth samples) "bag four posterior predictive")
(hist (map fifth samples) "bag n posterior predictive")
(hist (map sixth samples) 10 "consistency across bags (log alpha)")
'done
~~~~

~~~~ {.mit-church test_id="5"}
(define shapes (iota 11))
(define colors (iota 11))
(define textures (iota 11))
(define sizes (iota 11))
(define samples
 (mh-query
   50 100
   ;;Rather than defining variables for each dimension, we could make more use of abstraction.
   (define phi-shapes (dirichlet (make-list (length shapes) 1)))
   (define phi-colors (dirichlet (make-list (length colors) 1)))
   (define phi-textures (dirichlet (make-list (length textures) 1)))
   (define phi-sizes (dirichlet (make-list (length sizes) 1)))

   ;;regularity parameters: how strongly we expect the global prototype to project (ie. determine the local prototypes):
   (define alpha-shapes (exponential 1))
   (define alpha-colors (exponential 1))
   (define alpha-textures (exponential 1))
   (define alpha-sizes (exponential 1))
   ;;put them together into the global parameters:
   (define prototype-shapes (map (lambda (w) (* alpha-shapes w)) phi-shapes))
   (define prototype-colors (map (lambda (w) (* alpha-colors w)) phi-colors))
   (define prototype-textures (map (lambda (w) (* alpha-textures w)) phi-textures))
   (define prototype-sizes (map (lambda (w) (* alpha-sizes w)) phi-sizes))

   (define category->prototype
     (mem (lambda (bag) (list (dirichlet prototype-shapes) (dirichlet prototype-colors) (dirichlet prototype-textures) (dirichlet prototype-sizes)))))

   (define (draw-object category num-draws)
     (repeat num-draws
             (lambda () (map (lambda (dim proto) (multinomial dim proto)) (list shapes colors textures sizes) (category->prototype category)))))

   (draw-object 'cat-5 1)

   (and
    (equal? (draw-object 'cat-1 2) '((1 1 1 1) (1 2 2 2)))
    (equal? (draw-object 'cat-2 2) '((2 3 3 1) (2 4 4 2)))
    (equal? (draw-object 'cat-3 2) '((3 5 5 1) (3 6 6 2)))
    (equal? (draw-object 'cat-4 2) '((4 7 7 1) (4 8 8 2)))
    (equal? (draw-object 'cat-5 1) '((5 9 9 1)))
    )))
(pretty-print samples)
~~~~

~~~~ {.mit-church test_id="6"}
 (define results
    (mh-query
    50 1000

    (define overall-variance (gamma 1 1))
    (define overall-shape (gamma 2 2))
    (define overall-scale (gamma 2 2))

    (define group->variance
      (mem (lambda (group) (gamma overall-shape overall-scale))))

    (define group->mean
      (mem (lambda (group) (gaussian 1 overall-variance))))

    (define (draw-observations group num-draws)
      (repeat num-draws
              (lambda () (gaussian (group->mean group) (group->variance group)))))

    (group->variance 'new)

    (and (equal? (draw-observations 'one 3) '(1.001 1.001 1.001))
         (equal? (draw-observations 'two 3) '(1.05 1.05 1.05))
         (equal? (draw-observations 'three 3) '(1.1 1.1 1.1))
         (equal? (draw-observations 'four 1) '(1.003))))

)
(define (mean mylist)
  (/ (apply + mylist) (length mylist)))

(define new-var (mean results))
new-var
~~~~

~~~~ {.mit-church test_id="7"}
(define data '((D N)))

;;the "grammar": a set of phrase categories, and an associating of the complement to each head category:
(define categories '(D N T V A Adv))

(define (head->comp head)
  (case head
    (('D) 'N)
    (('T) 'V)
    (('N) 'A)
    (('V) 'Adv)
    (('A) 'none)
    (('Adv) 'none)
    (else 'error)))


(define samples
   (mh-query
    100 100

    (define language-direction (beta 1 1))

    (define head->phrase-direction
       (mem (lambda (head) (first (dirichlet language-direction)))))

    (define (generate-phrase head)
      (if (equal? (head->comp head) 'none)
          (list head)
          (if (flip (head->phrase-direction head)) ;;on which side will the head go?
              (list (head->comp head) head)        ;;left, or
              (list head (head->comp head)))))     ;;right?

    (define (observe-phrase) (generate-phrase (uniform-draw categories)))

    (generate-phrase 'N)

    (equal? data (repeat (length data) observe-phrase))))

(hist samples "N-phrase headedness")
'done
~~~~
