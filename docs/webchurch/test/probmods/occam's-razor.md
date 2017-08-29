~~~~ {test_id="0"}
(define samples
   (mh-query
    100 100

    (define (hypothesis->set  hyp)
      (if (equal? hyp  'Big) '(a b c d e f) '(a b c)))

    (define hypothesis (if (flip) 'Big 'Small))
    (define (observe N)
      (repeat N (lambda () (uniform-draw (hypothesis->set hypothesis)))))

    hypothesis

    (equal? (observe 1) '(a))
    )
   )
 (hist samples "Size Principle")
~~~~

~~~~ {test_id="1"}
(define (samples data)
   (mh-query
    100 10

    (define (hypothesis->set  hyp)
      (if (equal? hyp  'Big) '(a b c d e f) '(a b c)))

    (define hypothesis (if (flip) 'Big 'Small))
    (define (observe N)
      (repeat N (lambda () (uniform-draw (hypothesis->set hypothesis)))))

    hypothesis

    (equal? (observe (length data)) data)
    )
   )

(define (big-freq data) (mean (map (lambda (hyp) (if (equal? hyp 'Big) 1.0 0.0)) (samples data))))

(lineplot
 (list
  (pair 1 (big-freq '(a)))
  (pair 3 (big-freq '(a b a)))
  (pair 5 (big-freq '(a b a b b)))
  (pair 7 (big-freq '(a b a b b a b))))
 "P(Big | observations)"
 )
~~~~

~~~~ {.mit-church test_id="2"}
;;observed points:
(define obs-data '((0.4 0.7) (0.5 0.4) (0.46 0.63) (0.43 0.51)))

;;parameters and helper functions:
(define noise 0.001)
(define num-examples (length obs-data))

;;infer the rectangle given the observed points:
(define samples
  (drop
   (mh-query
    300 100

    ;;sample the rectangle
    (define x1 (uniform 0 1))
    (define x2 (uniform 0 1))
    (define y1 (uniform 0 1))
    (define y2 (uniform 0 1))

    ;;the concept is uniform over this rectangle
    (define concept
      (lambda () (list (uniform x1 x2) ;;x-val uniform in rect
                       (uniform y1 y2) ;;y-val uniform in rect
                       )))

    (list x1 x2 y1 y2)

    (equal? obs-data (repeat num-examples concept)))

  100))

;;set up fancy graphing:
(define (adjust points)
  (map (lambda (p) (+ (* p 350) 25))
       points))
(define paper (make-raphael "my-paper" 400 400))
(define (draw-rect rect color alpha linewidth)
  (let* ((rect (adjust rect))
         (x-lower (min (first rect) (second rect)))
         (y-lower (min (third rect) (fourth rect)))
         (width (abs (- (second rect) (first rect))))
         (height (abs (- (fourth rect) (third rect)))))
    (raphael-js paper
      "rect = r.rect(" x-lower ", " y-lower ", " width ", " height
      "); rect.attr('stroke', " color
      "); rect.attr('stroke-width', " linewidth
      "); rect.attr('stroke-opacity', " alpha ")")))

;;graph the observed points:
(raphael-points paper
                (adjust (map first obs-data))
                (adjust (map second obs-data)))

;;graph the sampled rectangles:
(map (lambda (rect) (draw-rect rect "'aaa'" 0.1 0.5)) samples)

;;graph the mean rectangle:
(define mean-bounds (map mean (list (map first samples) (map second samples) (map third samples) (map fourth samples))))
(draw-rect mean-bounds "'#1f3'" 1 3)

(draw-rect (list 0 1 0 1) "'#000'" 1 2)

'done
~~~~

~~~~ {.norun test_id="3"}
(define obs-data '((0.2 0.6) (0.2 0.8) (0.4 0.8) (0.4 0.6) (0.3 0.7)))
(define obs-data '((0.4 0.7) (0.5 0.4) (0.45 0.5) (0.43 0.7) (0.47 0.6)))
(define obs-data '((0.4 0.7) (0.5 0.4)))
(define obs-data '((0.4 0.7) (0.5 0.4) (0.46 0.63) (0.43 0.51) (0.42 0.45) (0.48 0.66)))
~~~~

~~~~ {.mit-church test_id="4"}
;;observed points (now points and in/out labels):
(define obs-data '((0.4 0.7 #t) (0.5 0.4 #t) (0.46 0.63 #t) (0.43 0.51 #t)))

;;parameters and helper functions:
(define num-examples (length obs-data))

;;infer the rectangle given the observed points:
(define samples
  (drop
   (mh-query
    300 100

    ;;sample the rectangle
    (define x1 (uniform 0 1))
    (define x2 (uniform 0 1))
    (define y1 (uniform 0 1))
    (define y2 (uniform 0 1))

    ;;the concept is now a rule for classifying points as in or out of this rectangle
    ;;we return both the point and the label
    (define (concept p)
      (list (first p)
            (second p)
            (and (< (first p) x2)
                 (> (first p) x1)
                 (< (second p) y2)
                 (> (second p) y1))))

    ;;an observation comes from using the concept to classify a random point
    (define (observe) (concept (list (uniform 0 1) (uniform 0 1))))

    (list x1 x2 y1 y2)

    (equal? obs-data (repeat num-examples observe)))

  100))

;;set up fancy graphing:
(define (adjust points)
  (map (lambda (p) (+ (* p 350) 25))
       points))
(define paper (make-raphael "my-paper" 400 400))
(define (draw-rect rect color alpha linewidth)
  (let* ((rect (adjust rect))
         (x-lower (min (first rect) (second rect)))
         (y-lower (min (third rect) (fourth rect)))
         (width (abs (- (second rect) (first rect))))
         (height (abs (- (fourth rect) (third rect)))))
    (raphael-js paper
      "rect = r.rect(" x-lower ", " y-lower ", " width ", " height
      "); rect.attr('stroke', " color
      "); rect.attr('stroke-width', " linewidth
      "); rect.attr('stroke-opacity', " alpha ")")))

;;graph the observed points:
(raphael-points paper
                (adjust (map first obs-data))
                (adjust (map second obs-data)))

;;graph the sampled rectangles:
(map (lambda (rect) (draw-rect rect "'aaa'" 0.1 0.5)) samples)

;;graph the mean rectangle:
(define mean-bounds (map mean (list (map first samples) (map second samples) (map third samples) (map fourth samples))))
(draw-rect mean-bounds "'#1f3'" 1 3)

(draw-rect (list 0 1 0 1) "'#000'" 1 2)

'done
~~~~

~~~~ {.mit-church test_id="5"}
(define observed-letters '(a b a b c d b b))

(define samples
   (mh-query
    100 100

    (define (hypothesis->parameters  hyp)
      (if (equal? hyp  'A)
          (list '(a b c d) '(0.375 0.375 0.125 0.125))
          (list '(a b c d) '(0.25 0.25 0.25 0.25))))

    (define hypothesis  (if (flip) 'A 'B))

    (define (observe) (apply multinomial (hypothesis->parameters hypothesis)))

    hypothesis

    (equal? observed-letters (repeat (length observed-letters) observe))
    )
   )

(hist samples "Bayes-Occam-Razor")
~~~~

~~~~ {.mit-church test_id="6"}
(define observed-letters '(a b a c d))

(define samples
   (mh-query
    100 100

    (define (hypothesis->parameters  hyp)
       (if (equal? hyp  'A)
           (list '(a b c d) '(0.375 0.375 0.125 0.125))
           (list '(a b c d) '(0.125 0.125 0.375 0.375))))

    (define hypothesis  (if (flip) 'A 'B))

    (define (observe) (apply multinomial (hypothesis->parameters hypothesis)))

    hypothesis

    (equal? observed-letters (repeat (length observed-letters) observe))
    )
   )

(hist samples "Bayes-Occam-Razor")
~~~~

~~~~ {.mit-church test_id="7"}
(define observed-data '(h h t h t h h h t h))
(define num-flips (length observed-data))
(define num-samples 1000)
(define fair-prior 0.999)
(define pseudo-counts '(1 1))

(define prior-samples
   (repeat num-samples
     (lambda () (if (flip fair-prior)
                     0.5
                    (first (beta (first pseudo-counts) (second pseudo-counts)))))))

(define samples
   (mh-query
     num-samples 10

     (define fair-coin? (flip fair-prior))
     (define coin-weight (if fair-coin?
                             0.5
                             (first (beta (first pseudo-counts) (second pseudo-counts)))))

     (define make-coin (lambda (weight) (lambda () (if (flip weight) 'h 't))))
     (define coin (make-coin coin-weight))

     (list (if fair-coin? 'fair 'unfair) coin-weight)

     (equal? observed-data (repeat num-flips coin))
   )
)

(hist (map first samples) "Fair coin?")
(hist (append '(0) '(1) prior-samples) 10 "Coin weight, prior to observing data")
(hist (append '(0) '(1) (map second samples)) 10 "Coin weight, conditioned on observed data")
~~~~

~~~~ {.norun test_id="8"}
(h h t h t h h h t h) ;; fair coin, probability of H = 0.5
(h h h h h h h h h h) ;; ?? suspicious coincidence, probability of H = 0.5 ..?
(h h h h h h h h h h h h h h h) ;; probably unfair coin, probability of H near 1 
(h h h h h h h h h h h h h h h h h h h h) ;; definitely unfair coin, probability of H near 1
(h h h h h h t h t h h h h h t h h t h h h h h t h t h h h h h t h h h h h h h h h t h h h h t h h  h h h h h) ;; unfair coin, probability of H = 0.85
~~~~

~~~~ {.mit-church test_id="9"}
(define make-coin (lambda (weight) (lambda () (if (flip weight) 'h 't))))

(define fair-prior 0.999)
(define pseudo-counts '(1 1))

(define (samples data)
  (mh-query 400 10

     (define fair-coin? (flip fair-prior))
     (define coin-weight (if fair-coin?
                             0.5
                             (first (beta (first pseudo-counts) (second pseudo-counts)))))

     (define coin (make-coin coin-weight))

     coin-weight

     (equal? data (repeat (length data) coin))
   )
)

(define true-coin (make-coin 0.9))
(define full-data-set (repeat 100 true-coin))
(define observed-data-sizes '(1 3 6 10 20 30 50 70 100))
(define (estimate N) (mean (samples (take full-data-set N))))
(map (lambda (N)
       (lineplot-value (pair N (estimate N)) "Learning trajectory"))
     observed-data-sizes)
~~~~

~~~~ {test_id="10"}
(define make-coin (lambda (weight) (lambda () (if (flip weight) 'h 't))))

(define observed-data '(h))
(define fair-prior 0.5)

(define samples
   (mh-query
     1000 10

     (define unfair-coin-weight (beta 1 10))

     (define fair-coin? (flip fair-prior))
     (define coin-weight (if fair-coin?
                             0.5
                             unfair-coin-weight
                             ))

     (define coin (make-coin coin-weight))

     (list (if fair-coin? 'fair 'unfair) coin-weight)

     (equal? observed-data (repeat (length observed-data) coin))
   )
)

(hist (map first samples) "Fair coin?")
~~~~

~~~~ {.mit-church test_id="11"}
;;first a helper function that makes a polynomial function, given the coefficients:
(define (make-poly c)
  (lambda (x) (apply + (map (lambda (a b) (* a (expt x b))) c (iota (length c))))))

;;now set up the observed data:
(define x-vals (range -5 5))
(define obs-y-vals '(-0.199 -0.208 -0.673 -0.431 -0.360 -0.478 -0.984 0.516 1.138 2.439 3.501))

;;y-vals generated from:
;(define true-y-vals (map (make-poly '(-.5 0.3 .1)) x-vals))
;(define obs-y-vals (map (lambda (x) (gaussian x 0.4)) true-y-vals))

(define (noisy-equals? x y)
  (log-flip (* -1000 (expt (- x y) 2))))

;;the actual curve inference:
(define samples
  (mh-query
   400 20

   (define poly-order (sample-integer 4))
   (define coefficients (repeat (+ poly-order 1) (lambda () (gaussian 0.0 2.0))))

   (define y-vals (map (make-poly coefficients) x-vals))

   (list poly-order coefficients)

   (all (map noisy-equals? y-vals obs-y-vals))
   )
  )

;;now let's look at the results:
(hist (map first samples) "Polynomial degree")

;;find the average coefficients for sampled polynomials of each order:
(define (mean-coeffs order)
  (let ((coeffs (map second (filter (lambda (s) (= order (first s))) samples))))
    (if (null? coeffs)
        '()
        (map (lambda (c) (mean c)) (apply zip coeffs)))))


;;set up graphing:
(define plot-x-vals (map (lambda (x) (/ x 10)) (range -50 50)))
(define plot-0-y-vals (map (make-poly (mean-coeffs 0)) plot-x-vals))
(define plot-1-y-vals (map (make-poly (mean-coeffs 1)) plot-x-vals))
(define plot-2-y-vals (map (make-poly (mean-coeffs 2)) plot-x-vals))
(define plot-3-y-vals (map (make-poly (mean-coeffs 3)) plot-x-vals))

(define (adjust points)
  (map (lambda (p) (+ (* (+ p 5) 25) 25))
       points))

;; 0th order polynomial
(define paper-0 (make-raphael "polynomial-0" 250 250))
(raphael-points paper-0 (adjust x-vals) (adjust obs-y-vals))
(raphael-lines paper-0 (adjust plot-x-vals) (adjust plot-0-y-vals))

;; 1st order polynomial
(define paper-1 (make-raphael "polynomial-1" 250 250))
(raphael-points paper-1 (adjust x-vals) (adjust obs-y-vals))
(raphael-lines paper-1 (adjust plot-x-vals) (adjust plot-1-y-vals))

;; 2nd order polynomial
(define paper-2 (make-raphael "polynomial-2" 250 250))
(raphael-points paper-2 (adjust x-vals) (adjust obs-y-vals))
(raphael-lines paper-2 (adjust plot-x-vals) (adjust plot-2-y-vals))

;; 3rd order polynomial
(define paper-3 (make-raphael "polynomial-3" 250 250))
(raphael-points paper-3 (adjust x-vals) (adjust obs-y-vals))
(raphael-lines paper-3 (adjust plot-x-vals) (adjust plot-3-y-vals))

'done
~~~~

~~~~ {test_id="12"}
(define obs-y-vals '(0.66 -0.32 -0.41 -0.59 -0.87 -0.75 -0.23 0.47 1.31 1.97 3.25))
~~~~

~~~~ {test_id="13"}
(define x-vals (range -3 3))
(define obs-y-vals '(2 0.1 -1 -1.5 -0.8 0 1.9))
~~~~

~~~~ {test_id="14"}
(define x-vals (range -3 3))
(define obs-y-vals '(2 1.6 0.9 0.3 -0.1 -0.45 -1.2))
~~~~

~~~~ {.mit-church test_id="15"}
;;take an object and "render" it into an image (represented as a list of lists):
(define (object-appearance object)
  (map (lambda (pixel-y)
         (map (lambda (pixel-x) (if (or (< pixel-x (first object))
                                        (<= (+ (first object) 1) pixel-x)
                                        (< pixel-y (second object))
                                        (<= (+ (second object) (third object)) pixel-y))
                                    0
                                   (fourth object)))
              '(0 1 2 3)))
         '(0 1)))

;;layer the image of an object onto a "background" image. Note that the object occludes the background.
(define (layer object image) (map (lambda (obj-row im-row)
                                    (map (lambda (o i) (if (= 0 o) i o))
                                         obj-row
                                         im-row))
                                  object image))

;;prior distribution over objects' properties:
(define (sample-properties)
  (list (sample-integer 4) ;;x location
        (sample-integer 2) ;;y location
        (+ 1 (sample-integer 2)) ;;vertical size
        (+ 1 (sample-integer 2)))) ;;color

;;Now we infer how many objects there are, given an ambiguous observed image:
(define observed-image '((0 1 0 0)(0 1 0 0)))

(define samples
  (mh-query 500 10

            ;;sample how many objects:
            (define num-objects (if (flip) 1 2))

            ;;sample the objects:
            (define object1 (sample-properties))
            (define object2 (sample-properties))

            ;;only render the second object if there are two:
            (define image1 (if (= num-objects 1)
                               (object-appearance object1)
                               (layer (object-appearance object1)
                                      (object-appearance object2))))

            num-objects

            (equal? image1 observed-image))
  )

(hist samples "Number of objects")
~~~~

~~~~ {.mit-church test_id="16"}
;;take an object and "render" it into an image (represented as a list of lists):
(define (object-appearance object)
  (map (lambda (pixel-y)
         (map (lambda (pixel-x) (if (or (< pixel-x (first object))
                                        (<= (+ (first object) 1) pixel-x)
                                        (< pixel-y (second object))
                                        (<= (+ (second object) (third object)) pixel-y))
                                    0
                                   (fourth object)))
              '(0 1 2 3)))
         '(0 1)))

;;layer the image of an object onto a "background" image. Note that the object occludes the background.
(define (layer object image) (map (lambda (obj-row im-row)
                                    (map (lambda (o i) (if (= 0 o) i o))
                                         obj-row
                                         im-row))
                                  object image))

;;motion model: the object drifts left or right with some probability.
(define (move object) (pair (+ (first object) (multinomial '(-1 0 1) '(0.3 0.4 0.3)))
                            (rest object)))

;;prior distribution over objects' properties:
(define (sample-properties)
  (list (sample-integer 4) ;;x location
        (sample-integer 2) ;;y location
        (+ 1 (sample-integer 2)) ;;vertical size
        (+ 1 (sample-integer 2)))) ;;color

;;Now we infer how many objects there are, given two "frames" of an ambiguous movie:
(define observed-image1 '((0 1 0 0)
                          (0 1 0 0)))
(define observed-image2 '((0 0 1 0)
                          (0 0 1 0)))

(define samples
  (mh-query 1000 10

            ;;sample how many objects:
            (define num-objects (if (flip) 1 2))

            ;;sample the objects:
            (define object1 (sample-properties))
            (define object2 (sample-properties))

            ;;only render the second object if there are two:
            (define image1 (if (= num-objects 1)
                               (object-appearance object1)
                               (layer (object-appearance object1)
                                      (object-appearance object2))))

            ;;the second image comes from motion on the objects:
            (define image2 (if (= num-objects 1)
                               (object-appearance (move object1))
                               (layer (object-appearance (move object1))
                                      (object-appearance (move object2)))))

            num-objects

            (and (equal? image1 observed-image1)
                 (equal? image2 observed-image2)))
  )

(hist samples "Number of objects, moving image")
~~~~

~~~~ {test_id="17"}
;;the total possible range is 0 to  total-range - 1
(define total-range 10)

;;draw from a set of integers with some chance of drawing a different integer in the possible range:
(define (noisy-draw set) (sample-discrete (map (lambda (x) (if (member x set) 1.0 0.01)) (iota total-range))))

;;for example:
(noisy-draw '(1 3 5))
~~~~
