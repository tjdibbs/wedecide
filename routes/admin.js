const router = require("express").Router();
const jwt = require("jsonwebtoken");
const passport = require("passport");
const _ = require("lodash");
const Models = require("../model");
const EnsureIsAutheticated = require("../config/validateAdmin");
const mongoose = require("mongoose");
const async = require("async");
const {promisify} = require("util");
// const request = require("request");
// const {initializePayment, EnsureIsAutheticatedPayment} =
// 	require("../config/paystack")(request);

require("../authentication/passport");

//********** Route To The DashBoard ***************/
router.get("/", EnsureIsAutheticated, async (req, res, next) => {
	let elections = [],
		numberOfContest = 0;
	try {
		const token = req.user;
		const userdecode = jwt.decode(token, "secret-hack-admin");

		const data = await Models.AdminModel.findById(userdecode._id, {
			elections: 1,
			contests: 1,
			name: 1,
			username: 1,
		}).populate("elections");

		async.forEach(data.elections, (election) => {
			let editElection = {
				...election._doc,
				polls: election.polls.length ?? 0,
			};
			elections.push(editElection);
		});

		let result = {
			name: data.name,
			username: data.username,
			elections,
			numberOfContest: data.contests.length,
		};

		return res.status(200).render("admin_dashboard", {result});
	} catch (error) {
		return res.status(500).send(JSON.stringify(error, null, 3));
	}
});

//****************** The Route To Login In To DashBoard ********************/
router.post("/", async (req, res, next) => {
	const formData = req.body;
	passport.authenticate("localSignin", {
		successRedirect: "/admin",
		failureRedirect: "/login",
		failureFlash: true,
		failureMessage: req.flash("formData", formData),
	})(req, res, next);
});

//******************Logout Section ***************/
router.get("/logout", (req, res) => {
	const user = req?.user;
	const session_user = req.session?.passport?.user;

	if (!user || !session_user) return res.status(404).render("error-404");

	// req.secret = baseCookieOptions.secret;
	// res.clearCookie("app.session", baseCookieOptions);
	// res.clearCookie("app.session.sig", baseCookieOptions);

	req.logout();
	res.redirect("/");
	return res.end();
});

//****************** The Route To Create An Election ********************/
router.get("/create-election", EnsureIsAutheticated, (req, res) => {
	const success = req.flash("success")[0],
		error = req.flash("error")[0],
		formData = req.flash("formData")[0];
	return res
		.status(200)
		.render("create_election", {error, success, formData});
});

// ******************* Create Election ***********************//
router.post("/create-election", EnsureIsAutheticated, async (req, res) => {
	const formData = req.body;
	const {name, esd, eed, rsd, red, desp} = formData;

	const token = req.user;
	const user_id = jwt.decode(token, "secret-hack-admin")._id;

	if (!name || !esd || !eed || !rsd || !red || !desp) {
		// if any of the field is missing this same page will be render
		// with error
		req.flash("error", "All fields are require");
		req.formData("formData", formData);

		return res.redirect("/admin/create-election");
	} else {
		try {
			const newElection = new Models.ElectionModel({
				admin_id: mongoose.Types.ObjectId(user_id),
				name,
				start_date: esd,
				end_date: eed,
				reg_start_date: rsd,
				reg_end_date: red,
				description: desp,
			});

			await newElection.save();
			await Models.AdminModel.findByIdAndUpdate(user_id, {
				$push: {elections: newElection._id},
			}).exec();

			req.flash("success", `${name} election created successfully`);
			return res.redirect("/admin/manage-election");
		} catch (error) {
			return res.render("create_election", {
				error:
					error?.keyValue?.name + " election already exist" ??
					"Internal Server Error",
				formData,
				success: null,
			});
		}
		// Check If email exist already
	}
});

//************** Route To Get To All the Election ************/
router.get("/manage-election", EnsureIsAutheticated, async (req, res) => {
	const token = req.user;
	const user_id = jwt.decode(token, "secret-hack-admin")._id;
	const success = req.flash("success")[0];

	try {
		const elections = await Models.ElectionModel.find(
			{
				admin_id: mongoose.Types.ObjectId(user_id),
			},
			{name: 1}
		).lean();

		console.log({elections});
		res.render("manage_election", {
			result: elections,
			success,
			error: false,
		});
	} catch (err) {
		console.log({err});
	}
});

//************** Route To Get To All the Contest ************/
router.get("/create-contest", EnsureIsAutheticated, (req, res) => {
	const error = req.flash("error")[0];
	const formData = req.flash("formData")[0];

	res.render("create_contest", {
		error,
		formData,
		success: null,
	});
});

//*******Page to create contest */
router.post("/create-contest", EnsureIsAutheticated, async (req, res) => {
	const {name, esd, eed, desp} = req.body;

	const token = req.user;
	const user_id = jwt.decode(token, "secret-hack-admin")._id;

	if (!name || !esd || !eed || !desp) {
		req.flash("error", "All fields are require");
		return res.redirect("/admin/create-contest");
	}

	try {
		const newContest = new Models.ContestModel({
			admin_id: mongoose.Types.ObjectId(user_id),
			name,
			start_date: esd,
			end_date: eed,
			description: desp,
		});

		await newContest.save();
		await Models.AdminModel.findByIdAndUpdate(user_id, {
			$push: {contests: newContest._id},
		}).exec();

		req.flash("success", `${name} contest created successfully`);
		return res.redirect("/admin/manage-contest");
	} catch (error) {
		req.flash(
			"error",
			error?.keyValue?.name + " contest already exist" ??
				"Internal Server Error"
		);
		req.flash("formData", req.body);
		return res.status(301).redirect("/admin/create-contest");
	}
});

//*******Page to manage contest Edit, Delete Payment and Result */
router.get("/manage-contest", EnsureIsAutheticated, async (req, res) => {
	const token = req.user;
	const user_id = jwt.decode(token, "secret-hack-admin")._id;
	// const state1 = "SELECT * FROM `contest` WHERE admin_id = ?";
	const error = req.flash("error")[0];
	const success = req.flash("success")[0];

	try {
		const contests = await Models.ContestModel.find({
			admin_id: mongoose.Types.ObjectId(user_id),
		}).lean();

		console.log({contests});
		res.render("manage_contest", {result: contests, error, success});
	} catch (err) {
		console.log({...err});
		return res.status(400).json(err);
	}
});

//*******************Route to the Election **************/
router.get("/election/:id", EnsureIsAutheticated, async (req, res) => {
	const id = req.params.id;
	const success = req.flash("success")[0];
	const error = req.flash("error")[0];

	const Elections = await Models.ElectionModel.findById(id, {
		name: 1,
		polls: 1,
		candidates: 1,
		voters: 1,
	})
		.populate("polls")
		.populate("candidates")
		.lean()
		.populate("voters", "vote username email")
		.lean();

	if (!Elections) {
		return res.status(404).render("error-404");
	}

	res.cookie("electionState", id);
	return res
		.status(200)
		.render("admin_election", {result: Elections, error, success});
});

//*******************Route to the Election **************/
router.get("/contest/:id", EnsureIsAutheticated, async (req, res) => {
	const id = req.params.id;
	const success = req.flash("success")[0];
	const error = req.flash("error")[0];

	const Contest = await Models.ContestModel.findById(id, {
		name: 1,
		polls: 1,
		contestant: 1,
		voters: 1,
	})
		.populate("polls")
		.populate("contestants")
		.lean()
		.populate("voters", "vote name email")
		.lean();

	if (!Contest) {
		return res.status(404).render("error_404");
	}

	res.cookie("contestState", id);
	return res
		.status(200)
		.render("admin_contest", {result: Contest, error, success});
});

//*********Page to pay a contest */
router.get("/contest/pay/:id", EnsureIsAutheticated, async (req, res) => {
	id = req.params.id;
	res.cookie("contestPaid", id);
	res.render("payment_contest_form");
});

//**********Page To Pay an election */
router.get("/election/pay/:id", EnsureIsAutheticated, async (req, res) => {
	id = req.params.id;
	res.cookie("electionPaid", id);
	res.render("payment_contest_form");
});

//***********Initialize PayStack Payment System */
router.post("/contest/pay", EnsureIsAutheticated, async (req, res) => {
	const form = _.pick(req.body, ["amount", "email", "full_name"]);
	form.metadata = {
		full_name: form.full_name,
	};
	form.amount = 10000 * 100;

	initializePayment(form, (error, body) => {
		if (error) {
			//handle errors
			res.cookie("contestPaid", null);
			res.cookie("electionPaid", null);
			return res.redirect("/admin/error");
		}
		response = JSON.parse(body);
		res.redirect(response.data.authorization_url);
	});
});

//********Handles Paystack Callback  */
router.get("/paystack/callback", EnsureIsAutheticated, async (req, res) => {
	token = req.cookies.auth;
	user_id = jwt.decode(token).id;
	const contest_id = req.cookies.contestPaid;
	const election_id = req.cookies.electionPaid;

	const ref = req.query.reference;
	EnsureIsAutheticatedPayment(ref, (error, body) => {
		if (error) {
			res.cookie("contestPaid", null);
			res.cookie("electionPaid", null);
			//handle errors appropriately
			return res.redirect("/admin/error");
		}
		response = JSON.parse(body);

		const data = _.at(response.data, [
			"reference",
			"amount",
			"customer.email",
			"metadata.full_name",
		]);

		[reference, amount, email, full_name] = data;

		if (contest_id != null) {
			stateC0 =
				"INSERT INTO `receipt` (`ref`, `admin_id`, `contest_id`, `fullname`, `email`) VALUES (?,?,?,?,?);";
			stateC1 = "UPDATE `contest` Set `paid` = 1 Where `id` = ?;";
			stateC = stateC0 + stateC1;
			db.query(
				stateC,
				[reference, user_id, contest_id, full_name, email, contest_id],
				(err, result) => {
					res.cookie("contestPaid", null);
					res.redirect("/admin/success");
				}
			);
		} else if (election_id != null) {
			stateC0 =
				"INSERT INTO `receipt` (`ref`, `admin_id`, `election_id`, `fullname`, `email`) VALUES (?,?,?,?,?);";
			stateC1 = "UPDATE `election` Set `paid` = 1 Where `id` = ?;";
			stateC = stateC0 + stateC1;
			db.query(
				stateC,
				[
					reference,
					user_id,
					election_id,
					full_name,
					email,
					election_id,
				],
				(err, result) => {
					res.cookie("electionPaid", null);
					res.redirect("/admin/success");
				}
			);
		}
	});
});

//**************Success Page After Payment */
router.get("/success", EnsureIsAutheticated, async (req, res) => {
	res.render("success_page");
});

//**************Error Page After Payment */
router.get("/error", EnsureIsAutheticated, async (req, res) => {
	res.render("error_page");
});

//*************** Handle Add Poll ***********/
router.post(
	"/election/:id/add-poll",
	EnsureIsAutheticated,
	async (req, res) => {
		const election_id = req.params.id;
		const name = req.body.name;
		try {
			const newPoll = new Models.PollModel({election_id, name});
			await newPoll.save();

			await Models.ElectionModel.findByIdAndUpdate(election_id, {
				$push: {polls: newPoll._id},
			}).exec();

			req.flash("success", name + " created successfully");
			return res.status(200).redirect(`/admin/election/${election_id}`);
		} catch (error) {
			req.flash("error", error.message ?? "Internal Server Error");
			return res.status(200).redirect(`/admin/election/${election_id}`);
		}
	}
);

//*************** Handle Add Candidate ***********/
router.post("/election/:id/add-can", EnsureIsAutheticated, async (req, res) => {
	const election_id = req.params.id;
	const {position: poll_id, canName: name} = req.body;

	try {
		const newCandidate = new Models.CandidateModel({
			election_id: mongoose.Types.ObjectId(election_id),
			poll_id: mongoose.Types.ObjectId(poll_id),
			name,
		});
		await newCandidate.save();

		await Models.ElectionModel.findByIdAndUpdate(election_id, {
			$push: {candidates: newCandidate._id},
		}).exec();

		req.flash("success", name + " is now a candidate of this election");
		return res.status(200).redirect(`/admin/election/${election_id}`);
	} catch (error) {
		req.flash("error", error.message ?? "Internal Server Error");
		return res.status(200).redirect(`/admin/election/${election_id}`);
	}
});

//*************** Handle Add Poll ***********/
router.post("/contest/:id/add-poll", EnsureIsAutheticated, async (req, res) => {
	const contest_id = mongoose.Types.ObjectId(req.params.id);
	const name = req.body.name;
	try {
		const newContestantPoll = new Models.ContestantPollModel({
			contest_id,
			name,
		});
		await newContestantPoll.save();

		await Models.ContestModel.findByIdAndUpdate(contest_id, {
			$push: {polls: newContestantPoll._id},
		}).exec();

		req.flash("success", name + " created successfully");
		return res.status(200).redirect(`/admin/contest/${contest_id}`);
	} catch (error) {
		req.flash("error", error.message ?? "Internal Server Error");
		return res.status(400).redirect(`/admin/contest/${contest_id}`);
	}
});

//*************** Handle Add Candidate ***********/
router.post("/contest/:id/add-cont", EnsureIsAutheticated, async (req, res) => {
	const contest_id = req.params.id;
	const {position: poll_id, canName: name} = req.body;

	try {
		const newContestant = new Models.ContestantModel({
			contest_id: mongoose.Types.ObjectId(contest_id),
			poll_id: mongoose.Types.ObjectId(poll_id),
			name,
		});
		await newContestant.save();

		await Models.ContestModel.findByIdAndUpdate(contest_id, {
			$push: {contestants: newContestant._id},
		}).exec();

		req.flash("success", name + " added to contestant successfully");
		return res.status(200).redirect(`/admin/contest/${contest_id}`);
	} catch (error) {
		req.flash("error", error.message ?? "Internal Server Error");
		return res.status(400).redirect(`/admin/contest/${contest_id}`);
	}
});

//*******Delete An Election */
router.get(
	"/election/delete-election/:id",
	EnsureIsAutheticated,
	async (req, res) => {
		try {
			const election_id = req.params.id;
			const token = req.user;
			const user_id = jwt.decode(token, "secret-hack-admin")._id;

			await Models.AdminModel.findByIdAndUpdate(user_id, {
				$pull: {elections: election_id},
			}).exec();

			const election = await Models.ElectionModel.findByIdAndDelete(
				election_id
			);

			await Models.PollModel.deleteMany({election_id}).exec();
			await Models.CandidateModel.deleteMany({election_id}).exec();

			await Models.VoterModel.deleteMany({election_id}).exec();

			req.flash("success", `${election?.name} deleted successfully`);
			res.redirect("/admin/manage-election");
		} catch (error) {
			req.flash("error", error.message ?? "Internal Server Error");
			return res.status(400).redirect("/login");
		}
	}
);

//*******Delete An Poll */
router.get(
	"/election/delete-poll/:id",
	EnsureIsAutheticated,
	async (req, res) => {
		const id = req.params.id;
		const electionState = req.cookies.electionState;

		try {
			await Models.ElectionModel.findByIdAndUpdate(electionState, {
				$pull: {polls: id},
			}).exec();

			const poll = await Models.PollModel.findByIdAndDelete(id).exec();
			await Models.CandidateModel.deleteMany({poll_id: id}).exec();

			req.flash("success", `${poll?.name} successfully dropped.`);
			res.redirect(`/admin/election/${electionState}`);
		} catch (error) {
			req.flash("error", error.message ?? "Internal Server Error");
			return res.status(400).redirect(`/admin/election/${electionState}`);
		}
	}
);

//*******Delete An Candidate */
router.get(
	"/election/delete-candidate/:id",
	EnsureIsAutheticated,
	async (req, res) => {
		const id = req.params.id;
		const electionState = req.cookies.electionState;

		try {
			await Models.ElectionModel.findByIdAndUpdate(electionState, {
				$pull: {candidates: id},
			}).exec();

			const candidate = await Models.CandidateModel.findByIdAndDelete(
				id
			).exec();

			req.flash("success", `${candidate?.name} removed successfully.`);
			res.redirect(`/admin/election/${electionState}`);
		} catch (error) {
			req.flash("error", error.message ?? "Internal Server Error");
			return res.status(400).redirect(`/admin/election/${electionState}`);
		}
	}
);

//*******Delete An Contest */
router.get(
	"/contest/delete-contest/:id",
	EnsureIsAutheticated,
	async (req, res) => {
		const contest_id = req.params.id;
		const token = req.user;
		try {
			const user_id = jwt.decode(token, "secret-hack-admin")._id;

			await Models.AdminModel.findByIdAndUpdate(user_id, {
				$pull: {contests: contest_id},
			});

			const contest = await Models.ContestModel.findByIdAndDelete(
				contest_id
			).exec();

			await Models.ContestantPollModel.deleteMany({contest_id}).exec();
			await Models.ContestantModel.deleteMany({contest_id}).exec();
			await Models.ContestVoterModel.deleteMany({contest_id}).exec();

			req.flash("success", `${contest?.name} deleted successfully`);
			res.redirect(`/admin/manage-contest`);
		} catch (error) {
			req.flash("error", error.message ?? "Internal Server Error");
			return res.status(400).redirect(`/admin/manage-contest`);
		}
	}
);

//*******Delete An Categories */
router.get(
	"/contest/delete-category/:id",
	EnsureIsAutheticated,
	async (req, res) => {
		const id = req.params.id;
		const contestState = req.cookies.contestState;
		try {
			await Models.ContestModel.findByIdAndUpdate(contestState, {
				$pull: {polls: id},
			}).exec();

			const poll = await Models.ContestantPollModel.findByIdAndDelete(
				id
			).exec();
			await Models.ContestantModel.deleteMany({poll_id: id}).exec();
			await Models.ContestVoterModel.deleteMany({poll_id: id}).exec();

			req.flash("success", `${poll?.name} successfully dropped.`);
			res.redirect(`/admin/contest/${contestState}`);
		} catch (error) {
			req.flash("error", error.message ?? "Internal Server Error");
			return res.status(400).redirect(`/admin/contest/${contestState}`);
		}
	}
);

//*******Delete An Contestants */
router.get(
	"/contest/delete-contestant/:id",
	EnsureIsAutheticated,
	async (req, res) => {
		const id = req.params.id;
		const contestState = req.cookies.contestState;
		try {
			await Models.ContestModel.findByIdAndUpdate(contestState, {
				$pull: {contestants: mongoose.Types.ObjectId(id)},
			}).exec();
			const contestant = await Models.ContestantModel.findByIdAndDelete(
				id
			).exec();

			req.flash(
				"success",
				`${contestant?.name} removed from contestant successfully.`
			);
			res.redirect(`/admin/contest/${contestState}`);
		} catch (error) {
			req.flash("error", error.message ?? "Internal Server Error");
			return res.status(400).redirect(`/admin/contest/${contestState}`);
		}
	}
);

module.exports = router;
