// Configuration file
// Copy this from config.example.js and modify as needed

module.exports = {
  server: {
    port: process.env.PORT || 3000
  },

  session: {
    secret: process.env.SESSION_SECRET || 'your-super-secret-session-key-change-this-in-production'
  },

  database: {
    path: process.env.DATABASE_PATH || './backend/database/temp_teachers.db'
  },

  email: {
    // Для разработки - отключено, чтобы избежать ошибок
    enabled: process.env.EMAIL_ENABLED === 'true',
    service: process.env.EMAIL_SERVICE || 'gmail',
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER
  }
};
