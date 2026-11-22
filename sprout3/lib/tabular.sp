-- tabular: tables kept as lists of records, one record a row, the way a spreadsheet or a database holds them: a
-- column's values, picking columns, sorting and filtering, totals, counts and averages by group, the top rows, joining
-- two tables, a pivot, and the whole table as aligned text. Columns are named by text, such as "region".

-- a small table of sales to try these words on
-- e.g. tabular sample length → 5
sample : [
  [region : "north", item : "tea", sold : 12, price : 3]
  [region : "south", item : "tea", sold : 7, price : 3]
  [region : "north", item : "cake", sold : 4, price : 5]
  [region : "east", item : "jam", sold : 9, price : 4]
  [region : "south", item : "cake", sold : 6, price : 5]
]

-- the values in one column
-- e.g. tabular column [tabular sample, "sold"] → [12, 7, 4, 9, 6]
column : [rows name | rows collect [r | r get-in [name]]]

-- the rows with only some columns kept
-- e.g. tabular pick [tabular sample, ["item", "sold"]] @ 1 → [item : tea, sold : 12]
pick : [rows names | rows collect [r | names fold [[], [kept n | kept set-in [n, r get-in [n]]]]]]

-- the rows sorted by a column, smallest first
-- e.g. tabular sorted [tabular sample, "sold"] collect [r | r sold] → [4, 6, 7, 9, 12]
sorted : [rows name | rows sort-by [r | r get-in [name]]]

-- the rows sorted by a column, largest first
-- e.g. tabular sorted-down [tabular sample, "sold"] @ 1 item → tea
sorted-down : [rows name | sorted [rows, name] reverse]

-- the rows whose column holds a value
-- e.g. tabular where [tabular sample, "region", "north"] length → 2
where : [rows name value | rows keep [r | r get-in [name] = value]]

-- a column added up
-- e.g. tabular total [tabular sample, "sold"] → 38
total : [rows name | column [rows, name] sum]

-- one column added up for each value of another, as a record
-- e.g. tabular total-by [tabular sample, "region", "sold"] → [north : 16, south : 13, east : 9]
total-by : [rows group-name value-name |
  rows fold [[], [acc r |
    key : r get-in [group-name] str
    before : (acc has-field key) [acc get-in [key]] else [0]
    acc set-in [key, before + (r get-in [value-name])]
  ]]
]

-- how many rows hold each value of a column, as a record
-- e.g. tabular count-by [tabular sample, "item"] → [tea : 2, cake : 2, jam : 1]
count-by : [rows name | column [rows, name] collect [v | v str] frequencies]

-- the average of one column for each value of another, as a record
-- e.g. tabular average-by [tabular sample, "item", "sold"] → [tea : 9.5, cake : 5, jam : 9]
average-by : [rows group-name value-name |
  sums : total-by [rows, group-name, value-name]
  counts : count-by [rows, group-name]
  sums keys fold [[], [acc k | acc set-in [k, sums get-in [k] / (counts get-in [k])]]]
]

-- the n rows with the largest values in a column
-- e.g. tabular top [tabular sample, "sold", 2] collect [r | r region] → [north, east]
top : [rows name n | sorted-down [rows, name] take n]

-- the rows split up by the value of a column, as a record of lists of rows
-- e.g. tabular group [tabular sample, "region"] north length → 2
group : [rows name | rows fold [[], [acc r | key : r get-in [name] str, acc set-in [key, ((acc has-field key) [acc get-in [key]] else [[]]) .. [r]]]]]

-- the rows with a column worked out from each row
-- e.g. tabular with-column [tabular sample, "takings", [r | r sold * (r price)]] collect [r | r takings] → [36, 21, 20, 36, 30]
with-column : [rows name make | rows collect [r | r set-in [name, make r]]]

-- each row joined with the rows of another table that hold the same value in a column (rows with no partner are left
-- out)
-- e.g. tabular joined [[[item : "tea", sold : 3]], [[item : "tea", price : 2], [item : "jam", price : 4]], "item"] → [[item : tea, sold : 3, price : 2]]
joined : [rows others name |
  rows collect-flat [r | others keep [o | o get-in [name] = (r get-in [name])] collect [o | o pairs fold [r, [acc [k, v] | acc set-in [k, v]]]]]
]

-- a pivot: one column added up, with a row for each value of one column and a column for each value of another
-- e.g. tabular pivot [tabular sample, "region", "item", "sold"] → [north : [tea : 12, cake : 4], south : [tea : 7, cake : 6], east : [jam : 9]]
pivot : [rows row-name column-name value-name |
  rows fold [[], [acc r |
    a : r get-in [row-name] str
    b : r get-in [column-name] str
    inner : (acc has-field a) [acc get-in [a]] else [[]]
    before : (inner has-field b) [inner get-in [b]] else [0]
    acc set-in [a, inner set-in [b, before + (r get-in [value-name])]]
  ]]
]

-- rows made from a list of column names and lists of values
-- e.g. tabular records [["name", "age"], [["Ada", 36], ["Alan", 41]]] → [[name : Ada, age : 36], [name : Alan, age : 41]]
records : [names lists | lists collect [values-list | names zip values-list fold [[], [acc [n, v] | acc set-in [n, v]]]]]

-- the table as aligned text: a header, a rule, then a line a row, numbers lined up on the right
-- e.g. tabular show (tabular pick [tabular sample, ["region", "sold"]] take 2) → region  sold\n------  ----\nnorth     12\nsouth      7
show : [rows |
  names : rows @ 1 keys
  widths : names collect [n | rows collect [r | r get-in [n] str length] .. [n length] largest]
  on-right : names collect [n | rows @ 1 get-in [n] kind = "number"]
  fit : [v w by-right | by-right [v str pad-left [w, " "]] else [v str pad-right [w, " "]]]
  line-of : [values | values numbered collect [[i, v] | fit [v, widths @ i, on-right @ i]] join "  " replace-all [[some space, end], ""]]
  [line-of names, widths collect [w | "-" repeat w] join "  "] .. (rows collect [r | line-of (names collect [n | r get-in [n]])]) join "\n"
]
