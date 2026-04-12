module.exports = {
  origin: process.env.TRUSTED_ORIGINS?.split(',') || ['http://localhost:5173'], // Specify allowed origins
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"], // Allowed HTTP methods
  credentials: true
};