// Configuration example
// Copy this file to config.js and modify as needed

module.exports = {
  server: {
    port: process.env.PORT || 3000
  },

  session: {
    secret: process.env.SESSION_SECRET || 'your-super-secret-session-key-change-this-in-production'
  },

  database: {
    path: process.env.DATABASE_PATH || './backend/database/temp_teachers.db'
  }
};
