//jshint esversion:6

const express = require("express");  // backend framework

const bodyParser = require("body-parser");  // Allows to extract data from form submitted by user

const ejs = require("ejs");  // used for templating ie injecting code from one html file/template to other
                             // hence reducing redundant code need to be written again and again

const _ = require("lodash"); // Helps in data aligning ie for properly formating all data so it can store them proper
                             // Ex - Day-1,Day 1,day 1,DAy 1 all will be converted to day 1 so gives flexibility

const mongoose = require("mongoose"); // mongoose provides us with easy way to deal with mongoDB database rather
                                      // than using mongoDB driver which is abit difficult to deal with due to long
                                      // code required for achieving different CRUD operations

mongoose.set('strictQuery', true);    // To avoid warnings coming in terminal

// Connecting to mongoDB database 
// If dairyDB exist then it connects to it , else it creates new database named dairyDB
// Also sometimes database is not visible till an entry is added to it so be aware
mongoose.connect("mongodb://127.0.0.1:27017/dairyDB", {useNewUrlParser: true});

const homeStartingContent = "Lacus vel facilisis volutpat est velit egestas dui id ornare. Semper auctor neque vitae tempus quam. Sit amet cursus sit amet dictum sit amet justo. Viverra tellus in hac habitasse. Imperdiet proin fermentum leo vel orci porta. Donec ultrices tincidunt arcu non sodales neque sodales ut. Mattis molestie a iaculis at erat pellentesque adipiscing. Magnis dis parturient montes nascetur ridiculus mus mauris vitae ultricies. Adipiscing elit ut aliquam purus sit amet luctus venenatis lectus. Ultrices vitae auctor eu augue ut lectus arcu bibendum at. Odio euismod lacinia at quis risus sed vulputate odio ut. Cursus mattis molestie a iaculis at erat pellentesque adipiscing.";
const aboutContent = "Hac habitasse platea dictumst vestibulum rhoncus est pellentesque. Dictumst vestibulum rhoncus est pellentesque elit ullamcorper. Non diam phasellus vestibulum lorem sed. Platea dictumst quisque sagittis purus sit. Egestas sed sed risus pretium quam vulputate dignissim suspendisse. Mauris in aliquam sem fringilla. Semper risus in hendrerit gravida rutrum quisque non tellus orci. Amet massa vitae tortor condimentum lacinia quis vel eros. Enim ut tellus elementum sagittis vitae. Mauris ultrices eros in cursus turpis massa tincidunt dui.";
const contactContent = "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero.";

// Creating an instance app with express
const app = express();

// Setting view engine to EJS -- Embedded JavaScript templates allowing us to use templating
// all templates goes under views folder which is default requirement of ejs
app.set('view engine', 'ejs');

// Setting app to use body parser
app.use(bodyParser.urlencoded({extended: true}));

// Setting app to look for static files like CSS and images inside public folder 
// so our server can serve files that aren't being generated on the fly and exposes this directory publicly for all. 
// It handles all the file loading and prevents path traversal attacks.
app.use(express.static("public"));

// Creating database Schema with mongoose , schema is a javascript object
// Key(title) is the entry to store value that use gives as input, type - type of data that key will store
const dairySchema = new mongoose.Schema({
  title:{
    type: String,
    required: true
  },
  content: String
});

// Creating model from Schema . Model is similar to table in SQL databases
const Page = mongoose.model("Page", dairySchema);
//      |                      |        |
//  model name       collection/table   Schema
//                   name needs to be in singular of what you want you table name
//                   mongoose will automatically convert it to pural and in lower case to "pages" as collection name

var posts = [];

// Route to handle get request , req = request comming from browser , res = response that we will send
app.get("/", function (req,res) {

  posts = []; // array to store posts

  // find is used to find specific entry in database that matches given condition here no condition is specified
  // so entire pages of diary are returned in form of array ar and argument in callback function
  Page.find(function (err, pageArray) {
    if(err){
      console.log('err');
    } else {
      posts = pageArray;
    }
    // render functionality is provided by ejs. here we render home.ejs template and we are sending some data
    // inform of javascript object to render on home page
    res.render("home", {startContent: homeStartingContent, posts: posts});
  });
});

app.get("/about", function (req,res) {
  res.render("about", {aboutContent: aboutContent});
});

app.get("/contact", function (req,res) {
  res.render("contact", {contactContent: contactContent});
});

app.get("/compose", function (req,res) {
  res.render("compose");
});

// Functionality to view wach post/page seperately, here :post allows a dynamic routing ie whatever is placed
// in place of post (/posts/my-post) can be taken as parameter
app.get("/posts/:post", function (req,res) {
  const post = req.params.post;   // accessing value of post parameter so (as per example post = my-post)
  
  // findOne finds the one entry in database that have title = lodash.lowerCase(my-app) ie title = my app
  // we can specify multiple conditions seperated by comma in {} ie in 1st argument, in 2nd arument we have
  // call back function in which we get to access the first found entery , if none found it return null
  Page.findOne({title: _.lowerCase(post)}, function (err, foundOne) {
    if(err){
      res.redirect("/");
    } else {
      if(foundOne){
        res.render("post", {title: _.capitalize(foundOne.title), content: foundOne.content});
      } else {
        res.redirect("/");  // redirect user to "/" route 
      }
    }
  });
  // below is method with for loop for non-database , array based approach

  // for(var i=0;i<posts.length;i++){
  //   if(_.lowerCase(posts[i].title) == _.lowerCase(req.params.post))
  //   {
  //     res.render("post", {title: posts[i].title, content: posts[i].content});
  //   }
  //   else {
  //     {
  //       res.redirect("/");
  //     }
  //   }
  // }
});

// allows user to compose new diary page
app.post("/compose", function (req,res) {

  // Creating new page object using Page model
  const page = new Page({
    title: _.lowerCase(req.body.composeTitle),
    content: req.body.content
  })
  page.save();  // saves the entry in the database

  // below is non-database ,array based approach to store posts

  // const post = {
  //   title: req.body.composeTitle,
  //   content: req.body.content
  // };
  // posts.push(post);
  res.redirect("/");  
});

// Listner hosting server at port 3000 on local host

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
