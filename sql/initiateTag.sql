DROP TABLE IF EXISTS tags;
CREATE TABLE tags(
    id SERIAL primary key,
    time_added TIMESTAMP default current_timestamp,
    tag VARCHAR(255) NOT NULL,
    image_id VARCHAR(255)
);
