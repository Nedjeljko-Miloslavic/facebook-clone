const bcrypt = require("bcrypt");
const User = require("./models/user");
const localStrategy = require("passport-local").Strategy;

function initializePassport(passport){
	const authenticate = (username,password,done)=>{
		User.find({email:username})
		.then(async user=>{
			user = user[0];
			if(!user){
				return done(null,false);
			}else{
				if(await bcrypt.compare(password,user.password)){
					return done(null,user);
				}else{
					return done(null,false);
				}
			}
		})
	}
	passport.use(new localStrategy(authenticate));
	passport.serializeUser((user,done)=>done(null,user.id));
	passport.deserializeUser((id,done)=>{
		User.find({_id:id})
		.then(user=>done(null,user[0]));
	});
}

module.exports = initializePassport;
