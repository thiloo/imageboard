DROP TABLE IF EXISTS comments;
CREATE TABLE comments(
    id SERIAL primary key,
    comment_id INT,
    time_added TIMESTAMP default current_timestamp,
    image_id INT NOT NULL,
    name VARCHAR(255),
    comment VARCHAR(255),
    type VARCHAR(255)
);
