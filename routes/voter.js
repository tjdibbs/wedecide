const router = require("express").Router();
const mongoose = require("mongoose");
const express = require("express");
const Models = require("../model");
const formidable = require("formidable");
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");
const verify = require("../config/validateContestVoter");
const verifyElection = require("../config/validateElectionVote");
const Emailer = require("../mailer");
const bcrypt = require("bcryptjs");
const cloudinary = require("cloudinary");
const AWS = require("aws-sdk");

router.use(express.static("public"));

cloudinary.config({
  cloud_name: "hodaviahtechnology",
  api_key: process.env.cloudinary_key,
  api_secret: process.env.cloudinary_secret,
});

new AWS.Config({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

//****************To Register to vote for an election */
router.get("/register-election", async (req, res) => {
  const elections = await Models.ElectionModel.find({}).lean();
  const success = req.flash("success")[0];
  const error = req.flash("error")[0];
  const formData = req.flash("formData")[0];

  res.render("vote_register", {
    result: elections,
    success,
    error,
    formData,
  });
});

router.post("/register-election", async (req, res) => {
  const form = formidable();
  form.parse(req, async (err, fields, files) => {
    try {
      if (err) throw Error(err);

      const { election, username, email, phone, password, image_name } = fields;

      if (
        !election ||
        !username ||
        !email ||
        !phone ||
        !password ||
        !image_name ||
        !files["image"]
      ) {
        req.flash("error", "All Fields Required"),
          req.flash("formData", fields);
        return res.redirect("/voter/register-election");
      }

      const voucher = `ev-${uuidv4()}`;
      const timestamp = new Date().toISOString().replaceAll(/\W/g, "_");
      const ref = username + "_" + timestamp;
      const electionDetail = election.split("/");
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(password, salt);

      const cloudResponse = await cloudinary.v2.uploader.upload(
        files["image"].filepath,
        {
          public_id: ref,
          eager: [{ fetch_format: "jpg" }],
        }
      );

      const newVoter = new Models.VoterModel({
        username,
        email,
        password: hash,
        voucher,
        phone,
        election_id: electionDetail[0],
        face_path: cloudResponse.eager[0].secure_url,
      });

      await newVoter.save();

      const text = `Good Day ${username}!. \nYou can now partcipate in the election: ${electionDetail[1]} by voting for your favorite candidate, Here is your details \nUsername: ${username} \nPassword: ${password} \nvouchar: ${voucher}`;

      // Emailer, will email user creditial to there email
      Emailer(email, text);

      req.flash("success", "You can login as a voter of " + electionDetail[1]);
      return res.redirect("/voter/vote-election");
    } catch (error) {
      console.log({ error });
      if (error.keyValue) {
        req.flash(
          "error",
          Object.keys(error?.keyValue)[0] +
            " - " +
            Object.values(error.keyValue)[0] +
            " already exist"
        );
      } else {
        req.flash("error", error?.message ?? "Internal Server Error");
      }
      req.flash("formData", { ...fields, file: files["image"] });

      return res.redirect("/voter/register-election");
    }
  });
});

//************To Login befor you vote for an election */
router.get("/vote-election", async (req, res) => {
  const elections = await Models.ElectionModel.find({}, { name: 1 }).lean();
  const success = req.flash("success")[0];
  const error = req.flash("error")[0];
  const formData = req.flash("formData")[0];

  res.render("vote_election", {
    result: elections,
    error,
    success,
    formData,
  });
});

router.post("/vote-election", async (req, res) => {
  try {
    const election = req.body.election;
    const username = req.body.username;
    const password = req.body.password;

    if (!election || !username || !password) {
      req.flash("error", "All fields require");
      return res.status(301).redirect("/voter/vote-election");
    }

    const details = election.split("/");
    const VotingElection = await Models.VoterModel.findOne({
      username: username,
      election_id: details[0],
    });

    const compare = await bcrypt.compare(
      password,
      VotingElection?.password ?? ""
    );

    if (!VotingElection || !compare)
      throw Error(
        "Invalid Creditials or you have not registered for the election"
      );

    if (VotingElection.vote)
      throw Error("You have voted for this election already");

    const token = jwt.sign(
      {
        id: VotingElection._id,
        username: VotingElection.username,
        election_id: VotingElection.election_id,
        face_path: VotingElection.face_path,
      },
      "secret-hack-election"
    );
    return res
      .cookie("election_auth", token, {
        maxAge: 2 * 60 * 60 * 1000,
        httpOnly: true,
      })
      .redirect("/voter/face-check");
  } catch (error) {
    req.flash("error", error?.message);
    req.flash("formData", req.body);
    return res.status(301).redirect("/voter/vote-election");
  }
});

router.get("/face-check", verifyElection, async (req, res) => {
  const token = req.cookies.election_auth;
  const votingElection = { ...jwt.decode(token, "secret-hack-election") };

  const ElectionVotes = await Models.VoterModel.findById(
    votingElection.id
  ).lean();

  if (ElectionVotes)
    return res.status(200).render("face_check", { result: ElectionVotes });

  res.clearCookie("election_auth", { path: "/" });

  req.flash("error", "Access Denied!");
  return res.status(404).redirect("/voter/vote-election");
});

router.post("/face-check", verifyElection, async (req, res, next) => {
  const body = req.body;

  function getBinary(base64Image) {
    const binaryImg = atob(base64Image);
    const length = binaryImg.length;
    const ab = new ArrayBuffer(length);
    const ua = new Uint8Array(ab);
    for (let i = 0; i < length; i++) {
      ua[i] = binaryImg.charCodeAt(i);
    }

    return ab;
  }

  try {
    const base64ImageTarget = body.imgBase64Target.replace(
        /^data:image\/(png|jpeg|jpg);base64,/,
        ""
    );
    const base64ImageSource = body.imgBase64Source.replace(
        /^data:image\/(png|jpeg|jpg);base64,/,
        ""
    );
    const target = getBinary(base64ImageTarget);
    const source = getBinary(base64ImageSource);

    const client = new AWS.Rekognition();
    const params = {
      SourceImage: {
        Bytes: source,
      },
      TargetImage: {
        Bytes: target,
      },
      SimilarityThreshold: 70,
    };

    client.compareFaces(params, function (err) {
      if (err) return res.json({ matched: false });
      return res.json({ matched: true });
    });
  } catch (error) {
    return res.json({ err: error.message });
  }
});

//****************To Register to vote for an contest */
router.get("/register-contest", async (req, res) => {
  const success = req.flash("success")[0];
  const error = req.flash("error")[0];
  const formData = req.flash("formData")[0];
  const contests = await Models.ContestModel.find({}).lean();
  res.status(200).render("contest_register", {
    result: contests,
    formData,
    error,
    success,
  });
});

//************To Get info about the voter (Contest) and send an email with his/her vouchar details */
router.post("/contest-register", async (req, res) => {
  const { contest, name, email, phone } = req.body;

  const detailArr = contest.split("/");
  const contest_id = detailArr[0].trim();
  const contest_name = detailArr[1].trim();
  const voucher = `cv-${uuidv4()}`;

  if (!contest || !name || !email || !phone) throw Error("All fields require");

  try {
    const text = `Good Day ${name}! \nYou can now partcipate in the contest: ${contest_name} by voting for your favorite contestant , Here is your vouchar \n${voucher}`;
    const { error, response } = await Emailer(email, text);

    if (error) throw Error("Email not sent: Please contact support");
    const newContestVoter = new Models.ContestVoterModel({
      name,
      email,
      phone,
      voucher,
      contest_id,
    });

    await newContestVoter.save();

    req.flash(
      "success",
      "Your voucher has been sent to your email. You are ready to participate in the contest"
    );
    res.redirect("/voter/contest-vote");
  } catch (error) {
    if (error?.keyValue) {
      req.flash(
        "error",
        Object.keys(error.keyValue)[0] +
          " - " +
          Object.values(error.keyValue)[0] +
          " already exist"
      );
    } else req.flash("error", error?.message);

    req.flash("formData", req.body);
    return res.redirect("/voter/register-contest");
  }
});

//***********************Route to in put the vouchar */
router.get("/contest-vote", async (req, res) => {
  const success = req.flash("success")[0];
  const error = req.flash("error")[0];
  const formData = req.flash("formData")[0];

  return res.status(200).render("contest_vote", { error, success, formData });
});

//*******************Verify the Vouchar */
router.post("/contest-vote", async (req, res) => {
  try {
    const voucher = req.body.vouchar;

    if (!voucher)
      return (
        res.flash("error", "All fields require"),
        res.status(400).redirect("/voter/contest-vote")
      );

    const contestVoter = await Models.ContestVoterModel.findOne({
      voucher,
    });

    if (!contestVoter)
      throw Error(
        "It seems like the contest you are looking for is not available anymore"
      );
    if (contestVoter.vote)
      throw Error("Your voucher has been used to cast a vote");

    const token = jwt.sign(
      {
        id: contestVoter.contest_id,
        voter_id: contestVoter._id,
        voter_name: contestVoter.name,
        voter_email: contestVoter.email,
      },
      "secret-hack-contest"
    );

    return res
      .cookie("contest_auth", token, {
        maxAge: 2 * 60 * 60 * 1000,
        httpOnly: true,
      })
      .redirect("/voter/contest-center");
  } catch (error) {
    req.flash("formData", req.body);
    req.flash("error", error?.message ?? "Internal Server Error");
    return res.status(301).redirect("/voter/contest-vote");
  }
});

//**********************Route where they will cast vote (Election) */
router.get("/election-center", verifyElection, async (req, res) => {
  const token = req.cookies.election_auth;
  const error = req.flash("error")[0];
  const election_id = jwt.decode(token, "secret-hack-election").election_id;

  const electionDetail = await Models.ElectionModel.findById(
    mongoose.Types.ObjectId(election_id),
    {
      name: 1,
      polls: 1,
      candidates: 1,
    }
  )
    .populate("polls")
    .populate("candidates");

  if (!electionDetail) {
    res.clearCookie("election_auth", { path: "/" });
    const elections = await Models.ElectionModel.find({}).lean();

    req.flash("error", "Access Denied!");
    return res.status(301).render("vote_election", {
      error: "Session Timeout, Log in",
      success: null,
      formData: null,
      result: elections,
    });
  }

  return res.render("vote_center", {
    result: electionDetail,
    error,
    success: null,
  });
});

router.post("/election-center", verifyElection, async (req, res) => {
  const token = jwt.decode(req.cookies.election_auth);
  const voter_id = token.id;
  const election_id = token.election_id;
  const formData = req.body;
  const browser_fingerprint = formData.browser_fingerprint;

  delete formData.browser_fingerprint;
  const candidate_ids = Object.values(formData); // array of names of the poll
  const poll_ids = Object.keys(formData)?.map((id) => id.split("/")[0]); // array of names of the poll

  if (!candidate_ids?.length) {
    req.flash("error", "Vote for at least one contestant");
    return res.status(301).redirect("/voter/election-center");
  }

  try {
    // Update the total casted vote of the Voter
    const voter = await Models.VoterModel.findByIdAndUpdate(voter_id, {
      $inc: { vote: 1 },
    }).exec();

    const election = await Models.ElectionModel.findById(election_id);

    if (election.browser_fingerprint.includes(browser_fingerprint.trim())) {
      Models.VoterModel.findByIdAndUpdate(voter_id, {
        not_counted: true,
      }).exec();
      throw Error(
        "This device has been used to vote already, a device can only be use once to vote in a contest"
      );
    }

    election.browser_fingerprint.push(browser_fingerprint);
    election.voters.push(voter_id);
    await election.save();

    // Update poll votes
    const polls = await Models.PollModel.updateMany(
      { _id: { $in: poll_ids } },
      { $inc: { vote: 1 } }
    ).exec();

    // Update candidate votes
    const candidates = await Models.CandidateModel.updateMany(
      { _id: { $in: candidate_ids } },
      { $inc: { vote: 1 } }
    ).exec();

    res.clearCookie("election_auth", { path: "/" });
    return res.redirect("/voter/thank-you");
  } catch (error) {
    req.flash("error", error?.message ?? "Internal Server Error");
    res.clearCookie("election_auth", { path: "/" });
    return res.status(301).redirect("/voter/vote-election");
  }
});

//**************** Route where they will cast vote (Contest)*/
router.get("/contest-center", verify, async (req, res) => {
  const token = req.cookies.contest_auth;
  const error = req.flash("error")[0];
  const contest_id = jwt.decode(token).id;

  const contestDetail = await Models.ContestModel.findById(contest_id, {
    name: 1,
    polls: 1,
    contestants: 1,
  })
    .populate("polls")
    .populate("contestants");

  if (!contestDetail) {
    res.clearCookie("election_auth", { path: "/" });
    const contests = await Models.ContestModel.find({}).lean();

    req.flash("error", "Access Denied!");
    return res.status(301).render("vote_election", {
      error: "Session Timeout, Log in",
      success: null,
      formData: null,
      result: contests,
    });
  }

  return res.render("contest_center", {
    result: contestDetail,
    error,
    success: null,
  });
});

//******************People vote for contestant */
router.post("/contest-center", verify, async (req, res) => {
  const token = jwt.decode(req.cookies.contest_auth);
  const voter_id = token.voter_id;
  const voter_name = token.voter_name;
  const voter_email = token.voter_email;
  const contest_id = token.id;

  const formData = req.body;
  const browser_fingerprint = formData.browser_fingerprint;

  const text = `Good Day ${voter_name}! \nThank You for partcipating in the contest by voting for your favorite contestant.`;

  delete formData.browser_fingerprint;
  const candidate_ids = Object.values(formData);
  const poll_ids = Object.keys(formData)?.map((id) => id.split("/")[0]); // array of names of the poll

  if (!candidate_ids?.length) {
    req.flash("error", "Vote for at least one contestant");
    return res.status(301).redirect("/voter/contest-center");
  }

  try {
    // Update the total casted vote of the Voter
    await Models.ContestVoterModel.findByIdAndUpdate(voter_id, {
      vote: 1,
    }).exec();
    const contests = await Models.ContestModel.findById(contest_id);

    if (contests.browser_fingerprint.includes(browser_fingerprint)) {
      Models.ContestVoterModel.findByIdAndUpdate(voter_id, {
        not_counted: true,
      }).exec();

      throw Error(
        "This device has been used to vote already, a device can only be use once to vote in a contest"
      );
    }

    contests.browser_fingerprint.push(browser_fingerprint);
    contests.voters.push(voter_id);
    await contests.save();

    // Update contestant votes
    await Models.ContestantModel.updateMany(
      { _id: { $in: candidate_ids } },
      { $inc: { vote: 1 } }
    ).exec();

    await Models.ContestantPollModel.updateMany(
      { _id: { $in: poll_ids } },
      { $inc: { vote: 1 } }
    ).exec();

    Emailer(voter_email, text);
    res.clearCookie("contest_auth", { path: "/" });
    return res.status(200).redirect("/voter/thank-you");
  } catch (error) {
    req.flash("error", error?.message ?? "Internal Server Error");
    res.clearCookie("contest_auth", { path: "/" });
    return res.status(301).redirect("/voter/contest-vote");
  }
});

router.get("/thank-you", (req, res) => {
  res.render("thank_you");
});

module.exports = router;
