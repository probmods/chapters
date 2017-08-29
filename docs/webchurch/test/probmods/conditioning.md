~~~~ {.norun test_id="0"}
(query
   generative-model
   what-we-want-to-know
   (condition what-we-know))
~~~~

~~~~ {test_id="1"}
(define A (if (flip) 1 0))
(define B (if (flip) 1 0))
(define C (if (flip) 1 0))
(define D (+ A B C))
D
~~~~

~~~~ {test_id="2"}
(define (take-sample)
  (rejection-query

   (define A (if (flip) 1 0))
   (define B (if (flip) 1 0))
   (define C (if (flip) 1 0))
   (define D (+ A B C))

   A

   (condition (equal? D 3))))

(hist (repeat 100 take-sample) "Value of A, given that D is 3")
~~~~

~~~~ {test_id="3"}
(define (take-sample)
  (rejection-query

   (define A (if (flip) 1 0))
   (define B (if (flip) 1 0))
   (define C (if (flip) 1 0))
   (define D (+ A B C))

   A

   (condition (>= D 2))))

(hist (repeat 100 take-sample) "Value of A, given that D is greater than or equal to 2")
~~~~

~~~~ {.norun test_id="4"}
(query
   generative-model
   what-we-want-to-know
   what-we-know)
~~~~

~~~~ {test_id="5"}
(define (take-sample)
   (define A (if (flip) 1 0))
   (define B (if (flip) 1 0))
   (define C (if (flip) 1 0))
   (define D (+ A B C))
   (if (>= D 2) A (take-sample)))

(hist (repeat 100 take-sample) "Value of A, given that D is greater than or equal to 2")
~~~~

~~~~ {.norun test_id="6"}
(define (rejection-query ..defines.. ..query-expression.. ..conditioner..)
       ..defines..
       (define query-value ..query-expression..)
       (define condition-value ..conditioner..)
       (if (equal? condition-value true)
           query-value
           (rejection-query defines query-expression conditioner)))
~~~~

~~~~ {test_id="7"}
(define observed-data true)

(define (prior) (flip))

(define (observe h) (if h (flip 0.9) (flip 0.1)))

(rejection-query

 (define hypothesis (prior))
 (define data (observe hypothesis))

 hypothesis

 (equal? data observed-data))
~~~~

~~~~ {test_id="8"}
(define baserate 0.1)

(define samples
  (mh-query 100 ;number of samples
            100 ;lag

   (define A (if (flip baserate) 1 0))
   (define B (if (flip baserate) 1 0))
   (define C (if (flip baserate) 1 0))
   (define D (+ A B C))

   A

   (condition (>= D 2))))

(hist samples "Value of A, given that D is greater than or equal to 2")
~~~~

~~~~ {test_id="9"}
(define samples
  (mh-query
   100 100

   (define A (if (flip) 1 0))
   (define B (if (flip) 1 0))
   (define C (if (flip) 1 0))

   A

   (condition (>= (+ A B C) 2))))

(hist samples "Value of A, given that the sum is greater than or equal to 2")
~~~~

~~~~ {test_id="10"}
(define samples
  (mh-query 1000 10

    (define strength (mem (lambda (person) (gaussian 0 1))))

    (define lazy (lambda (person) (flip (/ 1 3))))

    (define (total-pulling team)
      (sum
         (map
          (lambda (person) (if (lazy person) (/ (strength person) 2) (strength person)))
          team)))

    (define (winner team1 team2)
      (if (> (total-pulling team1) (total-pulling team2)) 'team1 'team2))

    (strength 'bob)

    (and (eq? 'team1 (winner '(bob mary) '(tom sue)))
         (eq? 'team1 (winner '(bob sue) '(tom jim))))))

(display (list "Expected strength:" (mean samples)))
(density samples "Bob strength" true)
~~~~

~~~~ {test_id="11"}
(define samples
  (mh-query 100 100
    (define strength (mem (lambda (person) (gaussian 0 1))))
    (define lazy (lambda (person) (flip (/ 1 3))))

    (define (total-pulling team)
      (sum
         (map (lambda (person) (if (lazy person) (/ (strength person) 2) (strength person)))
               team)))

    (define (winner team1 team2) (if (< (total-pulling team1) (total-pulling team2)) 'team2 'team1))

    (eq? 'team1 (winner '(bob mary) '(jim sue)))

    (and (>= (strength 'mary) (strength 'sue))
         (eq? 'team1 (winner '(bob francis) '(tom jim)))))
)
(hist samples "Do bob and mary win against jim and sue")
~~~~

~~~~ {test_id="12"}
;set up some bins on a floor:
(define (bins xmin xmax width)
  (if (< xmax (+ xmin width))
      ;the floor:
      '( (("rect" #t (400 10)) (175 500)) )
      ;add a bin, keep going:
      (pair (list '("rect" #t (1 10)) (list xmin 490))
            (bins (+ xmin width) xmax width))))

;make a world with two fixed circles and bins:
(define world (pair '(("circle" #t (60)) (60 200))
                    (pair '(("circle" #t (30)) (300 300))
                          (bins -1000 1000 25))))

;make a random block at the top:
(define (random-block) (list (list "circle" #f '(10))
                             (list (uniform 0 worldWidth) 0)))

;add a random block to world, then animate:
(animatePhysics 1000 (pair (random-block) world))
~~~~

~~~~ {test_id="13"}
;;;fold: Set up the world, as above:
;set up some bins on a floor:
(define (bins xmin xmax width)
  (if (< xmax (+ xmin width))
      ;the floor:
      '( (("rect" #t (400 10)) (175 500)) )
      ;add a bin, keep going:
      (pair (list '("rect" #t (1 10)) (list xmin 490))
            (bins (+ xmin width) xmax width))))

;make a world with two fixed circles and bins:
(define world (pair '(("circle" #t (60)) (60 200))
                    (pair '(("circle" #t (30)) (300 300))
                          (bins -1000 1000 25))))

;make a random block at the top:
(define (random-block) (list (list "circle" #f '(10))
                             (list (uniform 0 worldWidth) 0)))
;;;

;helper to get X position of the movable block:
(define (getX world)
  (if (second (first (first world)))
      (getX (rest world))
      (first (second (first world)))))

;given an observed final position, where did the block come from?
(define observed-x 160)

(define init-xs
  (mh-query 100 10
    (define init-state (pair (random-block) world))
    (define final-state (runPhysics 1000 init-state))
    (getX init-state)
    (= (gaussian (getX final-state) 10) observed-x)))


(density init-xs "init state" true)
~~~~

~~~~ {test_id="14"}
(define samples
 (mh-query 100 100
   (define breast-cancer (flip 0.01))

   (define positive-mammogram (if breast-cancer (flip 0.8) (flip 0.096)))

   breast-cancer

   positive-mammogram
 )
)
(hist samples "breast cancer")
~~~~

~~~~ {test_id="15"}
(define samples
 (mh-query 100 100
   (define breast-cancer (flip 0.01))
   (define benign-cyst (flip 0.2))

   (define positive-mammogram (or (and breast-cancer (flip 0.8)) (and benign-cyst (flip 0.5))))

   breast-cancer

   positive-mammogram
 )
)
(hist samples "breast cancer")
~~~~

~~~~ {test_id="16"}
(define samples
  (mh-query 1000 100
    (define lung-cancer (flip 0.01))
    (define TB (flip 0.005))
    (define cold (flip 0.2))
    (define stomach-flu (flip 0.1))
    (define other (flip 0.1))

    (define cough (or (and cold (flip 0.5)) (and lung-cancer (flip 0.3)) (and TB (flip 0.7)) (and other (flip 0.01))))
    (define fever (or (and cold (flip 0.3)) (and stomach-flu (flip 0.5)) (and TB (flip 0.2)) (and other (flip 0.01))))
    (define chest-pain (or (and lung-cancer (flip 0.4)) (and TB (flip 0.5)) (and other( flip 0.01))))
    (define shortness-of-breath (or (and lung-cancer (flip 0.4)) (and TB (flip 0.5)) (and other (flip 0.01))))

    (list lung-cancer TB)

    (and cough fever chest-pain shortness-of-breath)

  )
)
(hist samples "Joint inferences for lung cancer and TB")
~~~~

~~~~ {test_id="17"}
(define samples
  (mh-query 1000 100
    (define works-in-hospital (flip 0.01))
    (define smokes (flip 0.2))

    (define lung-cancer (or (flip 0.01) (and smokes (flip 0.02))))
    (define TB (or (flip 0.005) (and works-in-hospital (flip 0.01))))
    (define cold (or (flip 0.2) (and works-in-hospital (flip 0.25))))
    (define stomach-flu (flip 0.1))
    (define other (flip 0.1))

    (define cough (or (and cold (flip 0.5)) (and lung-cancer (flip 0.3)) (and TB (flip 0.7)) (and other (flip 0.01))))
    (define fever (or (and cold (flip 0.3)) (and stomach-flu (flip 0.5)) (and TB (flip 0.2)) (and other (flip 0.01))))
    (define chest-pain (or (and lung-cancer (flip 0.4)) (and TB (flip 0.5)) (and other( flip 0.01))))
    (define shortness-of-breath (or (and lung-cancer (flip 0.4)) (and TB (flip 0.5)) (and other (flip 0.01))))

   (list lung-cancer TB)

   (and cough chest-pain shortness-of-breath)

  )
)
(hist samples "Joint inferences for lung cancer and TB")
~~~~

~~~~ {test_id="18"}
(rejection-query
  (define a (flip))
  (define b (flip))
  a
  (or a b))
~~~~

~~~~ {test_id="19"}
(rejection-query
 (define nice (mem (lambda (person) (flip 0.7))))
 (define (smiles person) (if (nice person) (flip 0.8) (flip 0.5)))
 (nice 'alice)
 (and (smiles 'alice)  (smiles 'bob) (smiles 'alice)))
~~~~

~~~~ {test_id="20"}
~~~~

~~~~ {test_id="21"}
~~~~

~~~~ {test_id="22"}
;; define some variables and utility functions
(define letters '(a b c d e f g h i j k l m n o p q r s t u v w x y z) )
(define (vowel? letter) (if (member letter '(a e i o u y)) #t #f))
(define letter-probabilities (map (lambda (letter) (if (vowel? letter) 0.01 0.047)) letters))

(define (my-list-index needle haystack counter)
  (if (null? haystack)
      'error
      (if (equal? needle (first haystack))
          counter
          (my-list-index needle (rest haystack) (+ 1 counter)))))

(define (get-position letter) (my-list-index letter letters 1))

;; actually compute p(h | win)
(rejection-query
 (define my-letter (multinomial letters letter-probabilities))

 (define my-position (get-position my-letter))
 (define my-win-probability (/ 1.0 (* my-position my-position)))
 (define win? ...)

 ;; query
 ...

 ;; condition
 ...
)
~~~~

~~~~ {test_id="23"}
(define x ...)
~~~~
