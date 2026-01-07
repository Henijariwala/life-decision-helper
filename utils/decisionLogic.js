function calculateDecision(options, criteria, weights, ratings) {
  let scores = {};

  options.forEach(opt => {
    scores[opt] = 0;
    criteria.forEach(c => {
      scores[opt] += weights[c] * ratings[opt][c];
    });
  });

  const bestOption = Object.keys(scores).reduce((a, b) =>
    scores[a] > scores[b] ? a : b
  );

  return { scores, bestOption };
}

module.exports = calculateDecision;
