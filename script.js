require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const { MongoClient } = require('mongodb');
const app = express();
const port = 3000;

app.use(express.json());

// MongoDB connection setup
const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
let db, usersCollection;

// Connect to MongoDB
async function connectToDatabase() {
    try {
        await client.connect();
        db = client.db();
        usersCollection = db.collection('users');
        console.log('Connected to MongoDB Atlas');
    } catch (error) {
        console.error('Error connecting to MongoDB Atlas:', error);
    }
}

connectToDatabase();

// Sign-Up Route
app.post('/signup', async (req, res) => {
    const { firstName, lastName, email, dob, country, password } = req.body;

    // Check if the user already exists
    const userExists = await usersCollection.findOne({ email });
    if (userExists) {
        return res.json({ success: false, message: 'User already exists' });
    }

    // Hash the password using bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user into the database
    const result = await usersCollection.insertOne({
        firstName,
        lastName,
        email,
        dob,
        country,
        password: hashedPassword,
    });

    if (result.insertedCount === 1) {
        return res.json({ success: true, message: 'Sign-Up Successful' });
    } else {
        return res.json({ success: false, message: 'Sign-Up Failed' });
    }
});

// Login Route
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // Find the user by email
    const user = await usersCollection.findOne({ email });
    if (!user) {
        return res.json({ success: false, message: 'User not found' });
    }

    // Compare hashed passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (isPasswordValid) {
        return res.json({ success: true, message: 'Login Successful' });
    } else {
        return res.json({ success: false, message: 'Invalid password' });
    }
});

// Start the Express server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
