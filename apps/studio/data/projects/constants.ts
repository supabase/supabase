// [Joshen] Try to keep this value a multiple of 6 (common denominator of 2 and 3) to fit the cards view
// So that the last row will always be a full row of cards while there's a next page
// API max rows is 100, I'm just choosing 96 here as the highest value thats a multiple of 6
export const PROJECT_PAGINATION_DEFAULT_LIMIT = 96