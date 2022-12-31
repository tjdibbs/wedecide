const express = require("express");
const app = express();
const ENV = require("dotenv").config();
const flash = require("connect-flash");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const ConnectDatabase = require("./database/config");
const config = require("./config");
const passport = require("passport");
const logger = require("./logger");
const path = require("path");

app.use(cookieParser());
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(
  express.urlencoded({
    extended: true,
    limit: "50mb",
  })
);
app.use(express.json({ limit: "50mb" }));

app.use(
  session({
    secret: "wedecidevote",
    saveUninitialized: true,
    resave: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

process.on("uncaughtException", (err, data) => {
  logger.debug(JSON.stringify({ err, data }));
});

/**Route
 * Contains all the route to each page
 *
 */

app.get("/log", (req, res) => {
  res.sendFile(path.join(__dirname + "/logs.log"));
});

// HomePage
const index = require("./routes/index");
app.use("/", index);

//Login
const login = require("./routes/login");
app.use("/login", login);

//Register
const register = require("./routes/register");
app.use("/register", register);

// Admin Dashboard
const admin_dashboard = require("./routes/admin");
app.use("/admin", admin_dashboard);

const admin_election = require("./routes/admin");
app.use("/admin/election", admin_election);

const admin_contest = require("./routes/admin");
app.use("/admin/contest", admin_contest);

const admin_contest_pay = require("./routes/admin");
app.use("/admin/contest/pay", admin_contest_pay);

const admin_election_pay = require("./routes/admin");
app.use("/admin/election/pay", admin_election_pay);

const voter = require("./routes/voter");
app.use("/voter", voter);

const contest = require("./routes/voter");
app.use("/voter/contest-center", contest);

const election = require("./routes/voter");
app.use("/voter/election-center", election);

app.use((req, res, next) => {
  res.status(404).render("error-404");
});

// Port
app.listen(config.PORT, (data) => {
  console.log("Now Listening on http://localhost:" + config.PORT);
});
