~~~~ {.bher test_id="0"}
(+ 1 1)
~~~~

~~~~ {test_id="1"}
(+ 3.1)
~~~~

~~~~ {test_id="2"}
(+ 3.1 2.7)
~~~~

~~~~ {test_id="3"}
(+ 3.1 2.7 4 5 6 7 8 9 10 11 12 13)
~~~~

~~~~ {test_id="4"}
(and true (or true false))
~~~~

~~~~ {test_id="5"}
;this line is a comment
(if
 (= 1 2)         ;the condition of "if"
 100                ;the consequent ("then")
 (or true false) ;the alternate ("else")
)
~~~~

~~~~ {test_id="6"}
(+ (* 3
      (+ (* 2 4)
         (+ 3 5)))
   (+ (- 10 7)
      6))
~~~~

~~~~ {.norun test_id="7"}
(define variable-name expression)
~~~~

~~~~ {test_id="8"}
(define some-variable 10) ;assign the value 10 to the variable some-variable

some-variable ;when this is evaluated it looks up and returns the value 10
~~~~

~~~~ {test_id="9"}
(first ;get the first element of
  (rest  ;get non-first elements of
    (list "this" "is" "a" "list"))) ;build a list!
~~~~

~~~~ {test_id="10"}
(define quoted-value '(1 2 3))
(first quoted-value)
~~~~

~~~~ {test_id="11"}
(list (+ 1 2) 2)
~~~~

~~~~ {test_id="12"}
'( (+ 1 2) 3)
~~~~

~~~~ {test_id="13"}
(define foo 1)
(list
 ;a symbol is equal to itself
 (equal? 'foo 'foo)
 ;but not equal to any other symbol
 (equal? 'foo 'bar)
 ;or value
 (equal? 'foo 2)
 ;even the value that it is bound to as a variable
 (equal? 'foo foo))
~~~~

~~~~ {test_id="14"}
(append '(1 2 3) '(4 5) '(6 7))
~~~~

~~~~ {test_id="15"}
'( 1 2 3 (4.1 4.2 4.3) 5)
~~~~

~~~~ {test_id="16"}
(define double (lambda (x) (+ x x)))

(double 3)
~~~~

~~~~ {test_id="17"}
(define double (lambda (x) (+ x x)))

(define twice (lambda (f) (lambda (x) (f (f x)))))

((twice double) 3)
~~~~

~~~~ {test_id="18"}
(define (double x) (+ x x))

(define (twice f) (lambda (x) (f (f x))))

((twice double) 3)
~~~~

~~~~ {test_id="19"}
(let ((a (+ 1 1)))
  (+ a 1))
~~~~

~~~~ {test_id="20"}
(define a 1)
(case a
      ((1) "hi")
      ((2) "bye")
      (else "error"))
~~~~

~~~~ {test_id="21"}
(define a 1)
(if (equal? a 1)
    "hi"
    (if (equal? a 2)
        "bye"
        "error"))
~~~~

~~~~ {test_id="22"}
(map (lambda (x) (> x 0)) '(1 -3 2 0))
~~~~

~~~~ {test_id="23"}
(define dot-star (lambda (v1 v2) (map * v1 v2)))
(dot-star '(1 2 3) '(4 5 6))
~~~~

~~~~ {test_id="24"}
(define my-list '(3 5 2047))
(list "These numbers should all be equal:" (sum my-list) (apply + my-list) (+ 3 5 2047))
~~~~

~~~~ {test_id="25"}
; comments are preceded by semicolons 
(+ 1 2)
~~~~

~~~~ {test_id="26"}
~~~~

~~~~ {test_id="27"}
~~~~

~~~~ {test_id="28"}
~~~~

~~~~ {test_id="29"}
~~~~

~~~~ {test_id="30"}
(/ 1 (+ 4 5))
~~~~

~~~~ {test_id="31"}
(/ 1
   (*
    (+ 2 3)
    (- 4 6)))
~~~~

~~~~ {.shouldfail test_id="32"}
(4 + 6)
~~~~

~~~~ {test_id="33"}
(define (f ...) ...)
(f 5 3)
~~~~

~~~~ {test_id="34"}
(define f (lambda (...) ... ))
(f 5 3)
~~~~

~~~~ {test_id="35"}
(define (h x y) (+ x (* 2 y)))
~~~~

~~~~ {test_id="36"}
(define (h x y) (+ x (* 2 y)))
~~~~

~~~~ {test_id="37"}
(define (bigger? a b)
  (if (> a b)
      'yes
      'no))

(bigger? 3 4)
~~~~

~~~~ {test_id="38"}
(define (f x) (if (> x 5)
                  'Z
                  (if (> x 2)
                      'R
                      'M)))
~~~~

~~~~ {test_id="39"}
(define (use-thing1-on-other-things thing1 thing2 thing3)
  (thing1 thing2 thing3))

(use-thing1-on-other-things * 3 4)
~~~~

~~~~ {test_id="40"}
(define (f g x y) ...)
~~~~

~~~~ {.norun test_id="41"}
(define (bigger-than-factory num) (lambda (x) (> x num)))
~~~~

~~~~ {test_id="42"}
(define (Q f g) (lambda (x y) (> (f x y) (g x y))))
~~~~

~~~~ {test_id="43"}
(define x 3)
(define y 9)
(pair x y)
~~~~

~~~~ {test_id="44"}
(pair 'a
      (pair '6
            (pair 'b
                  (pair 'c
                        (pair 7
                              (pair 'd '()))))))
~~~~

~~~~ {test_id="45"}
(list 'a 6 'b 'c 7 'd)
~~~~

~~~~ {test_id="46"}
'(a 6 b c 7 d)
~~~~

~~~~ {.shouldfail test_id="47"}
(3 4 7 8)
~~~~

~~~~ {test_id="48"}
~~~~

~~~~ {test_id="49"}
~~~~

~~~~ {test_id="50"}
;; run code here
~~~~

~~~~ {test_id="51"}
(define (square x) (* x x))
(map square '(1 2 3 4 5))
~~~~

~~~~ {test_id="52"}
(define (my-product lst)
  (fold

   ;; function
   (lambda (list-item cumulative-value) (* list-item cumulative-value))

   ;; initial value
   1

   ;; list
   lst))

(my-product '(1 2 3 4 5))
~~~~

~~~~ {test_id="53"}
(define (square x) (* x x))
(define (my-sum-squares lst) ...)
(my-sum-squares '(1 2 3 4 5))
~~~~

~~~~ {test_id="54"}
(define (square x) (* x x))
(define (my-sum-squares lst) ...)
(my-sum-squares '(1 2 3 4 5))
~~~~

~~~~ {test_id="55"}
(define (my-length lst)
  (if (null? lst)
      0
      (+ 1 (my-length (rest lst)))))

(my-length '(a b c d e))
~~~~

~~~~ {test_id="56"}
; returns the larger of a and b.
(define (bigger a b) (if (> a b) a b))

(define (my-max lst)
  (if (= (length lst) 1)
      (first lst)
      ...))

(my-max '(1 2 3 6 7 4 2 9 8 -5 0 12 3))
~~~~

~~~~ {test_id="57"}
(define (bigger a b) (if (> a b) a b))

(define (my-max lst) 
  (fold
   ...))

(my-max '(1 2 3 6 7 4 2 9 8 -5 0 12 3))
~~~~
