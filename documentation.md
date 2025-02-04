# Documentation for Running Visitor Database Management System

This documentation provides instructions on how to set up and run a Visitor Management System using Node.js and PostgreSQL. The system allows you to add, list, update, view, and delete visitor records.

## Project Setup

### Prerequisites

Ensure you have the following installed:

    •	Node.js (v12 or higher)
    •	PostgreSQL ( via Docker)
    •	Docker 
    •	A text editor or IDE (e.g., Visual Studio Code)

### Environment Variables

Create a .env file in the root of the project with the following content:

```
POSTGRES_USER=visitors
POSTGRES_DATABASE=db
POSTGRES_PASSWORD=pass
POSTGRES_PORT=5432
POSTGRES_HOST=localhost
```

### PostgreSQL Setup Using Docker

  ### 1.	Create a Docker Compose file:
In your project root, create a file named docker-compose.yml with the following content:

``` 
services:
  postgres:
    image: postgres:latest
    environment:
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=${POSTGRES_DATABASE}
    volumes:
      - ./postgres_data:/var/lib/postgresql/data
    ports:
      - 5432:5432

  adminer:
    image: adminer
    restart: always
    ports:
      - 8080:8080
```

### 2. Install Dependencies

    1.	Install Dependencies:
In your project root, run the following command to install necessary packages:

```
npm install 
```

###  3.	Run PostgreSQL:
In your terminal, navigate to your project directory and run:

```
docker-compose up -d
```

This command will start the PostgreSQL and Adminer services. You can access Adminer at http://localhost:8080.


## Code Overview

#### connect.js

This file establishes a connection to the PostgreSQL database using the connection pool from the pg library

#### visitors.js

This file contains all the queries and functions for managing visitors. The functions include adding, listing, updating, viewing, and deleting visitors. It also includes input validation.

#### Usage of Functions: 

##### createTable()
Creates the visitors table if it doesn’t already exist. Call this before running any other operations to ensure the table is available.

```
node -e "require('./src/visitors.js').createTable().then(console.log).catch(console.error)"
```

##### addNewVisitor(visitor)
Inserts a new visitor into the database. You need to pass an object with the following properties:

    •	name (string)
    •	age (integer)
    •	dateOfVisit (string in YYYY-MM-DD format)
    •	timeOfVisit (string in HH:MM format)
    •	assistant (string)
    •	comments (optional string)

Example usage:

```
node -e "
  const visitor = {
    name: 'John Doe',
    age: 30,
    dateOfVisit: '2024-10-01',
    timeOfVisit: '14:30',
    assistant: 'Jane Smith',
    comments: 'First visit'
  };
require('./src/visitors').addNewVisitor(visitor).then(console.log).catch(console.error);
"

```

##### listAllVisitors()
Fetches a list of all visitors, returning an array of visitor IDs and names.

```
node -e "require('./src/visitors.js').listAllVisitors().then(console.log).catch(console.error)"
```

##### deleteVisitor(id)
Deletes a visitor by their ID. Throws an error if the visitor is not found.

```
node -e "
const id = 1;
require('./src/visitors').deleteVisitor(id).then(console.log).catch(console.error);
"
```

#### deleteAllVisitors()

Deletes all visitors in the database.

```
node -e "
require('./src/visitors').deleteAllVisitors().then(console.log).catch(console.error);
"
```

##### updateVisitor(id, columnToUpdate, updatedVisitor)
Updates a visitor’s details. You need to provide the visitor’s ID and an object with updated fields (same structure as addNewVisitor).

```
node -e "
const id = 1; // Visitor ID
const columnToUpdate = 'name'; // Column to update
const newValue = 'John Doe'; // New value for the column
require('./src/visitors').updateVisitor(id, columnToUpdate, newValue).then(console.log).catch(console.error); "
```

##### viewVisitor(id)
Fetches detailed information about a visitor by their ID.

```
node -e "
const id = 123; // visitor id
require('./src/visitors.js').viewVisitor(id).then(console.log).catch(console.error)"
```

##### viewLastVisitor()
Returns details of the last visitor (based on the most recent ID).

```
node -e "require('./src/visitors.js').viewLastVisitor().then(console.log).catch(console.error)"
```

For further information, please refer to the Node.js documentation and the PostgreSQL documentation.