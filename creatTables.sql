CREATE TABLE blogPost(  
    id INT NOT NULL PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    title TEXT NOT NULL,
    content TEXT,
    category TEXT,
    tags TEXT[],
    createDate TIMESTAMP,
    updateDate TIMESTAMP
);