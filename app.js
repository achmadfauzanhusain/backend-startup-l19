const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const methodOverride = require('method-override');

const authRouter = require("./app/auth/router")
const userRouter = require("./app/user/router")
const postRouter = require("./app/post/router")

const app = express();
app.use(cors());

app.use(methodOverride('_method'));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use("/auth", authRouter)
app.use("/user", userRouter)
app.use("/post", postRouter)

module.exports = app;
