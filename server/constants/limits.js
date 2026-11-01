// Shared limits taken from the SRS.
module.exports = Object.freeze({
  PASSWORD_MIN_LENGTH: 8, // FR#3 (also needs a letter and a number)
  BIO_MAX_LENGTH: 250, // FR#12
  REVIEW_MAX_LENGTH: 1000, // FR#25
  RATING_MIN: 1, // FR#24
  RATING_MAX: 5,
  PROFILE_PICTURE_MAX_BYTES: 2 * 1024 * 1024, // FR#13
  VENUE_PHOTO_MAX_BYTES: 5 * 1024 * 1024, // FR#51
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png'],
  LOGIN_MAX_FAILURES: 5, // FR#6
  LOGIN_LOCK_MINUTES: 15,
  STUDENT_IDLE_MINUTES: 30, // SC#12
  ADMIN_IDLE_MINUTES: 15,
  AVERAGE_RATING_DECIMALS: 1, // FR#23: average rating shown to one decimal place
});
