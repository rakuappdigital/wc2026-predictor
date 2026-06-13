export function calculatePoints(
  homePred: number,
  awayPred: number,
  homeActual: number,
  awayActual: number
): number {
  let points = 0

  const predResult = Math.sign(homePred - awayPred)
  const actualResult = Math.sign(homeActual - awayActual)

  if (predResult === actualResult) points += 3
  if (homePred === homeActual) points += 2
  if (awayPred === awayActual) points += 2

  return points
}
