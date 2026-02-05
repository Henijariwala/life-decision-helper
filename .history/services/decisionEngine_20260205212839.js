// services/decisionEngine.js - Decision-Making Logic
class DecisionEngine {
  /**
   * Calculate scores for all options based on weighted criteria
   * @param {Array<string>} options - List of options to evaluate
   * @param {Object} criteria - Criteria with weights { criteriaName: weight }
   * @param {Object} ratings - Ratings for each option { optionName: { criteriaName: rating } }
   * @returns {Object} { scores, bestOption, analysis }
   */
  static calculate(options, criteria, ratings) {
    const scores = {};
    let maxScore = -Infinity;
    let bestOption = null;

    // Calculate weighted score for each option
    options.forEach(option => {
      let totalScore = 0;
      let weightSum = 0;

      Object.entries(criteria).forEach(([criteriaName, weight]) => {
        const rating = ratings[option]?.[criteriaName] || 0;
        totalScore += weight * rating;
        weightSum += weight;
      });

      // Normalize score (0-100 scale)
      scores[option] = weightSum > 0 
        ? Math.round((totalScore / weightSum) * 10) / 10 
        : 0;

      // Track best option
      if (scores[option] > maxScore) {
        maxScore = scores[option];
        bestOption = option;
      }
    });

    // Generate analysis
    const analysis = this.generateAnalysis(options, scores, bestOption, criteria);

    return {
      scores,
      bestOption,
      analysis,
      metadata: {
        totalOptions: options.length,
        criteriaCount: Object.keys(criteria).length,
        scoreRange: {
          min: Math.min(...Object.values(scores)),
          max: Math.max(...Object.values(scores))
        }
      }
    };
  }

  /**
   * Generate detailed analysis of the decision
   * @private
   */
  static generateAnalysis(options, scores, bestOption, criteria) {
    const sortedOptions = Object.entries(scores)
      .sort(([, a], [, b]) => b - a);

    const topScore = sortedOptions[0][1];
    const secondScore = sortedOptions[1]?.[1] || 0;
    const margin = topScore - secondScore;

    return {
      winner: bestOption,
      confidence: margin > 2 ? "high" : margin > 1 ? "medium" : "low",
      marginOfVictory: margin,
      ranking: sortedOptions.map(([option, score], index) => ({
        rank: index + 1,
        option,
        score,
        percentage: topScore > 0 ? Math.round((score / topScore) * 100) : 0
      })),
      criteriaImportance: this.rankCriteria(criteria)
    };
  }

  /**
   * Rank criteria by weight
   * @private
   */
  static rankCriteria(criteria) {
    return Object.entries(criteria)
      .sort(([, a], [, b]) => b - a)
      .map(([name, weight], index) => ({
        rank: index + 1,
        criteria: name,
        weight
      }));
  }

  /**
   * Validate decision inputs
   * @param {Array} options - Options to validate
   * @param {Object} criteria - Criteria to validate
   * @param {Object} ratings - Ratings to validate
   * @returns {Object} { valid, errors }
   */
  static validate(options, criteria, ratings) {
    const errors = [];

    // Validate options
    if (!options || options.length < 2) {
      errors.push("You need at least 2 options to compare.");
    }

    if (options && options.length > 10) {
      errors.push("Maximum 10 options allowed.");
    }

    // Validate criteria
    if (!criteria || Object.keys(criteria).length < 1) {
      errors.push("You need at least 1 criteria.");
    }

    if (criteria && Object.keys(criteria).length > 10) {
      errors.push("Maximum 10 criteria allowed.");
    }

    // Validate weights
    if (criteria) {
      Object.entries(criteria).forEach(([name, weight]) => {
        if (typeof weight !== "number" || weight < 1 || weight > 10) {
          errors.push(`Weight for "${name}" must be between 1 and 10.`);
        }
      });
    }

    // Validate ratings
    if (ratings && options && criteria) {
      options.forEach(option => {
        Object.keys(criteria).forEach(criteriaName => {
          const rating = ratings[option]?.[criteriaName];
          if (rating === undefined || rating === null) {
            errors.push(`Missing rating for "${option}" on "${criteriaName}".`);
          } else if (typeof rating !== "number" || rating < 1 || rating > 10) {
            errors.push(`Rating for "${option}" on "${criteriaName}" must be between 1 and 10.`);
          }
        });
      });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate decision summary text
   * @param {Object} result - Decision result
   * @returns {string} Summary text
   */
static generateSummary(result) {
  const { bestOption, scores, analysis } = result;
  const runnerUp = analysis.ranking[1];

  let summary = `🎯 Best Choice: ${bestOption} (Score: ${scores[bestOption]})\n\n`;
  
  summary += `Confidence Level: ${analysis.confidence.toUpperCase()}\n`;
  
  if (runnerUp) {
    summary += `Runner-up: ${runnerUp.option} (Score: ${runnerUp.score})\n`;
    summary += `Margin: ${analysis.marginOfVictory.toFixed(1)} points\n`;
  }

  return summary;
}

}

module.exports = DecisionEngine;