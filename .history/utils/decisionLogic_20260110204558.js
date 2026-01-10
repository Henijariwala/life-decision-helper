function calculateDecision(options, criteria, weights, ratings) {
  const scores = {};

  options.forEach(option => {
    scores[option] = 0;
    criteria.forEach(c => {
      scores[option] += (weights[c] || 0) * (ratings[option][c] || 0);
    });
  });

  const bestOption = Object.keys(scores).reduce((a, b) =>
    scores[a] > scores[b] ? a : b
  );

  return { scores, bestOption };
}

module.exports = calculateDecision;
