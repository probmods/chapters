~~~~ {test_id="0"}
(define C (flip))
(define B (flip))
(define A (if B (flip 0.1) (flip 0.4)))
(or A C)
~~~~

~~~~ {test_id="1"}
(define samples
  (mh-query 
   200 100
   
   (define smokes (flip 0.2))
   
   (define lung-disease (or (flip 0.001) (and smokes (flip 0.1))))
   (define cold (flip 0.02))
   
   (define cough (or (and cold (flip 0.5)) (and lung-disease (flip 0.5)) (flip 0.01)))
   (define fever (or (and cold (flip 0.3)) (flip 0.01)))
   (define chest-pain (or (and lung-disease (flip 0.2)) (flip 0.01)))
   (define shortness-of-breath (or (and lung-disease (flip 0.2)) (flip 0.01)))
   
   (list cold lung-disease)
   
   cough))
 
(hist (map first samples) "cold")
(hist (map second samples) "lung-disease")
(hist samples "cold, lung-disease")
~~~~

~~~~ {test_id="2"}
(define C (flip))
(define B (flip))
(define A (if C (if B (flip 0.85) false) false))
A
~~~~

~~~~ {test_id="3"}
(define (sample)
  (define smokes (flip 0.2))
  
  (define lung-disease (or (flip 0.001) (and smokes (flip 0.1))))
  (define cold (flip 0.02))
  
  (define cough (or (and cold (flip 0.5)) (and lung-disease (flip 0.5)) (flip 0.01)))
  (define fever (or (and cold (flip 0.3)) (flip 0.01)))
  (define chest-pain (or (and lung-disease (flip 0.2)) (flip 0.01)))
  (define shortness-of-breath (or (and lung-disease (flip 0.2)) (flip 0.01)))
  
  (list cough cold))

(define samples (repeat 200 sample))
   
(hist (map first samples) "cough")
(hist (map second samples) "cold")
~~~~

~~~~ {test_id="4"}
(define (sample)
  (define smokes (flip 0.2))
  
  (define lung-disease (or (flip 0.001) (and smokes (flip 0.1))))
  (define cold true) ;we intervene to make cold true.
  
  (define cough (or (and cold (flip 0.5)) (and lung-disease (flip 0.5)) (flip 0.01)))
  (define fever (or (and cold (flip 0.3)) (flip 0.01)))
  (define chest-pain (or (and lung-disease (flip 0.2)) (flip 0.01)))
  (define shortness-of-breath (or (and lung-disease (flip 0.2)) (flip 0.01)))
  
  (list cough cold))

(define samples (repeat 200 sample))
   
(hist (map first samples) "cough")
(hist (map second samples) "cold")
~~~~

~~~~ {test_id="5"}
(define (samples B-val)
  (mh-query
   100 10
   (define C (flip))
   (define B (flip))
   (define A (if B (flip 0.1) (flip 0.4)))
   A
   (eq? B B-val)))

(hist (samples true) "A if B is true.")
(hist (samples false) "A if B is false.")
~~~~

~~~~ {test_id="6"}
(define (samples B-val)
  (mh-query
   100 10
   (define C (flip))
   (define B (if C (flip 0.5) (flip 0.9)))
   (define A (if C (flip 0.1) (flip 0.4)))
   A
   (eq? B B-val)))

(hist (samples true) "A if B is true.")
(hist (samples false) "A if B is false.")
~~~~

~~~~ {test_id="7"}
(define (samples B-val)
  (mh-query
   100 10
   (define C (flip))
   (define B (if C (flip 0.5) (flip 0.9)))
   (define A (if C (flip 0.1) (flip 0.4)))
   A
   (and C (eq? B B-val))))

(hist (samples true) "A if B is true.")
(hist (samples false) "A if B is false.")
~~~~

~~~~ {test_id="8"}
(define (samples B-val)
  (mh-query
   100 10
   (define A (flip))
   (define B (flip))
   (define C (if (or A B) (flip 0.9) (flip 0.2)))
    A
   (and C (eq? B B-val))))

(hist (samples true) "A if B is true.")
(hist (samples false) "A if B is false.")
~~~~

~~~~ {.norun test_id="9"}
(query
  (define a ...)
  (define b ...)
  ...
  (define data (... a... b...))

  b

  (and (equal? data some-value) (equal? a some-other-value)))
~~~~

~~~~ {test_id="10"}
(define (take-sample)
  (rejection-query
    (define A (random-integer 10))
    (define B (random-integer 10))

    (pair A B)

    (equal? (+ A B) 9)))

(define samples (repeat 500 take-sample))

(scatter samples "A and B, conditioned on A + B = 9")
(hist samples "A, B")
~~~~

~~~~ {test_id="11"}
(define (take-sample)
  (rejection-query
    (define A (random-integer 10))
    (define B (random-integer 10))

    (pair A B)

    (equal? A B)))

(define samples (repeat 500 take-sample))

(scatter samples "A and B, conditioned on A = B")
(hist samples "A, B")
~~~~

~~~~ {test_id="12"}
(define samples
  (mh-query 200 100
    (define smokes (flip 0.2))

    (define lung-disease (or (flip 0.001) (and smokes (flip 0.1))))
    (define cold (flip 0.02))

    (define cough (or (and cold (flip 0.5)) (and lung-disease (flip 0.5)) (flip 0.001)))
    (define fever (or (and cold (flip 0.3)) (flip 0.01)))
    (define chest-pain (or (and lung-disease (flip 0.2)) (flip 0.01)))
    (define shortness-of-breath (or (and lung-disease (flip 0.2)) (flip 0.01)))

     smokes

     (and cough chest-pain shortness-of-breath)
  )
)
(hist samples "smokes")
~~~~

~~~~ {test_id="13"}
(define samples
  (mh-query 500 100
    (define smokes (flip 0.2))

    (define lung-disease (or (flip 0.001) (and smokes (flip 0.1))))
    (define cold (flip 0.02))

    (define cough (or (and cold (flip 0.5)) (and lung-disease (flip 0.5)) (flip 0.001)))
    (define fever (or (and cold (flip 0.3)) (flip 0.01)))
    (define chest-pain (or (and lung-disease (flip 0.2)) (flip 0.01)))
    (define shortness-of-breath (or (and lung-disease (flip 0.2)) (flip 0.01)))

     smokes

     (and lung-disease
          (and cough chest-pain shortness-of-breath)
      )
  )
)
(hist samples "smokes")
~~~~

~~~~ {test_id="14"}
(define samples
  (mh-query 500 100
    (define smokes (flip 0.2))

    (define lung-disease (or (flip 0.001) (and smokes (flip 0.1))))
    (define cold (flip 0.02))

    (define cough (or (and cold (flip 0.5)) (and lung-disease (flip 0.5)) (flip 0.001)))
    (define fever (or (and cold (flip 0.3)) (flip 0.01)))
    (define chest-pain (or (and lung-disease (flip 0.2)) (flip 0.01)))
    (define shortness-of-breath (or (and lung-disease (flip 0.2)) (flip 0.01)))

   (list cold lung-disease)

   cough))
   
(hist (map first samples) "cold")
(hist (map second samples) "lung-disease")
(hist samples "cold, lung-disease")
~~~~

~~~~ {test_id="15"}
(define samples
  (mh-query 500 100
    (define smokes (flip 0.2))

    (define lung-disease (or (flip 0.001) (and smokes (flip 0.1))))
    (define cold (flip 0.02))

    (define cough (or (and cold (flip 0.5)) (and lung-disease (flip 0.5)) (flip 0.001)))
    (define fever (or (and cold (flip 0.3)) (flip 0.01)))
    (define chest-pain (or (and lung-disease (flip 0.2)) (flip 0.01)))
    (define shortness-of-breath (or (and lung-disease (flip 0.2)) (flip 0.01)))

   (list cold lung-disease)

   (and cough (not cold))))
   
(hist (map first samples) "cold")
(hist (map second samples) "lung-disease")
(hist samples "cold, lung-disease")
~~~~

~~~~ {test_id="16"}
(define samples
  (mh-query 500 100
    (define smokes (flip 0.2))

    (define lung-disease (or (flip 0.001) (and smokes (flip 0.1))))
    (define cold (flip 0.02))

    (define cough (or (and cold (flip 0.5)) (and lung-disease (flip 0.5)) (flip 0.001)))
    (define fever (or (and cold (flip 0.3)) (flip 0.01)))
    (define chest-pain (or (and lung-disease (flip 0.2)) (flip 0.01)))
    (define shortness-of-breath (or (and lung-disease (flip 0.2)) (flip 0.01)))

   (list cold lung-disease)

   (and cough cold)))
   
(hist (map first samples) "cold")
(hist (map second samples) "lung-disease")
(hist samples "cold, lung-disease")
~~~~

~~~~ {test_id="17"}
(define samples
  (mh-query 1000 10

   (define exam-fair (flip .8))
   (define does-homework (flip .8))

   (define pass? (flip (if exam-fair
                           (if does-homework 0.9 0.4)
                           (if does-homework 0.6 0.2))))

   (list does-homework exam-fair)

   (not pass?)))

(hist samples "Joint: Student Does Homework?, Exam Fair?")
(hist (map first samples) "Student Does Homework")
(hist (map second samples) "Exam Fair")
~~~~

~~~~ {test_id="18"}
(define samples
  (mh-query 1000 10

   (define exam-fair-prior .8)
   (define does-homework-prior .8)
   (define exam-fair? (mem (lambda (exam) (flip exam-fair-prior))))
   (define does-homework? (mem (lambda (student) (flip does-homework-prior))))

   (define (pass? student exam) (flip (if (exam-fair? exam)
                                          (if (does-homework? student) 0.9 0.4)
                                          (if (does-homework? student) 0.6 0.2))))

   (list (does-homework? 'bill) (exam-fair? 'exam1))

   (not (pass? 'bill 'exam1))))

(hist samples "Joint: Student Does Homework?, Exam Fair?")
(hist (map first samples) "Student Does Homework")
(hist (map second samples) "Exam Fair")
~~~~

~~~~ {.norun test_id="19"}
(and (not (pass? 'bill 'exam1)) (not (pass? 'bill 'exam2)))

(and (not (pass? 'bill 'exam1))
          (not (pass? 'mary 'exam1))
          (not (pass? 'tim 'exam1)))

 (and (not (pass? 'bill 'exam1)) (not (pass? 'bill 'exam2))
       (not (pass? 'mary 'exam1))
       (not (pass? 'tim 'exam1)))

  (and (not (pass? 'bill 'exam1))
       (not (pass? 'mary 'exam1)) (pass? 'mary 'exam2) (pass? 'mary 'exam3) (pass? 'mary 'exam4) (pass? 'mary 'exam5)
       (not (pass? 'tim 'exam1)) (pass? 'tim 'exam2) (pass? 'tim 'exam3) (pass? 'tim 'exam4) (pass? 'tim 'exam5))

  (and (not (pass? 'bill 'exam1))
       (pass? 'mary 'exam1)
       (pass? 'tim 'exam1))

  (and (not (pass? 'bill 'exam1))
       (pass? 'mary 'exam1) (pass? 'mary 'exam2) (pass? 'mary 'exam3) (pass? 'mary 'exam4) (pass? 'mary 'exam5)
       (pass? 'tim 'exam1) (pass? 'tim 'exam2) (pass? 'tim 'exam3) (pass? 'tim 'exam4) (pass? 'tim 'exam5))

  (and (not (pass? 'bill 'exam1)) (not (pass? 'bill 'exam2))
       (pass? 'mary 'exam1) (pass? 'mary 'exam2) (pass? 'mary 'exam3) (pass? 'mary 'exam4) (pass? 'mary 'exam5)
       (pass? 'tim 'exam1) (pass? 'tim 'exam2) (pass? 'tim 'exam3) (pass? 'tim 'exam4) (pass? 'tim 'exam5))

  (and (not (pass? 'bill 'exam1)) (not (pass? 'bill 'exam2)) (pass? 'bill 'exam3) (pass? 'bill 'exam4) (pass? 'bill 'exam5)
       (not (pass? 'mary 'exam1)) (not (pass? 'mary 'exam2)) (not (pass? 'mary 'exam3)) (not (pass? 'mary 'exam4)) (not (pass? 'mary 'exam5))
       (not (pass? 'tim 'exam1)) (not (pass? 'tim 'exam2)) (not (pass? 'tim 'exam3)) (not (pass? 'tim 'exam4)) (not (pass? 'tim 'exam5)))
~~~~

~~~~ {test_id="20"}
(define samples
  (mh-query 100 100

    (define blicket (mem (lambda (block) (flip 0.2))))
    (define (power block) (if (blicket block) 0.9 0.05))

    (define (machine blocks)
      (if (null? blocks)
          (flip 0.05)
          (or (flip (power (first blocks)))
              (machine (rest blocks)))))

    (blicket 'A)

    (machine (list 'A 'B))))

(hist samples "Is A a blicket?")
~~~~

~~~~ {test_id="21"}
(define observed-luminance 3.0)

(define samples
   (mh-query
    1000 10

    (define reflectance (gaussian 1 1))
    (define illumination (gaussian 3 0.5))
    (define luminance (* reflectance illumination))

    reflectance

    (= luminance (gaussian observed-luminance 0.1))))

(display (list "Mean reflectance:" (mean samples)))
(hist samples "Reflectance")
~~~~

~~~~ {test_id="22" .skip}
(define observed-luminance 3.0)

(define samples
   (mh-query
    1000 10

    (define reflectance (gaussian 1 1))
    (define illumination (gaussian 3 0.5))
    (define luminance (* reflectance illumination))

    reflectance

    (condition (= luminance (gaussian observed-luminance 0.1)))
    (condition (= illumination (gaussian 0.5  0.1)))))

(display (list "Mean reflectance:" (mean samples)))
(hist samples "Reflectance")
~~~~

~~~~ {test_id="23"}
(define a (flip))
(define b (flip))
(define c (flip (if (and a b) 0.8 0.5)))
~~~~

~~~~ {test_id="24"}
(define a (flip))
(define b (flip (if a 0.9 0.2)))
(define c (flip (if b 0.7 0.1)))
~~~~

~~~~ {test_id="25"}
(define a (flip))
(define b (flip (if a 0.9 0.2)))
(define c (flip (if a 0.7 0.1)))
~~~~

~~~~ {test_id="26"}
(define a (flip 0.6))
(define c (flip 0.1))
(define z (uniform-draw (list a c)))
(define b (if z 'foo 'bar))
~~~~

~~~~ {test_id="27"}
(define exam-fair-prior .8)
(define does-homework-prior .8)
(define exam-fair? (mem (lambda (exam) (flip exam-fair-prior))))
(define does-homework? (mem (lambda (student) (flip does-homework-prior))))

(define (pass? student exam) (flip (if (exam-fair? exam)
                                       (if (does-homework? student) 0.9 0.5)
                                       (if (does-homework? student) 0.2 0.1))))

(define a (pass? 'alice 'history-exam))
(define b (pass? 'bob 'history-exam))
~~~~

~~~~ {test_id="28"}
;; use rejection-query and cosh for inference
(rejection-query
...)
~~~~
