module.exports = {
	ENV: process.env.NODE_ENV || "development",
	PORT: process.env.PORT || 8000,
	URL: process.env.BASE_URL || "http://localhost:3000",
	HOST: process.env.HOST || "localhost",
	DB_PORT: process.env.DB_PORT || 3306,
	USER: process.env.USER || "root",
	PASSWORD: process.env.PASSWORD || "",
	DATABASE: process.env.DATABASE || "wedecide",
};
