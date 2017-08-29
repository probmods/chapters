//FIXME: these can be re-written as js loops, since prob-js adds a loop counter to address... (ie. individuates lookup calls with same stack address.)

var sample = "(define (sample fn) (apply fn '()))";

//var repeat = "(define (repeat n fn) (if (> n 0) (pair (fn) (repeat (- n 1) fn)) ()))";

var map = "(define map (lambda x (let ((fn (first x)) (lists (rest x))) (if (null? (rest lists)) (if (null? (first lists)) () (pair (fn (first (first lists))) (map fn (rest (first lists))))) (if (apply or (map null? lists)) () (pair (apply fn (map first lists)) (apply map (pair fn (map rest lists)))))))))";

//var fold = "(define fold (lambda args (let ((fn (first args)) (acc (second args)) (lists (rest (rest args))) (lst0 (first (rest (rest args))))) (if (null? (rest lists)) (if (null? lst0) acc (fn (first lst0) (fold fn acc (rest lst0)))) (if (apply or (map null? lists)) acc (apply fn (append (map first lists) (list (apply fold (append (list fn acc) (map rest lists)))))))))))";

module.exports = {
    // sample: sample,
    //	repeat: repeat,
    map: map
    //  fold: fold
};
