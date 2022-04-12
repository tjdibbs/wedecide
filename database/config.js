const mongoose = require("mongoose");
const {promisify} = require("util");

mongoose.connect = promisify(mongoose.connect);

class ConnectDatabase {
	constructor(url, password) {
		this.url = url;
		this.password = password ?? "";
		this.count = 0;
	}

	async connect() {
		console.log({url: this.url, password: this.password});
		if (this.password) {
			console.info("There is a password for the database");
		}

		try {
			mongoose.connect(
				this.url,
				{
					useNewUrlParser: true,
					useUnifiedTopology: true,
				},
				(err, info) => {
					if (err) throw Error("Error connecting to database");
				}
			);
			return {initializeConnection: "Database connected"};
		} catch (error) {
			console.error({error: error.message, count: this.count});
			this.count += 1;

			if (this.count >= 5) {
				throw Error;
			}
			this.connect();
		}
	}
}

module.exports = ConnectDatabase;
