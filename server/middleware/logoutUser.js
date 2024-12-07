const logoutUser = (req, res, next) => {
    try {
        res.clearCookie('token');
        next();
    }
    catch (error) {
        console.error(error);
    }
    
}

module.exports = logoutUser;