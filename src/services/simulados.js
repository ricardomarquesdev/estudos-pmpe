export function simTotalPoints(simulado) {
  return simulado.correct + (simulado.essay != null ? simulado.essay : 0);
}

export function simMaxPoints(simulado) {
  return simulado.questions + (simulado.essay != null ? 40 : 0);
}

export function simPercent(simulado) {
  const max = simMaxPoints(simulado);
  return max ? Math.round((simTotalPoints(simulado) / max) * 100) : 0;
}
