import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import env from "dotenv";


const app = express();
const PORT = 4000;
const TABLE="blogpost";


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

    const result = await database.query("INSERT INTO "+ TABLE + " " +
      "(title, content, category, tags, createdate, updateDate) " +
      "VALUES ($1, $2, $3, $4, $5, $6) RETURNING *", 
      [post.title, post.content, post.category, post.tags, post.createDate, post.updateDate]
    );

    return result.rows[0];

}

async function getPostById(postId){

    const result = await database.query("SELECT * FROM " + TABLE + " WHERE id=$1", [postId]);


    if(result.rows.length > 0)
      return result.rows[0];

    return null;

}

async function getAllPost(){

    const result = await database.query("SELECT * FROM " + TABLE);

    return result.rows;

}

async function searchPostByTerm(term){
  
  const result = await database.query("SELECT * FROM " + TABLE + " WHERE title ILIKE $1 " +
    "OR content ILIKE $1 OR category ILIKE $1" , ['%'+term+'%']);
  
  return result.rows;
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

function accountPostFields(post){
  const keys = Object.keys(post);
  const postKeys = Object.keys(dummyIncomingPost);

  let validKeys = new Array();

  for(let i = 0; i < postKeys.length; i++){
    if(keys.includes(postKeys[i])){
      validKeys.push(postKeys[i]);
    }
  }

  return validKeys;

}

/**
 * It will return the content of the post after update, or null if post does not exist
 * @param {number} id post id
 * @param {object} post post object
 * @param {string[]} validKeys contain the valid keys to update the post, should not be empty or null
 */
async function updatePosttoDatabase(id, post, validKeys){
  
  let setValue;
  let fields = [];
  
  for(let i = 0; i < validKeys.length; i++){

    if(i == 0){
      setValue = `SET ${validKeys[i]} = $${i+1}`;
    }else{
      setValue += `, ${validKeys[i]} = $${i+1}`;
    }

    fields.push(post[validKeys[i]]);

  }

  setValue += `, updateDate=$${validKeys.length + 1}`;
  fields.push(new Date());

  const query = "UPDATE " + TABLE + " " + setValue + " WHERE id=" + id + " RETURNING *";

  const result = await database.query(query, fields);

  if(result.rows.length > 0)
    return result.rows[0];

  return null;
}


async function deletePostFromDatabase(id){
  const result = await database.query("DELETE FROM " + TABLE + " WHERE id=$1 RETURNING id", [id]);
  
  return result.rows.length;
}


app.delete('/posts/:id', async(req, res)=>{
  const id = req.params.id;

  if(id.match(/^\d+$/)){
    try{
      const result = await deletePostFromDatabase(id);
      if(result > 0)
        return res.status(204).send('deleted post ${id}');
      else
        return res.status(404).send(`Post ${id} does not found`);
    }catch(err){
      console.error("something wrong on the database", err);
      return res.status(500).send("something wrong on the database");
    }
  
  }else{
      return res.status(400).send("path '/posts/id' where id should be a number");
  }

});


app.put('/posts/:id', async(req, res)=>{
  const id = req.params.id;

  //check if id is a number or not
  if(id.match(/^\d+$/)){
    //res.status(200).send("received post id " + id);
    const post = req.body;
    const validKeys = accountPostFields(post);
    if(validKeys.length > 0){

      try{
          const result = await updatePosttoDatabase(id, post, validKeys);
          //console.log(result);
          if(result)
            return res.status(200).send(result);

          return res.status(404).send("Post does not exit.");

      }catch(err){
          console.error("something wrong on the database", err);
          return res.status(500).send("something wrong on database");
      }

    }else{
      return res.status(400).send("The post does not contain valid field to update.");  
    }

  }else
    return res.status(400).send("post id is not a pure number");
});


app.get('/posts', async(req, res)=>{

  try{

    let posts;
    if(req.query.term){
      posts = await searchPostByTerm(req.query.term);
    }else{
      posts = await getAllPost();
    }

    res.status(200).send(posts);

  }catch(err){
    console.error("something wrong on the database", err);
    res.status(500).send("something wrong on database");  
  }
})

app.get('/posts/:id', async(req, res)=>{
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
      console.error("something wrong on the database", err);
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
      console.error("something wrong on the database", err);
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