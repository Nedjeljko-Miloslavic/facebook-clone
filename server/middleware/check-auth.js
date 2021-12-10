const jwt = require("jsonwebtoken");

module.exports = (req,res,next)=>{
	try {
		const token = req.headers.authorization.split(" ");
		console.log(token);
		const decoded = jwt.verify(token[1], "secret");
		req.userData = decoded;
		next();
	}catch(error){
		return res.json({
			message:"failed"
		});
	}
	
}