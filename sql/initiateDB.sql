DROP TABLE IF EXISTS images;
CREATE TABLE images(
    id SERIAL primary key,
    time_added TIMESTAMP default current_timestamp,
    url VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    description VARCHAR(255),
    tags VARCHAR(255)
);
