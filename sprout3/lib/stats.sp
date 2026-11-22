-- stats: numbers that sum up a list of numbers.

-- the average
-- e.g. stats mean [2, 4, 9] → 5
mean : [xs | xs sum / (xs length)]

-- the middle value once they are sorted (the average of the two middle ones for an even count)
-- e.g. stats median [7, 1, 3, 9] → 5
median : [xs |
  sorted : xs sort
  n : sorted length
  n % 2 = 1 [sorted @ (n + 1 / 2)] else [sorted @ (n / 2) + (sorted @ (n / 2 + 1)) / 2]
]

-- the value that comes up most often (the first of them, if several tie)
-- e.g. stats mode [3, 1, 3, 2, 1, 3] → 3
mode : [xs | xs largest-by [x | xs count [y | y = x]]]

-- how spread out the values are: the mean of the squared distances from the mean
-- e.g. stats variance [2, 4, 4, 4, 5, 5, 7, 9] → 4
variance : [xs |
  centre : mean xs
  xs collect [x | x - centre * (x - centre)] sum / (xs length)
]

-- the standard deviation: the square root of the variance
-- e.g. stats spread [2, 4, 4, 4, 5, 5, 7, 9] → 2
spread : [xs | variance xs sqrt]

-- the value below which a share p of them fall, from 0 to 1 (between two values, part of the way)
-- e.g. stats percentile [[15, 20, 35, 40, 50], 0.4] → 29
percentile : [xs p |
  sorted : xs sort
  rank : sorted length - 1 * p + 1
  low : rank floor
  above : rank - low
  low >= (sorted length) [sorted last] else [sorted @ (low + 1) - (sorted @ low) * above + (sorted @ low)]
]

-- the smallest and largest, as a pair
-- e.g. stats range-of [4, 9, 1] → 1x9
range-of : [xs | pair [xs smallest, xs largest]]

-- each value placed between 0 (the smallest) and 1 (the largest)
-- e.g. stats normalize [10, 15, 20] → [0, 0.5, 1]
normalize : [xs |
  low : xs smallest
  width : xs largest - low
  xs collect [x | width = 0 [0] else [x - low / width]]
]

-- how many values fall in each of n equal steps from the smallest to the largest
-- e.g. stats histogram [[1, 2, 2, 3, 3, 3, 4], 3] → [1, 2, 4]
histogram : [xs n |
  low : xs smallest
  width : xs largest - low / n
  slot : [x | width = 0 [1] else [x - low / width floor + 1 min n]]
  range n collect [k | xs count [x | slot x = k]]
]

-- how closely two lists rise and fall together, from -1 to 1
-- e.g. stats correlation [[1, 2, 3, 4], [2, 4, 5, 8]] → 0.981155781
correlation : [xs ys |
  mx : mean xs
  my : mean ys
  pairs : xs zip ys
  top : pairs collect [[x, y] | x - mx * (y - my)] sum
  bottom : xs collect [x | x - mx * (x - mx)] sum * (ys collect [y | y - my * (y - my)] sum) sqrt
  top / bottom
]

-- a record of the usual numbers for a list
-- e.g. stats summary [3, 1, 4, 1, 5, 9, 2, 6] → [n : 8, mean : 3.875, median : 3.5, spread : 2.571, smallest : 1, largest : 9]
summary : [xs | [n : xs length, mean : mean xs, median : median xs, spread : spread xs * 1000 round / 1000, smallest : xs smallest, largest : xs largest]]
