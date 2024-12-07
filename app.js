require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const expressLayouts = require('express-ejs-layouts');
const cookieParser = require('cookie-parser');
const User = require('./server/models/User');
const authenticateUser = require('./server/middleware/authenticateUser');
const logoutUser = require('./server/middleware/logoutUser');
const AccountGoogle = require('./server/models/GoogleAcc');

const { google } = require('googleapis');


const connectDB = require('./server/config/db');

const app = express();
const port = 3000 || process.env.port;

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

//connect to DB
connectDB();

//templating engine
app.use(expressLayouts);
app.set('layout', './layouts/main');
app.set('view engine', 'ejs');


//Konfigurasi Auth Google
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://127.0.0.1:3000/auth/google/callback'
);

const scopes = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
];

const authorizationUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    include_granted_scopes: true
});



app.get('/', async (req, res) => {
    res.render('index', {
        title: 'Halaman Login',
    })
})

app.post('/', logoutUser, async (req, res) => {
    res.redirect('/')
});

//GOOGLE LOGIN
app.get('/auth/google', async (req, res) => {
    res.redirect(authorizationUrl);
})

app.post('/auth/google', async (req, res) => {
    res.redirect(authorizationUrl);
})

//CALLBACK LOGIN GOOGLE
app.get('/auth/google/callback', async (req, res) => {
    try{
        const { code } = req.query;
        console.log(req.query)

        const { tokens } = await oauth2Client.getToken(code);
        console.log(tokens)
    
        oauth2Client.setCredentials(tokens);
    
        const oauth2 = google.oauth2({
            auth: oauth2Client,
            version: 'v2'
        })
    
        const { data } = await oauth2.userinfo.get();

        // console.log(data);
    
        if (!data.email || !data.name) {
            return res.json({
                data: data
            })
        }
    
        const user = await AccountGoogle.findOne({ email: data.email });

        // console.log(user)
    
        if (!user) {
            // const newGoogleUser = new AccountGoogle({
            //     id: data.id,
            //     name: data.name,
            //     email: data.email,
            //     address: '-'
            // })
            // await newGoogleUser.save();
            
            await AccountGoogle.insertMany({
                id: data.id,
                name: data.name,
                email: data.email,
                address: '-'
            })
        }
    
        const googleUser = await AccountGoogle.findOne({ email: data.email });
        // console.log(googleUser)
        const payload = { name: googleUser.name, email: googleUser.email, address: googleUser.address };
    
        const token = jwt.sign(payload, process.env.MY_SECRET, { expiresIn: '1h' });
    
        res.cookie('token', token, {
            httpOnly: true,
        });
    
        return res.redirect('/welcome');
    }
    catch (error) {
        console.error(error);
    }
})

app.post('/welcome', async (req, res) => {
    const { username, password } = req.body;

    const user = await User.findOne({ username: username });

    if (user && user.password === password) {
        const payload = { username: user.username, password: user.password }

        const token = jwt.sign(payload, process.env.MY_SECRET, { expiresIn: '1h' });

        res.cookie('token', token, {
            httpOnly: true,
        });

        return res.redirect('welcome');
    } else {
        return res.status(403).json({
            error: 'invalid login',
        });
    }
})

app.get('/welcome', authenticateUser, async (req, res) => {
    res.render('welcome', {
        title: 'Halaman Welcome',
        user: req.user,
    })
})

app.get('/home', authenticateUser, async (req, res) => {
    res.render('home', {
        title: 'Halaman Home',
        user: req.user
    })
})

app.post('/home', authenticateUser, async (req, res) => {
    res.redirect('home');
})



app.listen(port, () => {
    console.log(`App listening to port ${port}`);
});

