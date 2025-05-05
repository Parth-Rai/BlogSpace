import express from "express";
import bodyParser from "body-parser";
const app = express();
const port = 3000;
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
var blogArr=[]; 
app.get("/",(req,res)=>{
    res.render("index.ejs");
});
app.post("/submit",(req,res)=>{
    blogArr.push(`${req.body["blog"]}`);
    res.render("index.ejs",{
        blogs:blogArr
    });
});
app.post("/edit",(req,res)=>{
    blogArr[req.body["blogNum"]-1]=req.body["updatedText"];
    res.render("index.ejs",{
        blogs:blogArr
    });
});
app.post("/delete",(req,res)=>{
    const index = req.body["blogNum"]-1
    if (index > -1) { // only splice array when item is found
        blogArr.splice(index, 1); // 2nd parameter means remove one item only
    }
    res.render("index.ejs",{
        blogs:blogArr
    });
});
app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});