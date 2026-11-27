# Blocks, thunks and each

Sprout already evaluates one level at a time: `[1 + 2]!` is 3, and `[[5 * 5]]!` is a block that isn't run. From the owner's design notes, `each` is being changed to gather its results and `drop` to discard what a cell matches; thunks (`~(...)`) are written up as a proposal in decision 158.
