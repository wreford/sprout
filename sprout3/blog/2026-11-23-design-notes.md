# Blocks, thunks and each

Sprout already evaluates one level at a time: `[1 + 2]!` is 3, and `[[5 * 5]]!` is a block that isn't run. From Troy's design notes, `each` now gathers its results and `drop` discards what a cell matches, while thunks (`~(...)`) are written up as a proposal in decision 158.
