// Usage: node calculate-sus.mjs sus-responses.csv
// CSV header: participant,q1,...,q10  (each answer 1-5). Prints per-participant SUS and the mean.
// SUS: odd items score = answer-1; even items score = 5-answer; sum x 2.5 -> 0..100.
import fs from 'node:fs'
export const susScore = (a) => {
  if (a.length !== 10 || a.some((x) => !Number.isInteger(x) || x < 1 || x > 5)) throw new Error('need 10 integer answers 1-5')
  return a.reduce((s, x, i) => s + (i % 2 === 0 ? x - 1 : 5 - x), 0) * 2.5
}
const grade = (m) => (m >= 80.3 ? 'A (excellent)' : m >= 68 ? 'C-B (good / above average)' : m >= 51 ? 'D (OK / below average)' : 'F (poor)')
if (process.argv[1] && process.argv[1].endsWith('calculate-sus.mjs') && process.argv[2]) {
  const rows = fs.readFileSync(process.argv[2], 'utf8').trim().split(/\r?\n/).slice(1).filter(Boolean).map((l) => l.split(','))
  const scores = rows.map((r) => ({ who: r[0], score: susScore(r.slice(1, 11).map(Number)) }))
  for (const s of scores) console.log(s.who.padEnd(14), s.score)
  const mean = scores.reduce((a, s) => a + s.score, 0) / scores.length
  console.log(`n=${scores.length}  mean SUS=${mean.toFixed(1)}  ${grade(mean)}`)
}
