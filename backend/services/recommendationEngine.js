import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const restaurantData = require('../data/restaurants.json');
const movieData = require('../data/movies.json');

// ─── Compatibility Scoring ────────────────────────────────────────────────────
export const scoreCompatibility = (user1, user2) => {
  let score = 0;

  // Same city → +25
  if (user1.location?.city && user2.location?.city &&
    user1.location.city.toLowerCase() === user2.location.city.toLowerCase()) {
    score += 25;
  }

  // Shared cuisine preferences → up to +20
  const cuisineOverlap = (user1.cuisinePreferences || []).filter(c =>
    (user2.cuisinePreferences || []).includes(c)).length;
  score += Math.min(cuisineOverlap * 5, 20);

  // Shared movie genres → up to +15
  const movieOverlap = (user1.movieGenres || []).filter(g =>
    (user2.movieGenres || []).includes(g)).length;
  score += Math.min(movieOverlap * 5, 15);

  // Shared ambience → up to +15
  const ambienceOverlap = (user1.ambiencePreferences || []).filter(a =>
    (user2.ambiencePreferences || []).includes(a)).length;
  score += Math.min(ambienceOverlap * 5, 15);

  // Shared interests → up to +15
  const interestOverlap = (user1.interests || []).filter(i =>
    (user2.interests || []).includes(i)).length;
  score += Math.min(interestOverlap * 3, 15);

  // Budget overlap → +10
  const b1Min = user1.budgetRange?.min || 500;
  const b1Max = user1.budgetRange?.max || 3000;
  const b2Min = user2.budgetRange?.min || 500;
  const b2Max = user2.budgetRange?.max || 3000;
  const overlapMin = Math.max(b1Min, b2Min);
  const overlapMax = Math.min(b1Max, b2Max);
  if (overlapMin <= overlapMax) score += 10;

  return Math.min(Math.round(score), 100);
};

// ─── Generate Recommendations ─────────────────────────────────────────────────
export const generateRecommendations = (user1, user2) => {
  const sharedCity = (user1.location?.city === user2.location?.city)
    ? user1.location?.city : null;

  const allCuisines = [...new Set([
    ...(user1.cuisinePreferences || []),
    ...(user2.cuisinePreferences || [])
  ])];
  const allAmbiences = [...new Set([
    ...(user1.ambiencePreferences || []),
    ...(user2.ambiencePreferences || [])
  ])];
  const allGenres = [...new Set([
    ...(user1.movieGenres || []),
    ...(user2.movieGenres || [])
  ])];

  const commonBudgetMin = Math.max(
    user1.budgetRange?.min || 500,
    user2.budgetRange?.min || 500
  );
  const commonBudgetMax = Math.min(
    user1.budgetRange?.max || 3000,
    user2.budgetRange?.max || 3000
  );
  const effectiveBudgetMax = commonBudgetMax >= commonBudgetMin ? commonBudgetMax : 3000;

  // Filter restaurants
  const restaurants = restaurantData
    .filter(r => !sharedCity || r.city.toLowerCase() === sharedCity.toLowerCase())
    .filter(r => r.budgetMin <= effectiveBudgetMax && r.budgetMax >= commonBudgetMin)
    .filter(r =>
      r.cuisines.some(c => allCuisines.includes(c)) ||
      r.ambience.some(a => allAmbiences.includes(a))
    )
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3);

  // Fallback: top rated restaurants in city
  const finalRestaurants = restaurants.length > 0
    ? restaurants
    : restaurantData
      .filter(r => !sharedCity || r.city.toLowerCase() === sharedCity.toLowerCase())
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 3);

  // Filter movies
  const movies = movieData
    .filter(m => m.genres.some(g => allGenres.includes(g)))
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3);

  const finalMovies = movies.length > 0
    ? movies
    : movieData.sort((a, b) => b.rating - a.rating).slice(0, 3);

  // Generate smart date plan
  const datePlan = generateDatePlan(finalRestaurants[0], finalMovies[0], commonBudgetMin, effectiveBudgetMax);

  return {
    restaurants: finalRestaurants,
    movies: finalMovies,
    datePlan,
    sharedCity: sharedCity || user1.location?.city || 'your city',
    budgetRange: { min: commonBudgetMin, max: effectiveBudgetMax }
  };
};

// ─── Smart Date Plan ──────────────────────────────────────────────────────────
const generateDatePlan = (restaurant, movie, budgetMin, budgetMax) => {
  const isTheatre = movie?.mode === 'Theatre';

  return {
    timeline: [
      {
        time: '5:30 PM',
        activity: 'Meet & Greet',
        description: `Start your evening with a warm hello at ${restaurant?.address || 'a central location'}`,
        icon: 'heart'
      },
      {
        time: '6:00 PM',
        activity: `Dinner at ${restaurant?.name || 'a romantic restaurant'}`,
        description: `Enjoy ${restaurant?.cuisines?.join(' & ') || 'delicious cuisine'} in a ${restaurant?.ambience?.join(', ') || 'romantic'} setting`,
        icon: 'utensils'
      },
      {
        time: isTheatre ? '8:30 PM' : '8:00 PM',
        activity: isTheatre ? `Watch "${movie?.title || 'a great movie'}" at the theatre` : `Stream "${movie?.title || 'a great movie'}" together`,
        description: isTheatre ? 'Grab popcorn and enjoy the big screen experience' : 'Cozy up and enjoy a movie night at home',
        icon: 'film'
      },
      {
        time: '10:30 PM',
        activity: 'Dessert & Stroll',
        description: 'End the night with something sweet and a peaceful walk under the stars',
        icon: 'star'
      }
    ],
    estimatedCost: `₹${budgetMin} – ₹${budgetMax}`,
    tip: 'Book the restaurant in advance for the best experience! 💡'
  };
};
