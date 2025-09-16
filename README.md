# BlogSpace 🚀

![BlogSpace Screenshot](./public/images/screenshot.png)
A full-stack blogging platform built with Node.js, Express, and PostgreSQL. This application allows users to register, log in, and share their thoughts by creating, editing, and deleting their own blog posts.

### 🔗 Live Demo

**[https://blogspace-app.onrender.com](https://blogspace-app.onrender.com)**
---
## ✨ Key Features

- **User Authentication**: Secure user registration and login system using Passport.js. Passwords are fully hashed with `bcrypt`.
- **Full CRUD Functionality**: Users can Create, Read, Update, and Delete their own blog posts.
- **Authorization**: A user can only edit or delete the posts they have created.
- **"My Posts" Dashboard**: A dedicated page for users to view and manage all of their own content.
- **RESTful API Design**: The application follows REST principles for a clean and scalable route structure.
- **Responsive Design**: A clean, user-friendly interface that works on all screen sizes.

---
## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Frontend**: EJS (Embedded JavaScript templates)
- **Database**: PostgreSQL
- **Authentication**: Passport.js, express-session, bcrypt
- **Styling**: HTML5, CSS3, Bootstrap

---
## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

You need to have Node.js and PostgreSQL installed on your local machine.

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/your-username/your-repo-name.git](https://github.com/your-username/your-repo-name.git)
    ```
2.  **Install NPM packages:**
    ```bash
    npm install
    ```
3.  **Set up the database:**
    Connect to your local PostgreSQL instance and run the following SQL commands to create the necessary tables:
    ```sql
    CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL
    );

    CREATE TABLE blogs (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
    );
    ```
4.  **Set up Environment Variables:**
    Create a `.env` file in the root of the project and add the following variables.
    ```
    # PostgreSQL Connection Details
    DB_USER=your_postgres_username
    DB_PASSWORD=your_password
    DB_HOST=localhost
    DB_PORT=5432
    DB_DATABASE=blogspace

    # Session Secret
    SESSION_SECRET=your_super_long_random_secret_string
    ```
5.  **Run the application:**
    ```bash
    npm start
    ```
    The application should now be running on `http://localhost:3000`.

---
## 📄 License

Distributed under the MIT License.

---
## 📧 Contact

Parth Rai - [GitHub Profile](https://github.com/Parth-Rai)
