# TechHub — E-Commerce Web Application

A Node.js e-commerce store for PC components built with Express, MySQL, and EJS.

---

## What This Project Does

- Browse 200+ PC components across 9 categories (CPU, GPU, RAM, Storage, Motherboard, PSU, Cooling, Case, Mini PC)
- Search and filter products
- Register an account and log in
- Add products to a shopping cart or wishlist
- Checkout and place orders
- View order history and edit your profile
- Reset your password via email

---

## Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Runtime    | Node.js                           |
| Framework  | Express.js                        |
| Database   | MySQL 8.0 (via mysql2)            |
| Templates  | EJS                               |
| Styling    | Bootstrap 5 + custom CSS          |
| Auth       | express-session + bcrypt          |
| Security   | helmet, csurf, validator          |
| Email      | nodemailer                        |

---

## Project Structure

```
TechHub/
├── server.js          # All routes and app logic
├── db.js              # MySQL database connection
├── auth.js            # Login/guest middleware
├── schema.sql         # Database tables + seed data (202 products)
├── .env               # Environment variables (not committed to git)
├── package.json
├── public/
│   ├── css/style.css  # All custom styles
│   ├── js/main.js     # Client-side JavaScript
│   └── images/        # Local product images (optional)
└── views/
    ├── index.ejs           # Home page (product grid)
    ├── product.ejs         # Single product page
    ├── cart.ejs            # Shopping cart
    ├── checkout.ejs        # Checkout form
    ├── order-confirmation.ejs
    ├── orders.ejs          # Order history
    ├── wishlist.ejs        # Saved products
    ├── profile.ejs         # Edit account
    ├── login.ejs
    ├── register.ejs
    ├── forgot-password.ejs
    ├── reset-password.ejs
    └── partials/
        ├── header.ejs      # Navbar + carousel (included on every page)
        └── footer.ejs      # Footer (included on every page)
```

---

## Setup Instructions

### 1. Install dependencies

```bash
npm install
```

### 2. Create the `.env` file

Create a file called `.env` in the project root with the following content:

```
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASS=your_mysql_password
DB_NAME=pcparts_db
SESSION_SECRET=any_long_random_string_here
APP_URL=http://localhost:3000
PORT=3000

# Optional — only needed for password reset emails
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_gmail_app_password
```

### 3. Set up the database

Open MySQL and run the schema file to create all tables and insert the 202 products:

```bash
mysql -u your_username -p < schema.sql
```

Or open `schema.sql` in MySQL Workbench and click Run.

### 4. Start the server

```bash
npm start
```

Then open your browser and go to: **http://localhost:3000**

---

## Security Features

| # | Feature | How |
|---|---------|-----|
| 1 | Secure HTTP headers | `helmet` sets headers to prevent XSS, clickjacking, etc. |
| 2 | Password hashing | `bcrypt` — passwords are never stored in plain text |
| 3 | SQL injection prevention | Parameterized queries (`?` placeholders) used everywhere |
| 4 | Input validation | `validator` library checks emails, lengths, formats |
| 5 | Secure sessions | `httpOnly` cookies, session regeneration on login |
| 6 | CSRF protection | `csurf` hidden token on every form |

---

## Pages Overview

| URL | Description | Who can access |
|-----|-------------|----------------|
| `/` | Home — product grid with search & filters | Everyone |
| `/product?id=X` | Product detail page | Everyone |
| `/cart` | Shopping cart | Everyone (login prompt if not logged in) |
| `/checkout` | Place an order | Logged-in users only |
| `/orders` | Order history | Logged-in users only |
| `/wishlist` | Saved products | Logged-in users only |
| `/profile` | Edit account info | Logged-in users only |
| `/register` | Create account | Guests only |
| `/login` | Sign in | Guests only |
| `/forgot-password` | Request reset email | Guests only |
| `/reset-password` | Set new password | Guests only (via email link) |
