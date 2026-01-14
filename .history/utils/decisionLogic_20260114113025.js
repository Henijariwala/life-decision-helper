module.exports = (options, criteria, weights, ratings) => {
  const scores = {};

  options.forEach(o => {
    scores[o] = 0;
    criteria.forEach(c => {
      scores[o] += (weights[c] || 0) * (ratings[o]?.[c] || 0);
    });
  });

  const bestOption = Object.keys(scores)
    .reduce((a, b) => scores[a] > scores[b] ? a : b);

  return { options, criteria, scores, bestOption };
};
