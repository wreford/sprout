-- csv: tables in text, one row a line and commas between the values. The first line names the columns.
-- Values that look like numbers become numbers. (Quoted values with commas inside aren't handled.)

-- one value from text: a number if it looks like one
cell-value : [t | t trim number else [t trim]]

-- the rows as records, named by the first line
-- e.g. csv read "name,age\nAda,36\nAlan,41" → [[name : Ada, age : 36], [name : Alan, age : 41]]
read : [csv-text |
  rows : csv-text trim lines keep [l | l trim length > 0] collect [l | l split ","]
  names : rows first collect [n | n trim]
  rows rest collect [row | names zip row fold [[], [r [name, value] | r set-in [name, cell-value value]]]]
]

-- records as text, a line per record, with the first record's fields as the columns
-- e.g. csv write [[name : "Ada", age : 36], [name : "Alan", age : 41]] → name,age\nAda,36\nAlan,41
write : [records |
  names : records first keys
  ([names join ","] .. (records collect [r | names collect [n | r get-in n] join ","])) join "\n"
]
