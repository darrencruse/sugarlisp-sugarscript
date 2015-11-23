((macro $ 
    (id) 
    (
      (
        (. document getElementById) 
        (~ id)))) 
  (macro $listener 
    (domObj eventName ...rest) 
    (
      (
        (. 
          (~ domObj) addEventListener) 
        (~ eventName) 
        (=> 
          (event) 
          (~ rest))))))
