~~~~ {test_id="0"}
(flip)
~~~~

~~~~ {test_id="1"}
(hist (repeat 1000 flip) "Flips")
~~~~

~~~~ {test_id="2"}
(* (gaussian 0 1) (gaussian 0 1) )
~~~~

~~~~ {test_id="3"}
(define two-gaussians (lambda () (* (gaussian 0 1) (gaussian 0 1) )))
(density (repeat 100 two-gaussians))
~~~~

~~~~ {test_id="4"}
(define noisy-double (lambda (x) (if (flip) x (+ x x))))

(noisy-double 3)
~~~~

~~~~ {test_id="5"}
(define fair-coin (lambda () (if (flip 0.5) 'h 't))) ;the thunk is a fair coin

(hist (repeat 20 fair-coin) "fair coin")
~~~~

~~~~ {test_id="6"}
(define trick-coin (lambda () (if (flip 0.95) 'h 't)))

(hist (repeat 20 trick-coin) "trick coin")
~~~~

~~~~ {test_id="7"}
(define (make-coin weight) (lambda () (if (flip weight) 'h 't)))
(define fair-coin (make-coin 0.5))
(define trick-coin (make-coin 0.95))
(define bent-coin (make-coin 0.25))

(hist (repeat 20 fair-coin) "20 fair coin flips")
(hist (repeat 20 trick-coin) "20 trick coin flips")
(hist (repeat 20 bent-coin) "20 bent coin flips")
~~~~

~~~~ {test_id="8"}
(define (make-coin weight) (lambda () (if (flip weight) 'h 't)))
(define (bend coin)
  (lambda () (if (equal? (coin) 'h)
                 ( (make-coin 0.7) )
                 ( (make-coin 0.1) ) )))

(define fair-coin (make-coin 0.5))
(define bent-coin (bend fair-coin))

(hist (repeat 100 bent-coin) "bent coin")
~~~~

~~~~ {test_id="9"}
(define make-coin (lambda (weight) (lambda () (flip weight))))
(define coin (make-coin 0.8))

(define data (repeat 1000 (lambda () (sum (map (lambda (x) (if x 1 0)) (repeat 10 coin))))))
(hist data  "Distribution of coin flips")
~~~~

~~~~ {test_id="10"}
(define lung-cancer (flip 0.01))
(define cold (flip 0.2))

(define cough (or cold lung-cancer))

cough
~~~~

~~~~ {test_id="11"}
(define lung-cancer (flip 0.01))
(define TB (flip 0.005))
(define stomach-flu (flip 0.1))
(define cold (flip 0.2))
(define other (flip 0.1))

(define cough
  (or (and cold (flip 0.5))
      (and lung-cancer (flip 0.3))
      (and TB (flip 0.7))
      (and other (flip 0.01))))


(define fever
  (or (and cold (flip 0.3))
      (and stomach-flu (flip 0.5))
      (and TB (flip 0.1))
      (and other (flip 0.01))))


(define chest-pain
  (or (and lung-cancer (flip 0.5))
      (and TB (flip 0.5))
      (and other (flip 0.01))))

(define shortness-of-breath
  (or (and lung-cancer (flip 0.5))
      (and TB (flip 0.2))
      (and other (flip 0.01))))

(list "cough" cough
      "fever" fever
      "chest-pain" chest-pain
      "shortness-of-breath" shortness-of-breath)
~~~~

~~~~ {test_id="12"}
(list (flip) (flip))
~~~~

~~~~ {test_id="13"}
(define (random-pair) (list (flip) (flip)))

(hist (repeat 1000 random-pair) "return values")
~~~~

~~~~ {test_id="14"}
(define A (flip))
(define B (flip))
(define C (list A B))
C
~~~~

~~~~ {test_id="15"}
(define A (flip))
(define B (flip (if A 0.3 0.7)))
(list A B)
~~~~

~~~~ {test_id="16"}
(or (flip) (flip))
~~~~

~~~~ {test_id="17"}
(define (geometric p)
  (if (flip p)
      0
      (+ 1 (geometric p))))

(hist (repeat 1000 (lambda () (geometric 0.6))) "Geometric of 0.6")
~~~~

~~~~ {test_id="18"}
(define (eye-color person) (uniform-draw '(blue green brown)))

(list
 (eye-color 'bob)
 (eye-color 'alice)
 (eye-color 'bob) )
~~~~

~~~~ {test_id="19"}
(equal? (flip) (flip))
~~~~

~~~~ {test_id="20"}
(define mem-flip (mem flip))
(equal? (mem-flip) (mem-flip))
~~~~

~~~~ {test_id="21"}
(define eye-color
  (mem (lambda (person) (uniform-draw '(blue green brown)))))

(list
 (eye-color 'bob)
 (eye-color 'alice)
 (eye-color 'bob) )
~~~~

~~~~ {test_id="22"}
(define flip-n (mem (lambda (n) (flip))))
(list (list (flip-n 1) (flip-n 12) (flip-n 47) (flip-n 1548))
      (list (flip-n 1) (flip-n 12) (flip-n 47) (flip-n 1548)))
~~~~

~~~~ {test_id="23"}
(define strength (mem (lambda (person) (gaussian 0 1))))

(define lazy (lambda (person) (flip 0.25)))

(define (pulling person)
  (if (lazy person) (/ (strength person) 2) (strength person)))

(define (total-pulling team)
  (sum (map pulling team)))

(define (winner team1 team2) (if (< (total-pulling team1) (total-pulling team2)) team2 team1))

(list "Tournament results:"
      (winner '(alice bob) '(sue tom))
      (winner '(alice bob) '(sue tom))
      (winner '(alice sue) '(bob tom))
      (winner '(alice sue) '(bob tom))
      (winner '(alice tom) '(bob sue))
      (winner '(alice tom) '(bob sue)))
~~~~

~~~~ {test_id="24"}
(define (dim) (uniform 5 20))
(define (staticDim) (uniform 10 50))
(define (shape) (if (flip) "circle" "rect"))
(define (xpos) (uniform 100 (- worldWidth 100)))
(define (ypos) (uniform 100 (- worldHeight 100)))

; an object in the word is a list of two things:
;  shape properties: a list of SHAPE ("rect" or "circle"), IS_STATIC (#t or #f),
;                    and dimensions (either (list WIDTH HEIGHT) for a rect or
;                    (list RADIUS) for a circle
;  position: (list X Y)
(define (makeFallingShape) (list (list (shape) #f (list (dim) (dim)))
                                       (list (xpos) 0)))

(define (makeStaticShape) (list (list (shape) #t (list (staticDim) (staticDim)))
                                      (list (xpos) (ypos))))

(define ground (list (list "rect" #t (list worldWidth 10))
                                     (list (/ worldWidth 2) worldHeight)))
(define fallingWorld (list ground
                           (makeFallingShape) (makeFallingShape) (makeFallingShape)
                           (makeStaticShape) (makeStaticShape)))

(animatePhysics 1000 fallingWorld)
~~~~

~~~~ {test_id="25"}
(define xCenter (/ worldWidth 2))
(define (getWidth worldObj) (first (third (first worldObj))))
(define (getHeight worldObj) (second (third (first worldObj))))
(define (getX worldObj) (first (second worldObj)))
(define (getY worldObj) (second (second worldObj)))

(define ground (list (list "rect" #t (list worldWidth 10))
                     (list (/ worldWidth 2) worldHeight)))

(define (dim) (uniform 10 50))

(define (xpos prevBlock)
  (define prevW (getWidth prevBlock))
  (define prevX (getX prevBlock))
  (uniform (- prevX prevW) (+ prevX prevW)))

(define (ypos prevBlock h)
  (define prevY (getY prevBlock))
  (define prevH (getHeight prevBlock))
  (- prevY prevH h))

(define (addBlock prevBlock first?)
  (define w (dim))
  (define h (dim))
  (list (list "rect" #f (list w h))
        (list (if first? xCenter (xpos prevBlock)) (ypos prevBlock h))))

(define (makeTowerWorld)
  (define firstBlock (addBlock ground #t))
  (define secondBlock (addBlock firstBlock #f))
  (define thirdBlock (addBlock secondBlock #f))
  (define fourthBlock (addBlock thirdBlock #f))
  (define fifthBlock (addBlock fourthBlock #f))
  (list ground firstBlock secondBlock thirdBlock fourthBlock fifthBlock))

(animatePhysics 1000 (makeTowerWorld))
~~~~

~~~~ {test_id="26"}
(define (getWidth worldObj) (first (third (first worldObj))))
(define (getHeight worldObj) (second (third (first worldObj))))
(define (getX worldObj) (first (second worldObj)))
(define (getY worldObj) (second (second worldObj)))
(define (static? worldObj) (second (first worldObj)))

(define ground
  (list (list "rect" #t (list worldWidth 10)) (list (/ worldWidth 2) (+ worldHeight 6))))

(define stableWorld
  (list ground (list (list 'rect #f (list 60 22)) (list 175 473))
        (list (list 'rect #f (list 50 38)) (list 159.97995044874122 413))
        (list (list 'rect #f (list 40 35)) (list 166.91912737427202 340))
        (list (list 'rect #f (list 30 29)) (list 177.26195677111082 276))
        (list (list 'rect #f (list 11 17)) (list 168.51354470809122 230))))

(define almostUnstableWorld
  (list ground (list (list 'rect #f (list 24 22)) (list 175 473))
        (list (list 'rect #f (list 15 38)) (list 159.97995044874122 413))
        (list (list 'rect #f (list 11 35)) (list 166.91912737427202 340))
        (list (list 'rect #f (list 11 29)) (list 177.26195677111082 276))
        (list (list 'rect #f (list 11 17)) (list 168.51354470809122 230))))

(define unstableWorld
  (list ground (list (list 'rect #f (list 60 22)) (list 175 473))
        (list (list 'rect #f (list 50 38)) (list 90 413))
        (list (list 'rect #f (list 40 35)) (list 140 340))
        (list (list 'rect #f (list 10 29)) (list 177.26195677111082 276))
        (list (list 'rect #f (list 50 17)) (list 140 230))))

(define (doesTowerFall initialW finalW)
  ;y position is 0 at the TOP of the screen
  (define (highestY world) (apply min (map getY world)))
  (define eps 1) ;things might move around a little, but within 1 pixel is close
  (define (approxEqual a b) (< (abs (- a b)) eps))
  (not (approxEqual (highestY initialW) (highestY finalW))))

(define (noisify world)
  (define (xNoise worldObj)
    (define noiseWidth 10) ;how many pixes away from the original xpos can we go?
    (define (newX x) (uniform (- x noiseWidth) (+ x noiseWidth)))
    (if (static? worldObj)
        worldObj
        (list (first worldObj)
              (list (newX (getX worldObj)) (getY worldObj)))))
  (map xNoise world))

(define (runStableTower)
  (define initialWorld (noisify stableWorld))
  (define finalWorld (runPhysics 1000 initialWorld))
  (doesTowerFall initialWorld finalWorld))

(define (runAlmostUnstableTower)
  (define initialWorld (noisify almostUnstableWorld))
  (define finalWorld (runPhysics 1000 initialWorld))
  (doesTowerFall initialWorld finalWorld))

(define (runUnstableTower)
  (define initialWorld (noisify unstableWorld))
  (define finalWorld (runPhysics 1000 initialWorld))
  (doesTowerFall initialWorld finalWorld))

(hist (repeat 10 runStableTower) "stable")
(hist (repeat 10 runAlmostUnstableTower) "almost unstable")
(hist (repeat 10 runUnstableTower) "unstable")

;uncomment any of these that you'd like to see for yourself
;(animatePhysics 1000 stableWorld)
;(animatePhysics 1000 almostUnstableWorld)
;(animatePhysics 1000 unstableWorld)
~~~~

~~~~ {test_id="27"}
(if (flip) (flip 0.7) (flip 0.1))
~~~~

~~~~ {test_id="28"}
(flip (if (flip) 0.7 0.1))
~~~~

~~~~ {test_id="29"}
(flip 0.4)
~~~~

~~~~ {test_id="30"}
(define foo (flip))
(list foo foo foo)
~~~~

~~~~ {test_id="31"}
(define (foo) (flip))
(list (foo) (foo) (foo))
~~~~

~~~~ {test_id="32"}
(define (lung-cancer person)  (flip 0.01))
(define (cold person)  (flip 0.2))

(define (cough person) (or (cold person) (lung-cancer person)))

(list  (cough 'bob) (cough 'alice))
~~~~

~~~~ {test_id="33"}
(define (make-coin weight) (lambda () (if (flip weight) 'h 't)))
(define (bend coin)
  (lambda () (if (equal? (coin) 'h)
                 ( (make-coin 0.7) )
                 ( (make-coin 0.1) ) )))

(define fair-coin (make-coin 0.5))
(define bent-coin (bend fair-coin))

(hist (repeat 100 bent-coin) "bent coin")
~~~~

~~~~ {test_id="34"}
(define strength (mem (lambda (person) (if (flip) 5 10))))

(define lazy (lambda (person) (flip (/ 1 3))))

(define (total-pulling team)
  (sum
   (map (lambda (person) (if (lazy person) (/ (strength person) 2) (strength person)))
        team)))

(define (winner team1 team2) (if (< (total-pulling team1) (total-pulling team2)) team2 team1))

(winner '(alice) '(bob))                        ;; expression 1

(equal? '(alice) (winner '(alice) '(bob)))      ;; expression 2

(and (equal? '(alice) (winner '(alice) '(bob))) ;; expression 3
     (equal? '(alice) (winner '(alice) '(fred))))

(and (equal? '(alice) (winner '(alice) '(bob))) ;; expression 4
     (equal? '(jane) (winner '(jane) '(fred))))
~~~~

~~~~ {test_id="35"}
(define (geometric p)
  (if (flip p)
      0
      (+ 1 (geometric p))))
~~~~

~~~~ {test_id="36"}
(define a ...)
(define b ...)
(list a b)
~~~~

~~~~ {test_id="37"}
(define (getWidth worldObj) (first (third (first worldObj))))
(define (getHeight worldObj) (second (third (first worldObj))))
(define (getX worldObj) (first (second worldObj)))
(define (getY worldObj) (second (second worldObj)))
(define (getIsStatic worldObj) (second (first worldObj)))

(define ground
  (list (list "rect" #t (list worldWidth 10)) (list (/ worldWidth 2) (+ worldHeight 6))))

(define almostUnstableWorld
  (list ground (list (list 'rect #f (list 24 22)) (list 175 473))
        (list (list 'rect #f (list 15 38)) (list 159.97995044874122 413))
        (list (list 'rect #f (list 11 35)) (list 166.91912737427202 340))
        (list (list 'rect #f (list 11 29)) (list 177.26195677111082 276))
        (list (list 'rect #f (list 11 17)) (list 168.51354470809122 230))))

(define (noisify world)
  (define (xNoise worldObj)
    (define noiseWidth 10) ;how many pixes away from the original xpos can we go?
    (define (newX x) (uniform (- x noiseWidth) (+ x noiseWidth)))
    (if (getIsStatic worldObj)
        worldObj
        (list (first worldObj)
              (list (newX (getX worldObj)) (getY worldObj)))))
  (map xNoise world))

(define (boolean->number x) (if x 1 0))

;; round a number, x, to n decimal places
(define (decimals x n)
  (define a (expt 10 n))
  (/ (round (* x a)) a))

(define (highestY world) (apply min (map getY world))) ;; y = 0 is at the TOP of the screen

;; get the height of the tower in a world
(define (getTowerHeight world) (- worldHeight (highestY world)))

;; 0 if tower falls, 1 if it stands
(define (doesTowerFall initialW finalW)
  (define eps 1) ;things might move around a little, but within 1 pixel is close
  (define (approxEqual a b) (< (abs (- a b)) eps))
  (boolean->number (approxEqual (highestY initialW) (highestY finalW))))


(define (towerFallDegree initialW finalW)
  ;; FILL THIS PART IN
  -999)

;; visualize stability measure value and animation
(define (visualizeStabilityMeasure measureFunction)
  (define initialWorld (noisify almostUnstableWorld))
  (define finalWorld (runPhysics 1000 initialWorld))
  (define measureValue (measureFunction initialWorld finalWorld))

  (display
   (list "Stability measure: "
                                (decimals measureValue 2) "//"
                                "Initial height: "
                                (decimals (getTowerHeight initialWorld) 2) "//"
                                "Final height: "
                                (decimals (getTowerHeight finalWorld) 2)))
   (animatePhysics 1000 initialWorld))

;; visualize doesTowerFall measure
;;(visualizeStabilityMeasure doesTowerFall)

;; visualize towerFallDegree measure
(visualizeStabilityMeasure towerFallDegree)
~~~~
