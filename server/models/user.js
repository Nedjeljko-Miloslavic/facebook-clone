const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
	email:{type:String, required:true},
	password:{type:String, required:true},
	ime:{type:String, required:true},
	prezime:{type:String, required:true},
	spol:{type:String, required:true},
	friends:{type:Array, required:true},
	photos:{type:Array, required:true},
	profilePicture:{type:String, required:true},
	messages:{type:Array, required:true},
	date:{type:Object, required:true},
	friendRequests:{type:Array, required:true},
	friendRequestsRecieved:{type:Array, required:true},
});

module.exports = mongoose.model("user", userSchema);