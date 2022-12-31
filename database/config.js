const mongoose = require("mongoose");

const MONGODB_URL = process.env.database_url;

mongoose.connect(
  MONGODB_URL || `mongodb://127.0.0.1:27017/zablot`,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  (err, connected) => {
    if (!connected) {
      console.log("database failed to conect");
      process.exit(1);
    } else {
      console.log("database connected");
    }
  }
);
