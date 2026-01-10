module.exports = function (options, criteria, weights, ratings) {
  const scores = {};

  options.forEach(opt => {
    scores[opt] = 0;
    criteria.forEach(c => {
      scores[opt] += (weights[c] || 0) * (ratings[opt]?.[c] || 0);
    });
  });

  const bestOption = Object.keys(scores).reduce((a, b) =>
    scores[a] > scores[b] ? a : b
  );

  return { options, criteria, scores, bestOption };
};
