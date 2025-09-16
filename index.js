import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import bcrypt from "bcrypt";
import flash from "connect-flash"; 
import "dotenv/config";

const app = express();
app.locals.currentYear = new Date().getFullYear(); 
const port = 3000;
const saltRounds = 10;

// -- MIDDLEWARE SETUP --
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

// Session Setup
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 * 24 } 
}));
 
app.use(flash());

// Passport Setup
app.use(passport.initialize());
app.use(passport.session());

// Middleware to pass user info and flash messages to all templates
app.use((req, res, next) => {
    res.locals.user = req.user;
    res.locals.success_msg = req.flash('success');
    res.locals.error_msg = req.flash('error');
    res.locals.error = req.flash('error'); 
    next();
});

// UPDATED: DATABASE CONNECTION FOR DEPLOYMENT
const poolConfig = process.env.DATABASE_URL ? {
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
} : {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
};
const db = new pg.Pool(poolConfig);

// -- PASSPORT AUTHENTICATION STRATEGY --
passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
    try {
        const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);
        if (result.rows.length === 0) {
            return done(null, false, { message: "No user with that email." });
        }
        const user = result.rows[0];
        const isValid = await bcrypt.compare(password, user.password_hash);
        if (isValid) {
            return done(null, user);
        } else {
            return done(null, false, { message: "Incorrect password." });
        }
    } catch (err) {
        return done(err);
    }
}));

passport.serializeUser((user, done) => { done(null, user.id); });
passport.deserializeUser(async (id, done) => {
    try {
        const result = await db.query("SELECT * FROM users WHERE id = $1", [id]);
        done(null, result.rows[0]);
    } catch (err) { done(err); }
});

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { return next(); }
    req.flash('error', 'You need to be logged in to do that.');
    res.redirect("/login");
}

// -- ROUTES --

// Home page
app.get("/", (req, res) => {
    res.render("index.ejs");
});

// All Blogs page
app.get("/blogs", async (req, res) => {
    try {
        const result = await db.query(`
            SELECT blogs.*, users.email as author_email 
            FROM blogs JOIN users ON blogs.user_id = users.id 
            ORDER BY blogs.created_at DESC`);
        res.render("blogs.ejs", { blogs: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching blogs");
    }
});

// Registration Routes
app.get("/register", (req, res) => { res.render("register.ejs"); });
app.post("/register", async (req, res) => {
    const { email, password } = req.body;
    try {
        const checkResult = await db.query("SELECT * FROM users WHERE email = $1", [email]);
        if (checkResult.rows.length > 0) {
            req.flash('error', 'Email already exists. Please log in.');
            return res.redirect("/register");
        }
        const hash = await bcrypt.hash(password, saltRounds);
        await db.query("INSERT INTO users (email, password_hash) VALUES ($1, $2)", [email, hash]);
        req.flash('success', 'Registration successful! Please log in.');
        res.redirect("/login");
    } catch (err) { console.error(err); }
});

// Login Routes
app.get("/login", (req, res) => { res.render("login.ejs"); });
app.post("/login", passport.authenticate("local", {
    successRedirect: "/blogs", 
    failureRedirect: "/login",
    failureFlash: true 
}));

// Logout Route
app.post("/logout", (req, res, next) => {
    req.logout(function(err) {
        if (err) { return next(err); }
        req.flash('success', 'You have been logged out.');
        res.redirect('/');
    });
});

// "My Posts" page
app.get("/my-posts", isAuthenticated, async (req, res) => {
    try {
        const result = await db.query(
            "SELECT * FROM blogs WHERE user_id = $1 ORDER BY created_at DESC",
            [req.user.id]
        );
        res.render("my-posts.ejs", { posts: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching your posts.");
    }
});

// Blog Creation Routes
app.get("/blogs/new", isAuthenticated, (req, res) => { res.render("new.ejs"); });
app.post("/blogs", isAuthenticated, async (req, res) => {
    const { title, content } = req.body;
    try {
        await db.query("INSERT INTO blogs (title, content, user_id) VALUES ($1, $2, $3)", [title, content, req.user.id]);
        req.flash('success', 'Blog post created successfully!');
        res.redirect("/blogs"); 
    } catch (err) { console.error(err); }
});
 
// Route to display a single blog post
app.get("/blogs/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query(`SELECT blogs.*, users.email as author_email FROM blogs JOIN users ON blogs.user_id = users.id WHERE blogs.id = $1`, [id]);
        if (result.rows.length === 0) return res.status(404).send("Blog post not found");
        res.render("show.ejs", { blog: result.rows[0] });
    } catch (err) { console.error(err); res.status(500).send("Error fetching post"); }
});

// Edit & Delete Routes
app.get("/blogs/:id/edit", isAuthenticated, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query("SELECT * FROM blogs WHERE id = $1 AND user_id = $2", [id, req.user.id]);
        if (result.rows.length === 0) return res.status(403).send("Post not found or you're not authorized to edit it.");
        res.render("edit.ejs", { blog: result.rows[0] });
    } catch (err) { console.error(err); }
});

app.post("/blogs/:id/edit", isAuthenticated, async (req, res) => {
    const { id } = req.params;
    const { title, content } = req.body;
    try {
        await db.query("UPDATE blogs SET title = $1, content = $2 WHERE id = $3 AND user_id = $4", [title, content, id, req.user.id]);
        req.flash('success', 'Blog post updated successfully!');
        res.redirect(`/blogs/${id}`);
    } catch (err) { console.error(err); }
});

app.post("/blogs/:id/delete", isAuthenticated, async (req, res) => {
    const { id } = req.params;
    try {
        await db.query("DELETE FROM blogs WHERE id = $1 AND user_id = $2", [id, req.user.id]);
        req.flash('success', 'Blog post deleted successfully!');
        res.redirect("/blogs"); 
    } catch (err) { console.error(err); }
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});