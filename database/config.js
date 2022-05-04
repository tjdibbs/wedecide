const mongoose = require("mongoose");

class ConnectDatabase {
  constructor(url, password) {
    this.url = url;
    this.password = password ?? "";
    this.count = 0;
  }

  async connect() {
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
      return { initializeConnection: "Database connected" };
    } catch (error) {
      this.count += 1;

      if (this.count >= 5) {
        throw Error;
      }
      this.connect();
    }
  }
}

module.exports = ConnectDatabase;
