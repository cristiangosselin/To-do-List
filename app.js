//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect(process.env.MONGODB_URI, {useNewUrlParser: true})

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  // we're connected!
  console.log("DB connected");
});

const itemSchema = new mongoose.Schema ({
  name: String
});

const Item = mongoose.model("Item", itemSchema);

// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];

const food = new Item ({
  name: "Buy Food"
});

const cook = new Item ({
  name: "Cook Food"
});

const eat = new Item ({
  name: "Eat Food"
});

const defaultItems = [food, cook, eat];

const listSchema = new mongoose.Schema ({
  name: String,
  items: [itemSchema]
});

const List = new mongoose.model("List", listSchema);

// Item.insertMany([food, cook, eat], function(err){
//   if (err){
//     console.log(err);
//   } else {
//     console.log("Documents inserted");
//   }
// })

// Item.deleteMany({name: "Cook Food"}, function(err){
//
// });


app.get("/", function(req, res) {

  Item.find(function(err, foundItems){
    if (err){
      console.log(err);
    } else {
      console.log(foundItems);
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  })

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item ({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, listFounded){
      listFounded.items.push(item);
      listFounded.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function(req, res){

  const checkedItemId = req.body.checkbox;
  const listName = _.capitalize(req.body.list);

  if (listName === "Today") {
    Item.deleteOne({_id: checkedItemId}, function(err){
      if (err){
        console.log(err);
      } else {
        console.log("Deleted", typeof(checkedItemId));
        res.redirect("/");
      }
    })
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundedList){
      res.redirect("/" + listName);
    })
  }


});

app.get("/:costumListName", function(req, res){
  const costumListName = _.capitalize(req.params.costumListName);
  List.findOne({name: costumListName}, function(err, foundList){
    if (!err) {
      if (!foundList){
        const list = new List ({
          name: costumListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + costumListName)
      } else {
        console.log(foundList);
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
      }
    }
  })

  //
});

// app.get("/work", function(req,res){
//   res.render("list", {listTitle: "Work List", newListItems: workItems});
// });

app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function() {
  console.log("Server started on port 3000");
});
