const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// User Creditials
const adminSchema = Schema(
	{
		name: String,
		username: {
			type: String,
			unique: true,
			required: true,
		},
		email: {
			type: String,
			unique: true,
			required: true,
		},
		password: String,
		elections: {
			type: [
				{
					type: Schema.Types.ObjectId,
					ref: "WedecideElections",
				},
			],
			default: [],
		},
		contests: {
			type: [
				{
					type: Schema.Types.ObjectId,
					ref: "WedecideContests",
				},
			],
			default: [],
		},
	},
	{strict: true, timestamps: true, collection: "WedecideAdmin"}
);

// Election Schema
const electionSchema = Schema(
	{
		admin_id: {type: Schema.Types.ObjectId},
		name: {
			type: String,
			unique: true,
		},
		start_date: {
			type: Date,
			default: Date.now,
		},
		end_date: Date,
		reg_start_date: {
			type: Date,
			default: Date.now,
		},
		reg_end_date: Date,
		description: String,
		polls: {
			type: [{type: Schema.Types.ObjectId, ref: "WedecidePolls"}],
			default: [],
		},
		candidates: {
			type: [{type: Schema.Types.ObjectId, ref: "WedecideCandidates"}],
			default: [],
		},
		voters: {
			type: [{type: Schema.Types.ObjectId, ref: "WedecideVoters"}],
			default: [],
		},
		mobile_voted: {
			type: [String],
			default: [],
		},
		browser_fingerprint: {
			type: [String],
			default: [],
		},
	},
	{
		strict: true,
		collection: "WedecideElections",
		timestamps: true,
	}
);

// Wedecide Poll Schema
const pollSchema = Schema(
	{
		election_id: Schema.Types.ObjectId,
		name: String,
	},
	{
		collection: "WedecidePolls",
		strict: true,
	}
);

// Candidate
const candidateSchema = Schema(
	{
		election_id: {type: Schema.Types.ObjectId, ref: "WedecideElections"},
		poll_id: {type: Schema.Types.ObjectId, ref: "WedecidePolls"},
		name: String,
		vote: {
			type: Number,
			default: 0,
		},
	},
	{
		collection: "WedecideCandidates",
		strict: true,
	}
);

const voterSchema = Schema(
	{
		username: {
			type: String,
			unique: true,
		},
		email: {
			type: String,
			unique: true,
		},
		password: String,
		phone: {
			unique: true,
			type: Number,
		},
		voucher: String,
		election_id: Schema.Types.ObjectId,
		face_path: String,
		vote: Number,
	},
	{
		collection: "WedecideVoters",
		strict: true,
	}
);

const contestSchema = Schema(
	{
		admin_id: {type: Schema.Types.ObjectId, ref: "WedecideAdmin"},
		name: {
			type: String,
			unique: true,
		},
		price: {default: 0, type: Number},
		start_date: {
			type: Date,
			defualt: Date.now,
		},
		end_date: Date,
		description: String,
		polls: {
			type: [
				{type: Schema.Types.ObjectId, ref: "WedecideContestantPolls"},
			],
			default: [],
		},
		contestants: {
			type: [{type: Schema.Types.ObjectId, ref: "WedecideContestants"}],
		},
		voters: {
			type: [{type: Schema.Types.ObjectId, ref: "WedecideContestVoters"}],
			default: [],
		},
		mobile_voted: {
			type: [String],
			default: [],
		},
		browser_fingerprint: {
			type: [String],
			default: [],
		},
	},
	{
		collection: "WedecideContests",
		strict: true,
	}
);

const contestantPollSchema = Schema(
	{
		contest_id: {
			type: Schema.Types.ObjectId,
		},
		poll_id: Schema.Types.ObjectId,
		name: String,
		votes: {
			type: String,
			default: 0,
		},
	},
	{
		collection: "WedecideContestantPolls",
		strict: true,
	}
);

const contestantSchema = Schema(
	{
		contest_id: {
			type: Schema.Types.ObjectId,
		},
		poll_id: {
			type: Schema.Types.ObjectId,
		},
		name: String,
		vote: {
			type: Number,
			default: 0,
		},
	},
	{
		collection: "WedecideContestants",
		strict: true,
	}
);

const contestVoterSchema = Schema(
	{
		name: String,
		email: {
			type: String,
			unique: true,
		},
		voucher: {
			type: String,
			unique: true,
		},
		phone: {
			type: Number,
			unique: true,
		},
		contest_id: {
			type: Schema.Types.ObjectId,
		},
		vote: {
			type: Number,
			default: 0,
		},
		not_counted: {
			type: Boolean,
			default: false,
		},
	},
	{
		collection: "WedecideContestVoters",
		strict: true,
	}
);

const AdminModel =
	mongoose.model.WedecideAdmin ||
	mongoose.model("WedecideAdmin", adminSchema);

const ElectionModel =
	mongoose.model.WedecideElections ||
	mongoose.model("WedecideElections", electionSchema);

const PollModel =
	mongoose.model.WedecidePolls || mongoose.model("WedecidePolls", pollSchema);

const CandidateModel =
	mongoose.model.WedecideCandidates ||
	mongoose.model("WedecideCandidates", candidateSchema);

const VoterModel =
	mongoose.model.WedecideVoters ||
	mongoose.model("WedecideVoters", voterSchema);

const ContestModel =
	mongoose.model.WedecideContests ||
	mongoose.model("WedecideContests", contestSchema);

const ContestantPollModel =
	mongoose.model.WedecideContestantPolls ||
	mongoose.model("WedecideContestantPolls", contestantPollSchema);

const ContestantModel =
	mongoose.model.WedecideContestants ||
	mongoose.model("WedecideContestants", contestantSchema);

const ContestVoterModel =
	mongoose.model.WedecideContestVoters ||
	mongoose.model("WedecideContestVoters", contestVoterSchema);

module.exports = {
	AdminModel,
	ElectionModel,
	PollModel,
	CandidateModel,
	VoterModel,
	ContestModel,
	ContestantPollModel,
	ContestantModel,
	ContestVoterModel,
};
