This project implement the RESTful api of blogging platform for the requirement of roadmap.sh backend project (https://roadmap.sh/projects/blogging-platform-api).

This project use **node.js + express** as backend and **PostgreSQL** as database.

To run the project, please install **node.js** and **PostgreSQL**.

1. download the respository and unzip
2. modified the environmnet variable stored in `.env` file according to your database setting.
3. use the command in `creatTable.sql` file to create a table in PostgreSQL to store the articles
4. open terminal and go to project folder, type command `npm install` to install all neccessary npm modules
5. type `node index.js` to run the server.

The port opened is 4000. The path should be http://localhost:4000/XXXX


The API is tested with **Postman**

**Creating a new post**
method `POST`  + path `/posts`
server return the all property of post stored in database
![send post and get reply from database](./screenshot/create_new_post.png)

**Update post**
method `PUT` + path `/posts/id`
server return the updated post stored in database
![update new value of property of the post](./screenshot/update_a_post.png)

**Get a post**
method `GET` + path `/posts/id`
server return the post with specified id
![server return a post](./screenshot/get_a_post.png.png)

**Delete a post**
method `Delete` + path `/posts/id`
server return the post with specified id
![server response 204 code after delete](./screenshot/delete_a_post.png)

**Get all posts**
method `GET` + path `/posts`
server return all posts stored in the database
![server return all post](./screenshot/get_all_post.png)

The posts stored in the table
![table of all posts](./screenshot/posts_stored_in_database.png)

**Search posts contains key word**
method `GET` + path `/posts` + query `?term=health'
server return posts contain the key word
![all posts that contain the key word](./screenshot/search_a_content.png)