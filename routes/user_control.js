const {AdminModel} = require("../model");
const bcrypt = require("bcryptjs");
const {indexOf} = require("lodash");

const AddUsers = async (body) => {
	try {
		// const email = await Users.findOne({Email: body.Email});
		// if (email?._id) return {message: "User Already Exist By Email"};

		if (body.password !== body.conPass)
			return {type: "error", message: "Password didn't match"};

		const salt = await bcrypt.genSalt(10);
		const hash = await bcrypt.hash(body.password, salt);

		console.log({hash});

		// const _id = new mongoose.Types.ObjectId();

		const user = new AdminModel({...body, password: hash});

		console.log({user});
		await user.save();

		return {type: "success", message: "User registered successfully"};
	} catch (error) {
		console.error({...error});

		if (error.keyValue) {
			return {
				type: "error",
				message: `${
					error.keyValue.username ?? error.keyValue.email
				} already exist`,
			};
		}

		return {type: "error", message: error.message};
	}
};

const CheckUsers = async (body) => {
	try {
		const user = await AdminModel.findOne(
			{
				username: body.username,
			},
			{username: 1, name: 1, password: 1}
		);

		if (!user) throw Error("Incorrect username or password");
		const compare = await bcrypt.compare(body.password, user.password);

		if (!compare) throw Error("Incorrect Username or Password");

		delete user.password;
		return {user};
	} catch (error) {
		console.error({error});
		return {user: null, message: error.message};
	}
};

module.exports = {AddUsers, CheckUsers};
