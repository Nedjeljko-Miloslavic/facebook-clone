const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require("bcrypt");
const User = require("./models/user");
const passport = require("passport");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const initializePassport = require("./passport-config");
//const FileStore = require('session-file-store')(session);

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));
app.use(cors({
	credentials:true,
	origin: "http://localhost:3000"
}));

app.use(session({
	secret:"secret",
	resave:true,
	saveUninitialized:true
}));
app.use(cookieParser('secret'));
initializePassport(passport);
app.use(passport.initialize());
app.use(passport.session());

const dbURI = "mongodb://netninja:test1234@cluster0-shard-00-00.814s0.mongodb.net:27017,cluster0-shard-00-01.814s0.mongodb.net:27017,cluster0-shard-00-02.814s0.mongodb.net:27017/facebook?ssl=true&replicaSet=atlas-75h9bd-shard-0&authSource=admin&retryWrites=true&w=majority";

mongoose.connect(dbURI)
.then(result=>{
	app.listen(5000);
	console.log("listening");
})
.catch(err=>console.log(err));

app.get("/users", (req,res)=>{
	User.find()
	.then(users=>{
		res.json(users);
	});
});
app.delete("/users", (req,res)=>{
	User.deleteMany()
	.then(result=>{
		res.json(result);
	});
});
app.post("/usersFind",(req,res)=>{
	User.find({email:req.body.adresa})
	.then(result=>{
		res.json(result);
	});
});
app.post("/user", async (req,res)=>{
	console.log(req.body);
	const hashedPassword = await bcrypt.hash(req.body.lozinka,10);
	const user = new User({
		ime:req.body.ime,
		email:req.body.adresa,
		prezime:req.body.prezime,
		password:hashedPassword,
		spol:req.body.spol,
		friendRequests:[],
		friends:[],
		photos:[],
		profilePicture:"none",
		messages:[],
		date:{year:req.body.godina,month:req.body.mjesec, day:req.body.dan}
	});
	user.save()
	.then(result=>res.send("user created"))
	.catch(err=>console.log(err));
	
});


app.post("/login",(req,res,next)=>{
	passport.authenticate("local", (err,user,info)=>{
		if(err) throw err;
		if(!user){
			res.send({user:"no user"});
		}else{
			req.logIn(user, err=>{
				if(err) throw err;
				res.json(req.user);
				//console.log(req.user);
			});
			
		}
	})(req,res,next);
});
app.get('/logout', (req, res,next)=>{
	req.logout();
	res.clearCookie("connect.sid");
	req.session.destroy();
	next();
});

app.get("/test", (req,res)=>{
	if(req.user){
		res.json({authenticated:true,user:req.user});
	}else{
		res.json({authenticated:false}); 
	}
});

app.patch("/update/:id", (req,res)=>{
	User.findByIdAndUpdate(req.params.id, {prezime:"novoPrezime"})
	.then(result=>res.json(result));
});


//FIRENDS

app.post("/addFriend",async (req,res,next)=>{
	await User.findByIdAndUpdate(req.user._id, {friendRequests:[...req.user.friendRequests,req.body.friend._id]})
	.catch(err=>console.log(err));
	let friendRequestsUnique = req.body.friend.friendRequestsRecieved.filter((value,index,self)=>self.indexOf(value)===index);
	await User.findByIdAndUpdate(req.body.friend._id,{friendRequestsRecieved:[...friendRequestsUnique,req.user._id.toString()]})
	.catch(err=>console.log(err));
	next();
});
app.post("/removeRequest", async (req,res,next)=>{
	await User.findByIdAndUpdate(req.user._id, {friendRequests:req.user.friendRequests.filter(request=>request!==req.body.friend._id)})
	.catch(err=>console.log(err));
	let friendRequestsUnique = req.body.friend.friendRequestsRecieved.filter((value,index,self)=>self.indexOf(value)===index);
	await User.findByIdAndUpdate(req.body.friend._id,{friendRequestsRecieved:friendRequestsUnique.filter(request=>request!==req.user._id.toString())})
	.catch(err=>console.log(err));
	next();
});
app.post("/acceptFriend", async (req,res,next)=>{
	let uniqueFriends = req.user.friends;
	uniqueFriends.push(req.body.friend._id);
	uniqueFriends = uniqueFriends.filter((value,index,self)=>self.indexOf(value)===index);
	let userRequests = req.user.friendRequests.filter(request=>request!==req.body.friend._id);
	let userRequestsRecieved = req.user.friendRequestsRecieved.filter(request=>request!==req.body.friend._id);
	
	let uniqueFriendFriends = req.body.friend.friends;
	uniqueFriendFriends.push(req.user._id.toString());
	uniqueFriendFriends = uniqueFriendFriends.filter((value,index,self)=>self.indexOf(value)===index);
	let friendReqs = req.body.friend.friendRequests.filter(request=>request!==req.user._id.toString());
	let friendReqRecieved = req.body.friend.friendRequestsRecieved.filter(request=>request!==req.user._id.toString());
	console.log(friendReqs,friendReqRecieved);
	await User.findByIdAndUpdate(req.user._id,{friends:uniqueFriends,friendRequests:userRequests,friendRequestsRecieved:userRequestsRecieved})
	.catch(err=>console.log(err));
	await User.findByIdAndUpdate(req.body.friend._id,{friends:uniqueFriendFriends,friendRequests:friendReqs,friendRequestsRecieved:friendReqRecieved})
	.catch(err=>console.log(err));
	
	next();
});
app.post("/unfriend", async (req,res,next)=>{
	await User.findByIdAndUpdate(req.user._id,{friends:req.user.friends.filter(friend=>friend!==req.body.friend._id)})
	.catch(err=>console.log(err));
	await User.findByIdAndUpdate(req.body.friend._id,{friends:req.body.friend.friends.filter(friend=>friend!==req.user._id.toString())})
	.catch(err=>console.log(err));
	next();
});




//messages------------------
app.post("/messagesend", async (req,res,next)=>{
	await User.findByIdAndUpdate(req.user._id, {messages:[...req.user.messages,{direction:"exiting",body:req.body.message}]})
	.catch(err=>console.log(err));
	await User.findByIdAndUpdate(req.body.id, {messages:[...req.user.messages,{direction:"incoming",body:req.body.message}]})
	.catch(err=>console.log(err));
	next();
});
