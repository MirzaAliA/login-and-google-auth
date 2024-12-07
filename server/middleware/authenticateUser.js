const jwt = require('jsonwebtoken');


const authenticateUser = (req, res, next) =>{
    const token = req.cookies.token;
    // const account = 
    // console.log(token)

    if (!token) {
        return res.redirect('/');
    }

    try {
        const user = jwt.verify(token, process.env.MY_SECRET);
        // console.log(user)
    
        req.user = user;

        next();
    }
    catch (error) {
        res.clearCookie('token');
        return res.redirect('/')
    }
}



module.exports = authenticateUser;