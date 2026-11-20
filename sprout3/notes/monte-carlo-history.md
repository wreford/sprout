# A short history of Monte Carlo simulation

Monte Carlo methods estimate an answer by running many random trials and counting or averaging the results. They are named after the Monte Carlo casino in Monaco, a name suggested by Nicholas Metropolis.

## Before the name: random trials

- **1777.** Buffon's needle. Georges-Louis Leclerc, Comte de Buffon, showed that dropping a needle on a floorboarded floor gives a way to estimate pi from how often the needle crosses a line. It is the first well-known case of answering a deterministic question with chance.
- **1812.** Laplace pointed out that the same kind of experiment could estimate pi, and that such methods were practical for calculation.

## The idea, 1946 to 1949

- **1946.** Stanislaw Ulam, recovering from an illness at Los Alamos, wondered what the odds were of winning a game of Canfield solitaire. Working out the answer by reasoning was hard. Running many random games and counting the wins was easy. He later said the idea came from that thought.
- **1946 to 1947.** Ulam discussed the idea with John von Neumann. They saw that it could help with a hard problem in the Manhattan Project: how neutrons spread through material. A chain of random events, sampled many times, could follow individual neutrons more directly than solving the equations.
- **1949.** Metropolis and Ulam published "The Monte Carlo Method" in the Journal of the American Statistical Association. It is the first full description of the method.

## Computers and random numbers

- **1946.** Von Neumann proposed the middle-square method for producing random digits. It was simple but poor, and it fell into short cycles.
- **1948 to 1949.** D. H. Lehmer described the linear congruential generator, a simple formula that is still used in some software.
- **1947 to 1948.** The ENIAC, the first general-purpose electronic computer, ran early Monte Carlo calculations for neutron diffusion. These were among the first real computer jobs of their kind.
- **1955.** The RAND Corporation published *A Million Random Digits*, a table made from electronic noise. For many years, it was the standard source of random numbers for hand calculations.

## The Metropolis algorithm, 1953

- **1953.** Metropolis, Rosenbluth, Rosenbluth, Teller and Teller published "Equation of State Calculations by Fast Computing Machines", on the MANIAC computer at Los Alamos. It described a way to sample from a complicated distribution: propose a random change, accept it if it lowers the energy, and sometimes accept it if it raises it. Repeated over many steps, the samples follow the right distribution.
- **1970.** W. K. Hastings generalised the method to other kinds of proposal. The result is known as the Metropolis-Hastings algorithm and underlies much of modern Bayesian statistics.
- **1984.** Stuart and Donald Geman described Gibbs sampling, which applies the same idea to images and other structured problems. Together these methods became Markov chain Monte Carlo.

## Into business and engineering

- **1959.** The PERT method, developed for the US Navy's Polaris missile programme, estimated project times from three figures: optimistic, most likely, and pessimistic. Those three figures are the seed of the triangle-shaped durations used in schedule simulation today.
- **1964.** David Hertz's article "Risk Analysis in Capital Investment" in the Harvard Business Review brought Monte Carlo to business. Instead of one forecast, it showed a range of outcomes and how likely each was.
- **1970s to today.** Cost and schedule risk analysis for large engineering projects, from dams to rail lines, uses the same approach. Modern tools run thousands or millions of runs in seconds.

## Why it works

Monte Carlo trades exactness for generality. It needs no closed-form solution, so it handles messy problems with many interacting parts. The price is that the answer has noise, which shrinks in proportion to one over the square root of the number of runs. Four times as many runs halves the noise.

## Where Sprout fits

ACE's schedule and risk examples use this lineage directly. `examples/ace-schedule.sp` samples three-point durations for each piece of work and walks the dependency graph for each run. `examples/ace-risk.sp` adds a risk register and runs a million trials. Two details follow the history above. The draws come from a seeded hash, so the same seed gives the same histogram every time, which is what a reproducible study needs. And the run is written as one pure cell, which lets `spork` compile it into a numeric kernel.

## Sources

- Metropolis, N. and Ulam, S. (1949). "The Monte Carlo Method." Journal of the American Statistical Association 44(247).
- Metropolis, N. (1987). "The beginning of the Monte Carlo method." Los Alamos Science, special issue.
- Metropolis, N. et al. (1953). "Equation of State Calculations by Fast Computing Machines." Journal of Chemical Physics 21(6).
- Hastings, W. K. (1970). "Monte Carlo sampling methods using Markov chains and their applications." Biometrika 57(1).
- Hertz, D. B. (1964). "Risk Analysis in Capital Investment." Harvard Business Review 42(1).
- Malcolm, D. G. et al. (1959). "Application of a technique for research and development program evaluation." Operations Research 7(5).
