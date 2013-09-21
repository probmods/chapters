% testing physics

WORKS

~~~~
(define marbleRadius 8)
(define xCenter (/ worldWidth 2))
(define nrow 7)
(define ncol 7)
(define binWidth (/ worldWidth ncol))

(define (marbleX) (+ xCenter (uniform -1 1))) ;*almost* the center

;the pegs, walls, and bins of the plinko machine
(define emptyPlinko (plinkoWorld nrow ncol))

;place a marble at the top and almost at the center
(define (setupPlinko) (addCircle emptyPlinko (marbleX) 0 marbleRadius #f))

(define initialWorlds (repeat 50 setupPlinko))
(define (plinkoRun w) (plinkoWhichBin (runPhysics 1000 w) ncol))
(hist (map plinkoRun initialWorlds) "Plinko")

~~~~

Same model with animation (WORKS):

~~~~
(define marbleRadius 8)
(define xCenter (/ worldWidth 2))
(define nrow 7)
(define ncol 7)
(define binWidth (/ worldWidth ncol))

(define (marbleX) (+ xCenter (uniform -1 1)))

(define world (addCircle (plinkoWorld nrow ncol) (marbleX) 0 marbleRadius #f))
(animatePhysics 1000 world)

~~~~

Random falling things (WORKS):

~~~~
(define (dim) (uniform 5 20))
(define (staticDim) (uniform 10 50))
(define (shape) (if (flip) "circle" "rect"))
(define (xpos) (uniform 100 (- worldWidth 100)))
(define (ypos) (uniform 100 (- worldHeight 100)))

(define (makeFallingShape) (list (list (shape) #f (list (dim) (dim)))
                                       (list (xpos) 0)))

(define (makeStaticShape) (list (list (shape) #t (list (staticDim) (staticDim)))
                                      (list (xpos) (ypos))))

(define (makeGround) (list (list "rect" #t (list worldWidth 10))
                                       (list (/ worldWidth 2) worldHeight)))
(define fallingWorld (list (makeGround)
                           (makeFallingShape) (makeFallingShape) (makeFallingShape)
                           (makeStaticShape) (makeStaticShape)))

(animatePhysics 1000 fallingWorld)

~~~~

Towers (WORKS):

~~~~
(define (getWidth worldObj) (first (third (first worldObj))))
(define (getHeight worldObj) (second (third (first worldObj))))
(define (getX worldObj) (first (second worldObj)))
(define (getY worldObj) (second (second worldObj)))
(define (firstXpos) (uniform 50 (- worldWidth 20)))

(define (dim) (uniform 10 50))
(define (xpos prevBlock)
  (define prevW (getWidth prevBlock))
  (define prevX (getX prevBlock))
  (uniform (- prevX prevW) (+ prevX prevW)))
(define (ypos prevBlock h)
  (define prevY (getY prevBlock))
  (define prevH (getHeight prevBlock))
  (- prevY prevH h))

(define ground (list (list "rect" #t (list worldWidth 10))
                     (list (/ worldWidth 2) worldHeight)))

(define (addFirstBlock prevBlock)
  (define w (dim))
  (define h (dim))
  (list (list "rect" #f (list w h))
        (list (firstXpos) (ypos prevBlock h))))

(define (addBlock prevBlock)
  (define w (dim))
  (define h (dim))
  (list (list "rect" #f (list w h))
        (list (xpos prevBlock) (ypos prevBlock h))))

(define (makeTowerWorld)
  (define firstBlock (addFirstBlock ground) )
  (define secondBlock (addBlock firstBlock))
  (define thirdBlock (addBlock secondBlock))
  (define fourthBlock (addBlock thirdBlock))
  (define fifthBlock (addBlock fourthBlock))
  (list ground firstBlock secondBlock thirdBlock fourthBlock fifthBlock))

(animatePhysics 1000 (makeTowerWorld))

~~~~

Tower Stability (WORKS):

~~~~
(define (getY obj) (second (second obj)))
;y position is 0 at the TOP of the screen
(define (highestY world) (min (map getY world)))

(define eps 10) ;things might move around a little, but within 10 pixels is close
(define (approxEqual a b) (< (abs (- a b)) 10))

(define (doesTowerFall initialW finalW) (not (approxEqual (highestY initialW)
                                                     (highestY finalW))))

(define initialWorld (makeTowerWorld))
(define finalWorld (runPhysics 1000 initialWorld))

(doesTowerFall initialWorld finalWorld)

~~~~

Counter-Inutitively Stable Structure (WORKS):

~~~~
(define almostUnstableWorld (list (list (list 'rect #t (list 350 5))
                                        (list 175 500))
                                  (list (list 'rect #f (list 24 22))
                                        (list 175 473))
                                  (list (list 'rect #f (list 15 38))
                                        (list 159.97995044874122 413))
                                  (list (list 'rect #f (list 11 35))
                                        (list 166.91912737427202 340))
                                  (list (list 'rect #f (list 11 29))
                                        (list 177.26195677111082 276))
                                  (list (list 'rect #f (list 11 17))
                                        (list 168.51354470809122 230))))
(animatePhysics 1000 almostUnstableWorld)

~~~~

Same structure, this time with noise:

Tower Hist (WORKS):

~~~~
(define (getY obj) (second (second obj)))
;y position is 0 at the TOP of the screen
(define (highestY world) (min (map getY world)))

(define eps 10) ;things might move around a little, but within 10 pixels is close
(define (approxEqual a b) (< (abs (- a b)) 10))

(define (doesTowerFall initialW finalW) (not (approxEqual (highestY initialW)
                                                          (highestY finalW))))



(define w (addCircle emptyWorld 50 50 (list 4) #f))
(define (sup) w)
               

(define initialWorlds (repeat 20 makeTowerWorld))
(define (towerRun w) (doesTowerFall w (runPhysics 1000 w)))
(hist (map towerRun initialWorlds) "Does a Random Tower Fall?")

~~~~

Tower Noise:

~~~~
(define (getY obj) (second (second obj)))
;y position is 0 at the TOP of the screen
(define (highestY world) (min (map getY world)))

(define eps 10) ;things might move around a little, but within 10 pixels is close
(define (approxEqual a b) (< (abs (- a b)) 10))

(define (doesTowerFall initialW finalW) (not (approxEqual (highestY initialW)
                                                          (highestY finalW))))



(define w (addCircle emptyWorld 50 50 (list 4) #f))
(define (sup) w)
               

(define initialWorlds (repeat 20 makeTowerWorld))
(define (towerRun w) (doesTowerFall w (runPhysics 1000 w)))
(hist (map towerRun initialWorlds) "Does a Random Tower Fall?")

~~~~
