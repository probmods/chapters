~~~~ {.jschurch test_id="0"}
(define (residuals probs)
  (if (null? probs)
      '()
      (pair (/ (first probs) (sum probs))
            (residuals (rest probs)))))
~~~~

~~~~ {.bher test_id="1"}
(define (residuals probs)
  (if (null? probs)
      '()
      (pair (/ (first probs) (sum probs))
            (residuals (rest probs)))))

(define (discrete resid)
  (if (null? resid)
      '()
      (if (flip (first resid))
          1
          (+ 1 (discrete (rest resid))))))

(hist (repeat 5000 (lambda () (discrete (residuals '(0.2 0.3 0.1 0.4))))) "discrete?")
~~~~

~~~~ {.mit-church test_id="2"}
(define (pick-a-stick sticks J)
  (if (flip (sticks J))
      J
      (pick-a-stick sticks (+ J 1))))

(define (make-sticks alpha)
  (let ((sticks (mem (lambda (x) (first (beta 1.0 alpha))))))
    (lambda () (pick-a-stick sticks 1))))

(define my-sticks (make-sticks 1))

(hist (repeat 1000 my-sticks) "Dirichlet Process")
~~~~

~~~~ {.mit-church test_id="3"}
(define (pick-a-stick sticks J)
  (if (flip (sticks J))
      J
      (pick-a-stick sticks (+ J 1))))

(define (make-sticks alpha)
  (let ((sticks (mem (lambda (x) (first (beta 1.0 alpha))))))
    (lambda () (pick-a-stick sticks 1))))

(define (DPthunk alpha base-dist)
  (let ((augmented-proc (mem (lambda (stick-index) (base-dist))))
        (DP (make-sticks alpha)))
    (lambda () (augmented-proc (DP)))))


(define memoized-gaussian (DPthunk 1.0 (lambda () (gaussian 0.0 1.0))))
(hist (repeat 1000 (lambda () (gaussian 0.0 1.0))) 100 "Base Distribution")
(hist (repeat 1000 memoized-gaussian) "Dirichlet Process")
~~~~

~~~~ {.mit-church test_id="4"}
(define (pick-a-stick sticks J)
  (if (flip (sticks J))
      J
      (pick-a-stick sticks (+ J 1))))

(define (make-sticks alpha)
  (let ((sticks (mem (lambda (x) (first (beta 1.0 alpha))))))
    (lambda () (pick-a-stick sticks 1))))

(define (DPmem alpha base-dist)
  (let ((augmented-proc (mem (lambda (args stick-index) (apply base-dist args))))
        (DP (mem (lambda (args) (make-sticks alpha)))))
    (lambda argsin
      (let ((stick-index (sample (DP argsin))))
        (augmented-proc argsin stick-index)))))

(define (geometric p)
  (if (flip p)
      0
      (+ 1 (geometric p))))

(define memoized-gaussian (DPmem 1.0 gaussian))

(hist (repeat 1000 (lambda () (gaussian 0.0 1.0))) 100 "Base Distribution")
(hist (repeat 1000 (lambda () (memoized-gaussian 0.0 1.0))) "Dirichlet Process")
~~~~

~~~~ {.mit-church test_id="5"}
(define memoized-normal (DPmem 1.0 (lambda () (gaussian 0 1.0))))

(hist (repeat 100 memoized-normal) "DPmem normal")
'done
~~~~

~~~~ {.mit-church test_id="6"}
(define memoized-gaussian (DPmem 1.0 gaussian))

(hist (repeat 1000 (lambda () (gaussian 0.0 1.0))) 100 "Base Distribution")
(hist (repeat 1000 (lambda () (memoized-gaussian 0.0 1.0))) "Dirichlet Process")
~~~~

~~~~ {.mit-church test_id="7"}
(define colors '(blue green red))

(define samples
 (mh-query
   200 100

   (define phi (dirichlet '(1 1 1)))
   (define alpha 0.1)
   (define prototype (map (lambda (w) (* alpha w)) phi))

   (define bag->prototype (mem (lambda (bag) (dirichlet prototype))))

   ;;the prior distribution on bags is simply a DPmem of gensym:
   (define get-bag (DPmem 1.0 gensym))

   ;;each observation comes from one of the bags:
   (define obs->bag (mem (lambda (obs-name) (get-bag))))

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

~~~~ {.mit-church test_id="8"}
(define reusable-categories (DPmem 1.0 gensym))

(repeat 20 reusable-categories)
~~~~

~~~~ {.mit-church test_id="9"}
(define class-distribution (DPmem 1.0 gensym))

(define object->class
  (mem (lambda (object) (class-distribution))))

(define class->gaussian-parameters
  (mem (lambda (class) (list  (gaussian 65 10) (gaussian 0 8)))))

(define (observe object)
  (apply gaussian (class->gaussian-parameters (object->class object))))

(map observe '(tom dick harry bill fred))
~~~~

~~~~ {.mit-church test_id="10"}
(define phones '(a e i o u k t p g d b s th f))
(define phone-weights (dirichlet (make-list (length phones) 1)))

(define num-words 10)

(define (sample-phone)
  (multinomial phones phone-weights))

(define (sample-phone-sequence)
  (repeat (poisson 3.0) sample-phone))

(define sample-word
  (DPmem 1.0
         (lambda ()
           (sample-phone-sequence))))

(define (sample-utterance)
  (repeat num-words sample-word))

(sample-utterance)
~~~~

~~~~ {.mit-church test_id="11"}
(define samples
  (mh-query
   300 100

   (define class-distribution (DPmem 1.0 gensym))

   (define object->class
     (mem (lambda (object) (class-distribution))))

   (define classes->parameters
     (mem (lambda (class1 class2) (first (beta 0.5 0.5)))))

   (define (talks object1 object2)
     (flip (classes->parameters (object->class object1) (object->class object2))))

   (list (equal? (object->class 'tom) (object->class 'fred))
         (equal? (object->class 'tom) (object->class 'mary)))

   (and (talks 'tom 'fred)
        (talks 'tom 'jim)
        (talks 'jim 'fred)
        (not (talks 'mary 'fred))
        (not (talks 'mary 'jim))
        (not (talks 'sue 'fred))
        (not (talks 'sue 'tom))
        (not (talks 'ann 'jim))
        (not (talks 'ann 'tom))
        (talks 'mary 'sue)
        (talks 'mary 'ann)
        (talks 'ann 'sue)
        )))

(hist (map first samples) "tom and fred in same group?")
(hist (map second samples) "tom and mary in same group?")
~~~~

~~~~ {.mit-church test_id="12"}
(define kind-distribution (DPmem 1.0 gensym))

(define feature->kind
  (mem (lambda (feature) (kind-distribution))))

(define kind->class-distribution
  (mem (lambda (kind) (DPmem 1.0 gensym))))

(define feature-kind/object->class
  (mem (lambda (kind object) (sample (kind->class-distribution kind)))))

(define class->parameters
  (mem (lambda (object-class) (first (beta 1 1)))))

(define (observe object feature)
  (flip (class->parameters (feature-kind/object->class (feature->kind feature) object))))

(observe 'eggs 'breakfast)
~~~~

~~~~ {.mit-church test_id="13"}
(define top-level-category  (DPmem 1.0 gensym))

(define subordinate-category
  (DPmem 1.0
         (lambda (parent-category)
           (pair (gensym) parent-category))))

(define (sample-category) (subordinate-category (top-level-category)))

(repeat 10 sample-category)
~~~~

~~~~ {.mit-church test_id="14"}
(define possible-observations '(a b c d e f g))

(define top-level-category  (DPmem 1.0 gensym))
(define top-level-category->parameters
  (mem  (lambda (cat) (dirichlet (make-list (length possible-observations) 1.0)))))


(define subordinate-category
  (DPmem 1.0
         (lambda (parent-category)
           (pair (gensym) parent-category))))

(define subordinate-category->parameters
  (mem  (lambda (cat) (dirichlet (top-level-category->parameters (rest cat))))))


(define (sample-category) (subordinate-category (top-level-category)))

(define (sample-observation) (multinomial possible-observations (subordinate-category->parameters (sample-category))))

(repeat 10 sample-observation)
~~~~

~~~~ {test_id="15"}
(define base-measure (lambda () (poisson 20)))
(define top-level  (DPmem 10.0 base-measure))
(define sample-observation
  (DPmem 1.0
         (lambda (component)
           (top-level))))

(hist (repeat 1000 base-measure) "Draws from Base Measure (poisson 20)")
(hist (repeat 1000 (lambda () (sample-observation 'component1))) "Draws from Component DP 1")
(hist (repeat 1000 (lambda () (sample-observation 'component2))) "Draws from Component DP 2")
(hist (repeat 1000 (lambda () (sample-observation 'component3))) "Draws from Component DP 3")
(hist (repeat 1000 top-level) "Draws from Top Level DP")
'done
~~~~

~~~~ {test_id="16"}
(define top-level-category  (DPmem 1.0 gensym))

(define root-category (DPmem 10.0 (lambda () (poisson 20))))

(define sample-from-top-level-category  (DPmem 1.0 (lambda (cat) (root-category))))

(define subordinate-category
  (DPmem 1.0
         (lambda (parent-category)
           (pair (gensym) parent-category))))

(define (sample-category) (subordinate-category (top-level-category)))

(define sample-observation
  (DPmem 1.0
         (lambda (cat)
           (sample-from-top-level-category (rest cat)))))

(repeat 10
 (lambda ()
   (let ((category (sample-category)))
     (hist (repeat 1000 (lambda () (sample-observation category)))
           (string-append  "Top Level: " (symbol->string (rest category))
                           ", Subordinate Level: " (symbol->string (first category))))
     (hist (repeat 1000 (lambda () (sample-from-top-level-category (rest category))))
           (string-append  "Top Level: " (symbol->string (rest category))))
     (hist (repeat 1000 (lambda () (sample-observation category)))
           "Root Category"))))
'done
~~~~
