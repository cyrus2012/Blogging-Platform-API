import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import env from "dotenv";


const app = express();
const PORT = 4000;

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

env.config();

const database = new pg.Client(
    {
        host: process.env.DATABASE_HOST,
        database: process.env.DATABASE_DATABASE,
        user: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        port: process.env.DATABASE_PORT,
    }
);

database.connect();

async function insertPostToDatabase(post){

    //console.log("inside testDatabaseInsert()");
    //console.log(post);
    const result = await database.query("INSERT INTO blogpost " +
      "(title, content, category, tags, createdate, updateDate) " +
      "VALUES ($1, $2, $3, $4, $5, $6) RETURNING *", 
      [post.title, post.content, post.category, post.tags, post.createDate, post.updateDate]
    );

    return result.rows[0];

}

async function getPostById(postId){

    const result = await database.query("SELECT * FROM blogpost WHERE id=$1", [postId]);

    if(result.rows.length > 0)
      return result.rows[0];

    return null;

}

function isIncomingPostValid(post){
  const keys = Object.keys(post);
  const requiredKeys = Object.keys(dummyIncomingPost);

  let missedFields = new Array();

  for(let i = 0; i < requiredKeys.length; i++){
    if(!keys.includes(requiredKeys[i])){
      missedFields.push(requiredKeys[i]);
    }
  }

  if(missedFields.length > 0){
    const text = "Invalid post. Missing field " + missedFields.join(", ");
    return {isValid: false, message: text};
  }

  return {isValid: true};
}


/*
app.put('/post/:id', async(req, res)=>{
  const id = req.params.id;

  //check if id is a number or not
  if(id.match(/^\d+$/)){
    res.status(200).send("received post id " + id);
  }else
    res.status(400).send("post id is not a pure number");
  
});
*/


app.get('/post/:id', async(req, res)=>{
  const id = req.params.id;

  //check if id is a number or not
  if(id.match(/^\d+$/)){   
    try{
      const post = await getPostById(id);
      if(post)    
        res.status(200).json(post);
      else
        res.status(404).send("cannot find post with id " + id);
    }catch(err){
      console.error("fail to access database", err);
      res.status(500).send("something wrong on database");  
    }

  }else{
    res.status(400).send("post id is not a pure number");
  }

});

app.post("/posts", async (req, res)=>{
  //console.log("req.body");
  //console.log(req.body);
  
  const incomingPost = req.body;
  const result = isIncomingPostValid(incomingPost);
  
  if(result.isValid){
    const today = new Date();
    incomingPost.createDate = today;
    incomingPost.updateDate = today;

    try{
      const result = await insertPostToDatabase(incomingPost);
      res.status(200).json(result);
    }catch(err){
      console.error("something wrong on database.", err);
      res.status(500).send("something wrong happens on database.");
    }
  }else
    res.status(400).json(result.message);

});


app.listen(PORT, () => {
  console.log(`Listening to port ${PORT}`);
});



const today = new Date();
const dummyPost = 
{ 
  title: "test article",
  content: "hi hi",
  category: "Technology",
  tags: ["Tech", "programming"],
  createDate: today,
  updateDate: today
};

const dummyIncomingPost = 
{
  title: "test article",
  content: "hi hi",
  category: "Technology",
  tags: ["Tech", "programming"]
}


//console.log(dummyPost);
//console.log(JSON.stringify(dummyPost));
// test insert post in the database
// try{
//   const result = await insertPostToDatabase(dummyPost);

//   if(result){
//     console.log(result);
//   }else
//     console.log("cannot create post");

// }catch (err){
//   console.log("fail to access database", err);
// }