import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import env from "dotenv";


const app = express();
const PORT = 4000;

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

async function testDatabaseInsert(post){

    //console.log("inside testDatabaseInsert()");
    //console.log(post);
    const result = await database.query("INSERT INTO blogpost " +
      "(title, content, category, tags, createdate, updateDate) " +
      "VALUES ($1, $2, $3, $4, $5, $6) RETURNING *", 
      [post.title, post.content, post.category, post.tags, post.createDate, post.updateDate]
    );

    if(result.rows.length > 0){
      return result.rows[0];
    }

    console.log("cannot insert post");
    return null;

}



app.listen(PORT, () => {
  console.log(`Listening to port ${PORT}`);
});



const today = new Date();
const newpost = [
  { 
    title: "test article",
    content: "hi hi",
    category: "Technology",
    tags: ["Tech", "programming"],
    createDate: today,
    updateDate: today
  },
]


//console.log(newpost);
//console.log(JSON.stringify(newpost[0]));
try{
  const result = await testDatabaseInsert(newpost[0]);

  if(result){
    console.log(result);
  }else
    console.log("cannot create post");

}catch (err){
  console.log("fail to access database", err);
}