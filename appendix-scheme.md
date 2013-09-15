% Appendix: Scheme basics

The $\lambda$-calculus formalizes the notion of computation using *functions*. Computation is performed in the $\lambda$-calculus by applying functions to arguments to compute results.  Function application in Church looks like this:

~~~~ {.bher}
(+ 1 1)
~~~~

Here we see the function `+` applied to two arguments: `1` and `1`. Note that in Church the name of the function comes *first* and the parentheses go outside the function. This is sometimes called *Polish notation*. If you run this simple program above you will see the resulting *value* of this function application.  Since `+` is a *deterministic* function you will always get the same return value if you run the program many times.

# Building More Complex Programs

A Church program is syntactically composed of nested *expressions.* Roughly speaking an expression is either a simple value, or anything between parentheses `()`.  In a deterministic LISP, like Scheme, all expressions without [free variables](http://en.wikipedia.org/wiki/Free_variables_and_bound_variables) have a single fixed value which is computed by a process known as *evaluation*. For example, consider the following more complex expression:

~~~~
(and true (or true false))
~~~~

This expression has an *operator*, the logical function `and`, and *arguments*, `true` and the *subexpression* which is itself an application of `or`. When reasoning about evaluation, it is best to think of evaluating the subexpressions first, then applying the function to the return values of its arguments. In this example `or` is first applied to `true` and `false`, returning true, then `and` is applied to `true` and the subexpression's return value, again returning true.

We often want to name objects in our programs so that they can be reused. This can be done with the `define` statement. `define` looks like this:

<pre>(define variable-name expression)</pre>

`variable-name` is a *symbol* that is bound to the value that `expression` evaluates to. When variables themselves are evaluated they return the value that they have been bound to:

~~~~
(define some-variable 10) ;assign the value 10 to the variable some-variable

some-variable ;when this is evaluated it looks up and returns the value 10
~~~~


# Lists and symbols

There are several special kinds of values in Church. One kind of special value is a *list*: a sequence of other values. Lists can be built using the `list` function and manipulated using functions such as `first` (get the first element in a list) and `rest` (get the rest of the list after the first element).

~~~~
(first ;get the first element of
  (rest  ;get non-first elements of
    (list "this" "is" "a" "list"))) ;build a list!
~~~~
Experiment with different combinations of these functions. What happens when you apply `list` to the result of `list`? (In this program we have used another kind of special value: a string, which is anything between double-quotes.)

Lists are a fundamental data structure in LISP-like languages. In fact, a Church program is just a list -- the list of expressions comprising the program.

Sometimes we wish to treat a piece of Church code "literally", that is, to view it as a value rather than an expression. We can do this using a special `quote` operation (which can also be written with a single quote: `(quote ...)` is the same as `'...`):

~~~~
(define quoted-value '(1 2 3))
(first quoted-value)
~~~~
What is the value of `quoted-value`? What happens if you remove the quote? Why?

If we quote the name of a variable, what we get back is a symbol: a value which is the literal variable, rather than the value it is bound to. A symbol is just an identifier; it will be equal to itself, but to no other symbol:

~~~~
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
The ability to make new symbols as needed is a crucial feature in building models that reason over unbounded worlds, as we'll see below.

# Building Functions: `lambda`

The power of lambda calculus as a model of computation comes from the ability to make new functions. To do so, we use the `lambda` primitive. For example, we can construct a function that doubles any number it is applied to:

~~~~
(define double (lambda (x) (+ x x)))

(double 3)
~~~~

The general form of a lambda expression is:
 (lambda arguments body)
The first sub-expression of the lambda, the arguments, is a list of symbols that tells us what the inputs to the function will be called; the second sub-expression, the body, tells us what to do with these inputs. The value which results from a lambda expression is called a *compound procedure*. When a compound procedure is applied to input values (e.g. when `double` was applied to `3`) we imagine identifying (also called *binding*) the argument variables with these inputs, then evaluating the body. As another simple example, consider this function:

![](images/Sicp-lambda-diagram.png)


In lambda calculus we can build procedures that manipulate any kind of value -- even other procedures. Here we define a function `twice` which takes a procedure and returns a new procedure that applies the original twice:

~~~~
(define double (lambda (x) (+ x x)))

(define twice (lambda (f) (lambda (x) (f (f x)))))

((twice double) 3)
~~~~

This ability to make *higher-order* functions is what makes the lambda calculus a universal model of computation.

Since we often want to assign names to functions, `(define (foo x) ...)` is short ("syntactic sugar") for  `(define foo (lambda (x) ...))`. For example we could have written the previous example:

~~~~
(define (double x) (+ x x))

(define (twice f) (lambda (x) (f (f x))))

((twice double) 3)
~~~~




# Useful Higher-Order Functions

In the above example we have used several useful utility functions. `map` is a higher-order function that takes a procedure (here built using `lambda`) and applies it to each element of a list (here the list of team members). After getting the list of how much each team member is pulling, we want to add them up. The procedure `+` expects to be applied directly to some numbers, as in `(+ 1 2 3 4)`, not to a list of numbers; `(+ (1 2 3 4))` would produce an error.  So we use the higher-order function `apply`, which applies a procedure to a list as if the list were direct arguments to the procedure.  The standard functions `sum` and `product` can be easily defined in terms of `(apply + ...)` and `(apply * ...)`, respectively.  Just to illustrate this:

~~~~
(define my-list '(3 5 2047))
(list "These numbers should all be equal:" (sum my-list) (apply + my-list) (+ 3 5 2047))
~~~~

Higher-order functions like `repeat`, `map`, `apply` (or `sum`) can be quite useful.  Here we use them to visualize the number of heads we expect to see if we flip a weighted coin (weight = 0.8) 10 times.  We'll repeat this experiment 1000 times and then use `hist` to visualize the results.  Try varying the coin weight or the number of repetitions to see how the expected distribution changes.

~~~~
(define make-coin (lambda (weight) (lambda () (flip weight))))
(define coin (make-coin 0.8))

(define data (repeat 1000 (lambda () (sum (map (lambda (x) (if x 1 0)) (repeat 10 coin))))))
(hist data  "Distribution of coin flips")
~~~~

The `map` higher-order function can be used to map a function of more than one argument over multiple lists, element by element.  For example, here is the MATLAB "dot-star" function (or ".*") written using `map`:

~~~~
(define dot-star (lambda (v1 v2) (map * v1 v2)))
(dot-star '(1 2 3) '(4 5 6))
~~~~



# Excercises



