~~~~ {test_id="0"}
(define (sequence) (repeat 10 flip))

(define sequences (repeat 1000 sequence))

(hist (map first sequences) "first flip")
(hist (map second sequences) "second flip")
~~~~

~~~~ {test_id="1"}
(define (sequences first-val)
  (mh-query
   1000 10
   (define s (repeat 10 flip))
   (second s)
   (equal? (first s) first-val)))

(hist (sequences true)  "second if first is true")
(hist (sequences false) "second if first is false")
~~~~

~~~~ {test_id="2"}
(define (thunk) (multinomial '(chef omelet soup eat work bake stop)
                             '(0.0032 0.4863 0.0789 0.0675 0.1974 0.1387 0.0277)))

(repeat 10 thunk)
~~~~

~~~~ {test_id="3"}
(define word-probs (if (flip)
'(0.0032 0.4863 0.0789 0.0675 0.1974 0.1387 0.0277)
'(0.0699 0.1296 0.0278 0.4131 0.1239 0.2159 0.0194)))

(define (thunk) (multinomial '(chef omelet soup eat work bake stop)
                             word-probs))

(repeat 10 thunk)
~~~~

~~~~ {test_id="4"}
(define (sequences first-val)
  (mh-query
   1000 10
   (define prob (if (flip) 0.2 0.7))
   (define (myflip) (flip prob))
   (define s (repeat 10 myflip))
   (second s)
   (equal? (first s) first-val)))
 
(hist (sequences true)  "second if first is true")
(hist (sequences false) "second if first is false")
~~~~

~~~~ {.idealized test_id="5"}
(define latent (latent-prior))

(define (thunk) (observe latent))

(repeat 10 thunk)
~~~~

~~~~ {test_id="6"}
(define (markov prev-obs n)
  (if (= n 0)
      '()
      (let ((next-obs (if prev-obs (flip 0.9) (flip 0.1))))
        (pair next-obs (markov next-obs (- n 1))))))

(markov true 10)
~~~~

~~~~ {test_id="7"}
(define vocabulary '(chef omelet soup eat work bake stop))

(define (sample-words last-word)
  (if (equal? last-word 'stop)
      '()
      (pair last-word
            (let ((next-word 
                   (case last-word
                         (('start) (multinomial vocabulary '(0.0032 0.4863 0.0789 0.0675 0.1974 0.1387 0.0277)))
                         (('chef)  (multinomial vocabulary '(0.0699 0.1296 0.0278 0.4131 0.1239 0.2159 0.0194)))
                         (('omelet)(multinomial vocabulary '(0.2301 0.0571 0.1884 0.1393 0.0977 0.1040 0.1831)))  
                         (('soup)  (multinomial vocabulary '(0.1539 0.0653 0.0410 0.1622 0.2166 0.2664 0.0941)))
                         (('eat)   (multinomial vocabulary '(0.0343 0.0258 0.6170 0.0610 0.0203 0.2401 0.0011)))
                         (('work)  (multinomial vocabulary '(0.0602 0.2479 0.0034 0.0095 0.6363 0.02908 0.0133)))
                         (('bake)  (multinomial vocabulary '(0.0602 0.2479 0.0034 0.0095 0.6363 0.02908 0.0133)))
                         (else 'error))))
              (sample-words next-word)))))


(sample-words 'start) 
~~~~

~~~~ {test_id="8"}
(define vocabulary '(chef omelet soup eat work bake stop))
  
(define word->distribution
  (mem (lambda (word) (dirichlet (make-list (length vocabulary) 1)))))
  
(define (transition word)
  (multinomial vocabulary (word->distribution word)))
  
(define (sample-words last-word)
  (if (equal? last-word 'stop)
      '()
      (pair last-word (sample-words (transition last-word)))))

(sample-words 'start)
~~~~

~~~~ {test_id="9"}
(define (samples sequence)
  (mh-query
   100 10
   
   (define isfair (flip))
   
   (define (coin) (flip (if isfair 0.5 0.2)))
   
   
   isfair
   
   (condition (equal? sequence (repeat 5 coin)))))


(hist (samples (list false false true false true)) "00101 is fair?")
(hist (samples (list false false false false false)) "00000 is fair?")
~~~~

~~~~ {test_id="10"}
(define (samples sequence)
  (mh-query
   100 10
   
   (define isfair (flip))
   
   (define (transition prev) (flip (if isfair 
                                       0.5 
                                       (if prev 0.1 0.9))))
   
   (define (markov prev n)
     (if (= 0 n)
         '()
         (let ((next (transition prev)))
           (pair next (markov next (- n 1))))))
   
   
   isfair
   
   (condition (equal? sequence (markov (flip) 5)))))


(hist (samples (list false true false true false)) "01010 is fair?")
(hist (samples (list true false false true false)) "01100 is fair?")
~~~~

~~~~ {test_id="11"}
(define states '(s1 s2 s3 s4 s5 s6 s7 s8 stop))

(define vocabulary '(chef omelet soup eat work bake))


(define state->observation-model
  (mem (lambda (state) (dirichlet (make-list (length vocabulary) 1)))))

(define (observation state)
  (multinomial vocabulary (state->observation-model state)))

(define state->transition-model
  (mem (lambda (state) (dirichlet (make-list (length states) 1)))))

(define (transition state)
  (multinomial states (state->transition-model state)))


(define (sample-words last-state)
  (if (equal? last-state 'stop)
      '()
      (pair (observation last-state) (sample-words (transition last-state)))))

(sample-words 'start)
~~~~

~~~~ {test_id="12"}
(define (terminal t) (lambda () t))

(define D (lambda ()
            (map sample
                 (multinomial
                  (list (list (terminal 'the) ) 
                        (list (terminal 'a)))
                  (list (/ 1 2) (/ 1 2))))))
(define N (lambda ()
            (map sample 
                 (multinomial
                  (list (list (terminal 'chef)) 
                        (list (terminal 'soup)) 
                        (list (terminal 'omelet)))
                  (list (/ 1 3) (/ 1 3) (/ 1 3))))))
(define V (lambda ()
            (map sample
                 (multinomial
                  (list (list (terminal 'cooks)) 
                        (list (terminal 'works)))
                  (list (/ 1 2) (/ 1 2))))))                
(define A (lambda ()
            (map sample
                 (multinomial
                  (list (list (terminal 'diligently)))
                  (list (/ 1 1))))))
(define AP (lambda ()
             (map sample
                  (multinomial
                   (list (list A))
                   (list (/ 1 1))))))
(define NP (lambda ()
             (map sample
                  (multinomial
                   (list (list D N))
                   (list (/ 1 1))))))
(define VP (lambda ()
             (map sample
                  (multinomial
                   (list (list V AP) 
                         (list V NP))
                   (list (/ 1 2) (/ 1 2))))))
(define S (lambda ()
            (map sample 
                 (multinomial
                  (list (list NP VP))
                  (list (/ 1 1))))))
(S)
~~~~

~~~~ {test_id="13"}
(define VP (lambda ()
             (map sample
                  (multinomial
                   (list (list V AP) 
                         (list V NP))
                   (list (/ 1 2) (/ 1 2))))))
~~~~

~~~~ {test_id="14"}
(define (unfold current transition stop?)
  (if (stop? current)
      '()
      (pair current (unfold (transition current) transition stop?))))
~~~~

~~~~ {test_id="15"}
(define (unfold current transition stop?)
   (if (stop? current)
       '()
       (pair current (unfold (transition current) transition stop?))))

(define vocabulary '(chef omelet soup eat work bake stop))
  
(define word->distribution
  (mem (lambda (word) (dirichlet (make-list (length vocabulary) 1)))))
  
(define (transition word)
  (multinomial vocabulary (word->distribution word)))

(define (stop? word) (equal? word 'stop))

(unfold 'start transition stop?)
~~~~

~~~~ {test_id="16"}
(define (terminal t) (list 'terminal t))

(define (unwrap-terminal t) (second t))

(define (tree-unfold transition start-symbol)
  (if (terminal? start-symbol)
      (unwrap-terminal start-symbol)   
      (pair start-symbol 
            (map (lambda (symbol) (tree-unfold  transition symbol)) (transition start-symbol)))))

(define (terminal? symbol)
  (if (list? symbol)
      (equal? (first symbol) 'terminal)
      false))

(define (transition nonterminal)
  (case nonterminal
        (('D) (multinomial(list (list (terminal 'the)) 
                                (list (terminal 'a)))
                          (list (/ 1 2) (/ 1 2))))
        (('N) (multinomial (list (list (terminal 'chef))
                                 (list (terminal 'soup)) 
                                 (list (terminal 'omelet)))
                           (list (/ 1 3) (/ 1 3) (/ 1 3))))
        (('V) (multinomial (list (list (terminal 'cooks)) 
                                 (list (terminal 'works)))
                           (list (/ 1 2) (/ 1 2))))                
        (('A) (multinomial (list (list (terminal 'diligently)))
                           (list (/ 1 1))))
        (('AP) (multinomial (list (list 'A))
                            (list (/ 1 1))))
        (('NP) (multinomial (list (list 'D 'N))
                            (list (/ 1 1))))
        (('VP) (multinomial (list (list 'V 'AP) 
                                  (list 'V 'NP))
                            (list (/ 1 2) (/ 1 2))))
        (('S) (multinomial (list (list 'NP 'VP))
                           (list (/ 1 1))))
        (else 'error)))


(tree-unfold transition 'S)
~~~~
